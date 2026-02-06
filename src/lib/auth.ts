import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { JWT } from "next-auth/jwt";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email dan password harus diisi");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                    include: { tenant: true }
                });

                if (!user) {
                    throw new Error("Email tidak terdaftar");
                }

                if (!user.isActive) {
                    throw new Error("Akun tidak aktif, hubungi administrator");
                }

                const isPasswordValid = await compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Password salah");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenantName: user.tenant?.name || null,
                    tenantSlug: user.tenant?.slug || null
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role || "user";
                token.tenantId = user.tenantId || null;
                token.tenantName = user.tenantName || null;
                token.tenantSlug = user.tenantSlug || null;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.tenantId = token.tenantId as string | null;
                session.user.tenantName = token.tenantName as string | null;
                session.user.tenantSlug = token.tenantSlug as string | null;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
        error: "/login"
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60 // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET
});

// Extend NextAuth types
declare module "next-auth" {
    interface User {
        role: string;
        tenantId: string | null;
        tenantName: string | null;
        tenantSlug: string | null;
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            tenantId: string | null;
            tenantName: string | null;
            tenantSlug: string | null;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        tenantId: string | null;
        tenantName: string | null;
        tenantSlug: string | null;
    }
}
