import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

/**
 * A throw inside a section used to unmount the whole tree and leave a white
 * page. Keep the failure inside the content pane so the nav still works.
 */
export class SettingsErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Settings section crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="space-y-2">
        <h1 className="text-lg font-semibold text-fg">
          This section didn&apos;t load
        </h1>
        <p className="text-sm text-fg-muted">
          Something went wrong rendering it. Reload the page, and if it keeps
          happening the details are in the browser console.
        </p>
      </div>
    );
  }
}
