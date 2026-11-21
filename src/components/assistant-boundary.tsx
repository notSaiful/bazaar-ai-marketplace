"use client";
import { Component, type ReactNode } from "react";

/** A crash in the assistant must never take the page down. */
export class AssistantBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error("Assistant crashed", error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-lg">
        <span>The assistant hit a problem.</span>
        <button className="font-medium text-accent underline" onClick={() => this.setState({ failed: false })}>Try again</button>
      </div>
    );
  }
}
