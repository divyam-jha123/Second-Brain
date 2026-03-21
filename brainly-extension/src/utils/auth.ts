const TOKEN_KEY = "brainexpo_token";

export async function getToken(): Promise<string> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([TOKEN_KEY], (result) => {
        resolve((result?.[TOKEN_KEY] as string) || "");
      });
    });
  }
  return localStorage.getItem(TOKEN_KEY) || "";
}

export async function saveToken(token: string): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [TOKEN_KEY]: token }, () => resolve());
    });
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export async function logout(): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([TOKEN_KEY], () => resolve());
    });
  }
  localStorage.removeItem(TOKEN_KEY);
}

