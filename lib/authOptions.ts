import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { sendNewLoginEmail } from "@/src/modules/auth/auth-emails.service";
import { consumeLoginOtp } from "@/src/modules/auth/login-otp.service";
import { profileAvatarUrl } from "@/src/modules/auth/avatar";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user?.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email,
          image: user.avatar ? profileAvatarUrl(user.updatedAt) : null,
        };
      },
    }),
    CredentialsProvider({
      id: "email-token",
      name: "Token por e-mail",
      credentials: {
        email: { label: "Email", type: "email" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !/^\d{6}$/.test(credentials.token ?? "")) {
          return null;
        }

        return consumeLoginOtp(credentials.email, credentials.token);
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  events: {
    async signIn({ user }) {
      if (!user.email) return;
      try {
        await sendNewLoginEmail(user.email);
      } catch (error) {
        console.error("Erro ao enviar alerta de novo login:", error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) token.id = user.id;

      if (trigger === "update" && token.id) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true, email: true, avatar: true, updatedAt: true },
        });

        if (currentUser) {
          token.name = currentUser.name;
          token.email = currentUser.email;
          token.picture = currentUser.avatar
            ? profileAvatarUrl(currentUser.updatedAt)
            : null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      session.user.image = token.picture ?? null;
      return session;
    },
  },
};
