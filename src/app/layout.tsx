import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deterministic B2B Sales OS",
  description: "Autonomous deterministic B2B sales operating system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-indigo-500/30">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-inner">
                OS
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">
                Sales OS
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/import"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Import
              </Link>
            </nav>
          </div>

          <div>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.clear();
                  window.location.href = "/login";
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-rose-950/60 hover:border-rose-700 hover:text-rose-200 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
