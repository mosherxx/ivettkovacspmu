import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ivett Kovacs PMU | Sminktetoválás",
  description: "Természetes hatású sminktetoválás. Szolgáltatások, árak és online időpontfoglalás.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body className="antialiased">{children}</body>
    </html>
  );
}
