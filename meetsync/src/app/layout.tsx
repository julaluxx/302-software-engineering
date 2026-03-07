import type { Metadata } from "next";
import AuthProvider from "@/components/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title:       "MeetSync — หาเวลาว่างตรงกัน",
  description: "Group meeting scheduler ง่าย ไว นัดหมายทันใจ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}