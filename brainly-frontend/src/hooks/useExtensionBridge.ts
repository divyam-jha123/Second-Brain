import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";

const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID ?? "";

export type ExtensionStatus = "checking" | "connected" | "not_installed";

type RuntimeAPI = {
  sendMessage?: (
    extensionId: string,
    message: { type: string; token?: string },
    callback?: (response?: { ok?: boolean }) => void,
  ) => void;
  lastError?: unknown;
};

type ChromeAPI = {
  runtime?: RuntimeAPI;
};

export function useExtensionBridge() {
  const { getToken, isSignedIn } = useAuth();
  const [status, setStatus] = useState<ExtensionStatus>("checking");

  useEffect(() => {
    if (!isSignedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("not_installed");
      return;
    }

    const runtime = (globalThis as { chrome?: ChromeAPI }).chrome?.runtime;

    if (!runtime?.sendMessage || !EXTENSION_ID) {
      setStatus("not_installed");
      return;
    }

    runtime.sendMessage(EXTENSION_ID, { type: "PING" }, (response: { ok?: boolean } | undefined) => {
      if (runtime.lastError || !response?.ok) {
        setStatus("not_installed");
        return;
      }

      getToken().then((token) => {
        if (!token) return;
        runtime.sendMessage?.(EXTENSION_ID, { type: "SET_TOKEN", token }, () => setStatus("connected"));
      });
    });
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (status !== "connected" || !EXTENSION_ID) return;

    const runtime = (globalThis as { chrome?: ChromeAPI }).chrome?.runtime;
    if (!runtime?.sendMessage) return;

    const interval = setInterval(async () => {
      const token = await getToken();
      if (token) {
        runtime.sendMessage?.(EXTENSION_ID, { type: "SET_TOKEN", token });
      }
    }, 45_000);

    return () => clearInterval(interval);
  }, [status, getToken]);

  useEffect(() => {
    if (!isSignedIn && status === "connected" && EXTENSION_ID) {
      const runtime = (globalThis as { chrome?: ChromeAPI }).chrome?.runtime;
      runtime?.sendMessage?.(EXTENSION_ID, { type: "CLEAR_TOKEN" });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("not_installed");
    }
  }, [isSignedIn, status]);

  return { status };
}

