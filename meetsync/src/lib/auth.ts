import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Google OAuth ──────────────────────────────────────
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Guest Mode (ชื่อเท่านั้น ไม่มี password) ──────────
    CredentialsProvider({
      id:   "guest",
      name: "Guest",
      credentials: {
        name: { label: "ชื่อ", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.name?.trim()) return null;

        // สร้าง guest user แบบ in-memory (ไม่บันทึก DB)
        return {
          id:    `guest_${Date.now()}`,
          name:  credentials.name.trim(),
          email: null,
          image: null,
          role:  "guest",
        };
      },
    }),
  ],

  // ── Pages ────────────────────────────────────────────────
  pages: {
    signIn:  "/login",
    signOut: "/login",
    error:   "/login",   // error query param จะถูกส่งมาที่นี่
  },

  // ── Callbacks ────────────────────────────────────────────
  callbacks: {
    // เพิ่ม role และ id เข้า token
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role ?? "user";
      }
      return token;
    },

    // expose ค่าจาก token ออกมาใน session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },

    // หลัง login สำเร็จ — redirect ไปหน้า dashboard หรือหน้าที่ค้างไว้
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/"))     return `${baseUrl}${url}`;
      return `${baseUrl}/events`;
    },
  },

  // ── Session strategy ─────────────────────────────────────
  session: {
    strategy:    "jwt",
    maxAge:      7 * 24 * 60 * 60, // 7 วัน
    updateAge:   24 * 60 * 60,     // refresh ทุก 1 วัน
  },

  // ── Security ─────────────────────────────────────────────
  secret: process.env.NEXTAUTH_SECRET,

  // ── Debug (เปิดตอน dev เท่านั้น) ─────────────────────────
  debug: process.env.NODE_ENV === "development",
};