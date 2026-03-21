import { FRONTEND_URL } from "../config";

type LoginViewProps = {
  checking: boolean;
  onRecheck: () => Promise<void>;
};

export function LoginView({ checking, onRecheck }: LoginViewProps) {
  const openSignIn = () => {
    chrome.tabs?.create?.({ url: `${FRONTEND_URL}/sign-in` });
  };

  return (
    <section className="card">
      <p className="muted">
        Sign in on Brain Expo in your browser. After signing in, come back and
        continue.
      </p>

      <button className="primary-btn" onClick={openSignIn}>
        Sign in to Brain Expo
      </button>

      <button
        className="secondary-btn"
        onClick={() => void onRecheck()}
        disabled={checking}
      >
        {checking ? "Checking..." : "I've signed in"}
      </button>
    </section>
  );
}

