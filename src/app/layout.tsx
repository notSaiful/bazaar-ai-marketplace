import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { CartProvider, CartDrawer } from "@/components/cart";
import { Assistant } from "@/components/assistant";
import { AssistantBoundary } from "@/components/assistant-boundary";
import { getSession } from "@/lib/session";
import { LangToggle } from "@/components/lang-toggle";
import { RevealObserver } from "@/components/reveal";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Bazaar AI: one cart, many makers", template: "%s · Bazaar AI" },
  description: "AI-first multi-vendor marketplace: photo-to-listing, Hinglish search, one checkout, transparent commission.",
};
export const viewport: Viewport = { themeColor: "#141416", width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}document.documentElement.classList.add('js-reveal');setTimeout(function(){if(!window.__rv)document.documentElement.classList.remove('js-reveal')},3000);`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return (
    <html lang={s.lang} className={geist.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">Skip to content</a>
        <CartProvider>
          <Header />
          <main id="main" className="mx-auto min-h-[70dvh] max-w-6xl px-4 py-10 pb-24">{children}</main>
          <footer className="mt-24 border-t border-line">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold tracking-tight">Bazaar<span className="text-pop">.</span></div>
                <p className="mt-1 text-sm text-muted">One cart, many makers. Demo mode, test payments.</p>
              </div>
              <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                <a className="hover:text-fg" href="/search">Shop</a>
                <a className="hover:text-fg" href="/orders">Orders</a>
                <a className="hover:text-fg" href="/account">Account</a>
                <a className="hover:text-fg" href="/.well-known/ucp">For AI agents</a>
                <LangToggle lang={s.lang} />
              </nav>
            </div>
          </footer>
          {s.role === "customer" && <AssistantBoundary><Assistant /></AssistantBoundary>}
          <CartDrawer />
          <RevealObserver />
        </CartProvider>
      </body>
    </html>
  );
}
