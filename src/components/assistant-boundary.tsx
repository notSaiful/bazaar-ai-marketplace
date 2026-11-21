"use client";
import { Component, type ReactNode } from "react";
import { useT } from "./lang";

function Failed({ retry }: { retry: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-lg">
      <span>{t("error.assistant")}</span>
      <button className="font-medium text-accent underline" onClick={retry}>{t("action.tryAgain")}</button>
    </div>
  );
}

/** A crash in the assistant must never take the page down. */
export class AssistantBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error("Assistant crashed", error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <Failed retry={() => this.setState({ failed: false })} />;
  }
}
