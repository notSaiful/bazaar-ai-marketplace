import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { CartProvider, CartDrawer } from "@/components/cart";
import { AssistantLazy } from "@/components/assistant-lazy";
import { aiEnabled } from "@/lib/claude";
import { AssistantBoundary } from "@/components/assistant-boundary";
import { getSession } from "@/lib/session";
import { LangToggle } from "@/components/lang-toggle";
import { RevealObserver } from "@/components/reveal";
import { LiveClock } from "@/components/live-clock";
import { SideNav } from "@/components/side-nav";
import { sideNavData } from "@/lib/nav";
import { getWishlistIds } from "@/lib/wishlist";
import { WishlistProvider } from "@/components/wishlist";
import { BottomNav } from "@/components/bottom-nav";
import { GuidedTour, TourStartButton } from "@/components/guided-tour";
import { Suspense } from "react";
import { LangProvider } from "@/components/lang";
import { clientMessages, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Bazaar AI: one cart, many makers", template: "%s · Bazaar AI" },
  description: "AI-first multi-vendor marketplace: photo-to-listing, Hinglish search, one checkout, transparent commission.",
};
export const viewport: Viewport = { themeColor: "#09090a", width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}document.documentElement.classList.add('js-reveal');setTimeout(function(){if(!window.__rv)document.documentElement.classList.remove('js-reveal')},3000);`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const shop = s.role === "customer";
  return (
    <html lang={s.lang} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">{t("a11y.skip", s.lang)}</a>
        <LangProvider lang={s.lang} msgs={clientMessages(s.lang, s.role)}>
        <CartProvider>
          <WishlistProvider initial={s.role === "customer" ? await getWishlistIds() : []}>
          <div className="flex min-h-dvh">
            {!shop && <Suspense><SideNav d={sideNavData(s)} /></Suspense>}
            <div className={`flex min-w-0 flex-1 flex-col ${shop ? "pb-16 md:pb-0" : ""}`}>
              <Header />
              <main id="main" className={`mx-auto w-full flex-1 px-4 py-8 sm:px-8 sm:py-10 ${shop ? "max-w-7xl" : "max-w-6xl"}`}>{children}</main>
              <footer className="border-t border-line">
                <div className={`mx-auto grid w-full gap-8 ${shop ? "max-w-7xl" : "max-w-6xl"} px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:px-8`}>
                  <div>
                    <div className="text-sm font-semibold tracking-tight">Bazaar</div>
                    <p className="mt-1 max-w-xs text-sm text-muted">{t("brand.tagline", s.lang)}</p>
                  </div>
                  <nav aria-label={t("nav.footer", s.lang)} className="flex flex-col gap-2 text-sm">
                    <p className="text-xs font-medium text-muted">{t("nav.shop", s.lang)}</p>
                    <a className="hover:text-muted" href="/search">{t("nav.allProducts", s.lang)}</a>
                    <a className="hover:text-muted" href="/wishlist">{t("nav.wishlist", s.lang)}</a>
                    <a className="hover:text-muted" href="/orders">{t("nav.orders", s.lang)}</a>
                    <a className="hover:text-muted" href="/account">{t("nav.account", s.lang)}</a>
                  </nav>
                  <nav aria-label={t("nav.resources", s.lang)} className="flex flex-col gap-2 text-sm">
                    <p className="text-xs font-medium text-muted">{t("nav.resources", s.lang)}</p>
                    <a className="hover:text-muted" href="/credits">{t("nav.photoCredits", s.lang)}</a>
                    <a className="hover:text-muted" href="/.well-known/ucp">{t("nav.forAgents", s.lang)}</a>
                    {shop && <TourStartButton />}
                    <span className="text-muted"><LangToggle lang={s.lang} /></span>
                  </nav>
                  <LiveClock />
                </div>
              </footer>
            </div>
          </div>
          {shop && <AssistantBoundary><AssistantLazy aiLive={aiEnabled()} /></AssistantBoundary>}
          {shop && <BottomNav />}
          {shop && <GuidedTour />}
          <CartDrawer />
          <RevealObserver />
          </WishlistProvider>
        </CartProvider>
        </LangProvider>
      </body>
    </html>
  );
}
