import { API_URL } from "../config";

export async function hasBackendSession(token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/notes`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  return res.ok;
}

export async function createNote(title: string, link: string, token?: string): Promise<void> {
  const res = await fetch(`${API_URL}/notes/create-note`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ title, link }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create note: ${res.status}`);
  }
}

