import { useEffect, useMemo, useState } from "react";
import { LoginView } from "./components/LoginView";
import { SaveView } from "./components/SaveView";
import { createNote, hasBackendSession } from "./utils/api.ts";
import { getToken } from "./utils/auth";

type TabInfo = {
  title: string;
  link: string;
};

const DEFAULT_TAB: TabInfo = {
  title: "",
  link: "",
};

function App() {
  const [token, setToken] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [tab, setTab] = useState<TabInfo>(DEFAULT_TAB);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<string>("");
  const isLoggedIn = useMemo(() => isAuthenticated, [isAuthenticated]);

  const detectAuth = async () => {
    setCheckingAuth(true);
    try {
      const saved = await getToken();
      setToken(saved);
      const ok = await hasBackendSession(saved || undefined);
      setIsAuthenticated(ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    void detectAuth();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || typeof chrome === "undefined" || !chrome.tabs?.query) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const active = tabs[0];
      const next: TabInfo = {
        title: active?.title || "Untitled",
        link: active?.url || "",
      };
      setTab(next);
      setTitle(next.title);
      setLink(next.link);
    });
  }, [isLoggedIn]);

  const handleSaveNote = async () => {
    try {
      setStatus("Saving...");
      await createNote(title, link, token || undefined);
      setStatus("Saved to Brain Expo!");
    } catch (err) {
      console.error(err);
      setStatus("Failed to save. Please sign in on Brain Expo and try again.");
    }
  };

  return (
    <main className="popup">
      <header className="popup-header">
        <h1>Brain Expo</h1>
        <button className="link-btn" onClick={() => void detectAuth()}>
          Refresh
        </button>
      </header>

      {!isLoggedIn ? (
        <LoginView checking={checkingAuth} onRecheck={detectAuth} />
      ) : (
        <SaveView
          tab={tab}
          title={title}
          link={link}
          status={status}
          onChangeTitle={setTitle}
          onChangeLink={setLink}
          onSave={handleSaveNote}
        />
      )}
    </main>
  );
}

export default App;
