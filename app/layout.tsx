import type { Metadata } from "next";
import "./globals.css";

/**
 * The faces are served from public/hero and declared with @font-face in
 * globals.css.
 *
 * They came through next/font before, which sets --font-display and
 * --font-body on the html element. That collides with the theme block, which
 * declares the same two properties on :root, and which one wins depends on
 * stylesheet order. Declaring them in one place removes the ambiguity.
 */

export const metadata: Metadata = {
  title: "Tribunal — every claim gets a trial",
  description:
    "Paste any AI answer. Claims are extracted, prosecuted by an adversarial agent panel, and ruled on with sources.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
