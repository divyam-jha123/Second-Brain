import axios from "axios";
import { API_URL } from "../config";

export type Collection = {
  _id: string;
  name: string;
  order: number;
  count: number;
};

export type Tag = {
  name: string;
  count: number;
};

const authConfig = (token: string | null) => ({
  headers: { Authorization: `Bearer ${token}` },
  withCredentials: true,
});

export const fetchCollections = async (token: string | null): Promise<Collection[]> => {
  const res = await axios.get(`${API_URL}/collections`, authConfig(token));
  return res.data.collections ?? [];
};

export const createCollection = async (
  token: string | null,
  name: string,
): Promise<Collection> => {
  const res = await axios.post(`${API_URL}/collections`, { name }, authConfig(token));
  return res.data.collection;
};

export const renameCollection = async (
  token: string | null,
  id: string,
  name: string,
): Promise<void> => {
  await axios.patch(`${API_URL}/collections/${id}`, { name }, authConfig(token));
};

export const deleteCollection = async (
  token: string | null,
  id: string,
): Promise<void> => {
  await axios.delete(`${API_URL}/collections/${id}`, authConfig(token));
};

export const fetchTags = async (token: string | null): Promise<Tag[]> => {
  const res = await axios.get(`${API_URL}/tags`, authConfig(token));
  return res.data.tags ?? [];
};

export const renameTag = async (
  token: string | null,
  from: string,
  to: string,
): Promise<void> => {
  await axios.patch(
    `${API_URL}/tags/${encodeURIComponent(from)}`,
    { name: to },
    authConfig(token),
  );
};

export const deleteTag = async (token: string | null, name: string): Promise<void> => {
  await axios.delete(`${API_URL}/tags/${encodeURIComponent(name)}`, authConfig(token));
};

export type NotePatch = {
  title?: string;
  note?: string;
  tags?: string[];
  collectionId?: string | null;
};

export const patchNote = async (
  token: string | null,
  id: string,
  patch: NotePatch,
): Promise<void> => {
  await axios.patch(`${API_URL}/notes/${id}`, patch, authConfig(token));
};

export type ShareScope = "all" | "collection" | "tag" | "items";

export type ShareSelection = {
  scope: ShareScope;
  collectionId?: string;
  tag?: string;
  noteIds?: string[];
};

export type ShareLink = {
  _id: string;
  hash: string;
  scope: ShareScope;
  collectionId?: string | null;
  tag?: string | null;
  noteIds?: string[];
  label?: string;
  createdAt?: string;
};

export const createShareLink = async (
  token: string | null,
  selection: ShareSelection,
): Promise<{ hash: string; link?: ShareLink }> => {
  const res = await axios.post(`${API_URL}/notes/share`, selection, authConfig(token));
  return { hash: res.data.hash, link: res.data.link };
};

export const fetchShareLinks = async (
  token: string | null,
): Promise<ShareLink[]> => {
  const res = await axios.get(`${API_URL}/notes/share`, authConfig(token));
  return res.data.links ?? [];
};

export const revokeShareLink = async (
  token: string | null,
  hash: string,
): Promise<void> => {
  await axios.delete(`${API_URL}/notes/share/${hash}`, authConfig(token));
};

// ─── User & onboarding ──────────────────────────────────────────────

export type Me = {
  username: string | null;
  email: string | null;
  topics: string[];
  onboardingCompletedAt: string | null;
  tourCompletedAt: string | null;
};

export const syncUser = async (
  token: string | null,
  body: { username: string; email: string },
): Promise<void> => {
  await axios.post(`${API_URL}/user/sync`, body, authConfig(token));
};

export const fetchMe = async (token: string | null): Promise<Me> => {
  const res = await axios.get(`${API_URL}/user/me`, authConfig(token));
  return res.data.user;
};

export type OnboardingPayload = {
  skip?: boolean;
  topics?: string[];
  weeklyEmail?: {
    enabled: boolean;
    sections: {
      savedThisWeek: boolean;
      untaggedNudge: boolean;
      recallQuestions: boolean;
    };
    day: number;
    hour: number;
    timezone: string;
  };
};

export const completeOnboarding = async (
  token: string | null,
  payload: OnboardingPayload,
): Promise<void> => {
  await axios.post(`${API_URL}/user/onboarding`, payload, authConfig(token));
};

export const completeTour = async (token: string | null): Promise<void> => {
  await axios.post(`${API_URL}/user/tour-complete`, {}, authConfig(token));
};

export type EmailPrefs = {
  featureAnnouncements: boolean;
  weeklyDigest: boolean;
  unsubscribedAll: boolean;
  digestSections: {
    savedThisWeek: boolean;
    untaggedNudge: boolean;
    recallQuestions: boolean;
  };
  digestDay: number;
  digestHour: number;
  timezone: string;
  consentedAt: string | null;
  unsubscribedAt: string | null;
  lastDigestSentAt: string | null;
  email: string | null;
};

export type EmailPrefsPatch = Partial<
  Pick<
    EmailPrefs,
    "featureAnnouncements" | "weeklyDigest" | "digestDay" | "digestHour" | "timezone"
  > & { digestSections: Partial<EmailPrefs["digestSections"]>; email: string }
>;

const EMAIL_PREF_DEFAULTS: EmailPrefs = {
  featureAnnouncements: true,
  weeklyDigest: true,
  unsubscribedAll: false,
  digestSections: {
    savedThisWeek: true,
    untaggedNudge: true,
    recallQuestions: false,
  },
  digestDay: 0,
  digestHour: 9,
  timezone: "UTC",
  consentedAt: null,
  unsubscribedAt: null,
  lastDigestSentAt: null,
  email: null,
};

/**
 * Fill in anything the API left out. An older deployment answers with only the
 * three original flags, and reading `digestSections` off that response used to
 * throw and blank the page.
 */
const normalizePrefs = (raw: Partial<EmailPrefs> | undefined): EmailPrefs => ({
  ...EMAIL_PREF_DEFAULTS,
  ...raw,
  digestSections: {
    ...EMAIL_PREF_DEFAULTS.digestSections,
    ...raw?.digestSections,
  },
});

export const fetchEmailPrefs = async (
  token: string | null,
  timezone: string,
): Promise<EmailPrefs> => {
  const res = await axios.get(
    `${API_URL}/email/preferences?timezone=${encodeURIComponent(timezone)}`,
    authConfig(token),
  );
  return normalizePrefs(res.data?.preferences);
};

export const patchEmailPrefs = async (
  token: string | null,
  patch: EmailPrefsPatch,
): Promise<EmailPrefs> => {
  const res = await axios.put(
    `${API_URL}/email/preferences`,
    patch,
    authConfig(token),
  );
  return normalizePrefs(res.data?.preferences);
};

/** Not built yet — the route answers 501 until the digest job exists. */
export const sendDigestNow = async (token: string | null): Promise<void> => {
  await axios.post(`${API_URL}/email/send-now`, {}, authConfig(token));
};
