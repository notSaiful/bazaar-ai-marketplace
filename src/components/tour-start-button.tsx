"use client";
import { useT } from "./lang";

/**
 * Footer "Take the tour" link. Kept apart from the tour itself so the footer does not pull the tour's code
 * into every page; the tour loads after the page and listens for "start-tour". The flag covers a click
 * that lands before the tour has loaded.
 */
export function TourStartButton() {
  const t = useT();
  const start = () => {
    (window as Window & { __bzTourRequested?: boolean }).__bzTourRequested = true;
    window.dispatchEvent(new Event("start-tour"));
  };
  return <button type="button" onClick={start} className="text-left hover:text-muted">{t("tour.start")}</button>;
}
