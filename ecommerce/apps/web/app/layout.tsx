import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ecommerce Store",
  description: "MERN/Next.js ecommerce storefront",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-brand-600">
              Store
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="hover:text-brand-600">
                Products
              </Link>
              <Link href="/cart" className="hover:text-brand-600">
                Cart
              </Link>
              <Link href="/login" className="hover:text-brand-600">
                Login
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-slate-500">
            © {new Date().getFullYear()} Ecommerce Store
          </div>
        </footer>
      </body>
    </html>
  );
}
