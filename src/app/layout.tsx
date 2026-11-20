import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { CartProvider, CartDrawer } from "@/components/cart";
import { Assistant } from "@/components/assistant";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Bazaar AI: one cart, many makers", template: "%s · Bazaar AI" },
  description: "AI-first multi-vendor marketplace: photo-to-listing, Hinglish search, one checkout, transparent commission.",
};
export const viewport: Viewport = { themeColor: "#d9480f", width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return (
    <html lang={s.lang} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">Skip to content</a>
        <CartProvider>
          <Header />
          <main id="main" className="mx-auto min-h-[70dvh] max-w-7xl px-4 py-6">{children}</main>
          <footer className="border-t border-line py-8 text-center text-xs text-muted">Bazaar AI prototype · test mode · synthetic data · payments are simulated unless Razorpay test keys are set</footer>
          {s.role === "customer" && <Assistant />}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
