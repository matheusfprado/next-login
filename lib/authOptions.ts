import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { twilioClient } from "@/lib/twilio";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email,
        };
      },
    }),
    CredentialsProvider({
      name: "Telefone (OTP)",
      id: "otp-phone",
      credentials: {
        phone: { label: "Telefone", type: "text" },
        code: { label: "Código", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null;
        }

        const phone = normalizePhone(credentials.phone);
        if (!phone) {
          return null;
        }

        try {
          const verificationCheck = await twilioClient.verify
            .services(process.env.TWILIO_VERIFY_SID!)
            .verificationChecks.create({
              to: phone,
              code: credentials.code,
            });

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
          user = await prisma.user.create({
            data: { phone, name: null, email: null },
          });
        }

        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          phone: user.phone,
        };
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
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
};
