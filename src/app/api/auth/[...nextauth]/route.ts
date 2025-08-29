import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import twilio from "twilio";

// Configura Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Login tradicional com email e senha
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),

    // Login via OTP (telefone)
    CredentialsProvider({
      name: "Telefone (OTP)",
      id: "otp-phone",
      credentials: {
        phone: { label: "Telefone", type: "text" },
        code: { label: "Código", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) return null;

        const { phone, code } = credentials;

        try {
          const verificationCheck = await twilioClient.verify
            .services(process.env.TWILIO_VERIFY_SID!)
            .verificationChecks.create({ to: phone, code });

          if (verificationCheck.status !== "approved") {
            console.log("Código OTP inválido");
            return null;
          }
        } catch (err) {
          console.error("Erro ao verificar OTP:", err);
          return null;
        }

        let user = await prisma.user.findFirst({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({ data: { phone } });
        }

        return { id: user.id, phone: user.phone };
      },
    }),
  ],

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
