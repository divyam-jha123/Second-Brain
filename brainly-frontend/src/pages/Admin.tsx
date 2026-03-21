import { useState } from "react";
import { useAuth } from "@clerk/react";
import { Sidebar } from "../components/sidebar";
import axios from "axios";
import { API_URL } from "../config";
import { Button } from "../components/button";
import { useEmailSync } from "../hooks/useEmailSync";

export function AdminEmail() {
  const { getToken } = useAuth();
  useEmailSync();
  const [subject, setSubject] = useState("🚀 New Feature: Magic Links");
  const [title, setTitle] = useState("Log in without passwords");
  const [body, setBody] = useState(
    "We've just launched Magic Links! You can now log into your BrainExpo account with a single click from your email. No more remembering passwords.",
  );
  const [ctaText, setCtaText] = useState("Try it now");
  const [ctaUrl, setCtaUrl] = useState("http://localhost:5173/dashboard");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{ sent?: number; errors?: number; msg?: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setResult(null);

    try {
      const token = await getToken();
      const res = await axios.post(
        `${API_URL}/email/send-announcement`,
        { subject, title, body, ctaText, ctaUrl },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setStatus("success");
      setResult(res.data);
    } catch (err: unknown) {
      setStatus("error");
      if (axios.isAxiosError(err)) {
        setResult({ msg: err.response?.data?.msg || err.message });
      } else if (err instanceof Error) {
        setResult({ msg: err.message });
      } else {
        setResult({ msg: "An unknown error occurred" });
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="md:ml-64 flex-1 w-full p-6 md:p-10">
        <div className="max-w-2xl">
          <div className="mb-8">
            <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-purple-700 uppercase bg-purple-100 rounded-full">
              Admin Only
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Send Feature Announcement
            </h1>
            <p className="text-gray-600">
              Broadcast an email to all users who have opted in to feature
              announcements.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <form onSubmit={handleSend} className="p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. 🚀 New Feature: Folders"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heading (Email inner title)
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Organize your Brain with Folders"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body Text
                </label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Write the announcement body here..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Call to Action Text
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Try it now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Call to Action URL
                  </label>
                  <input
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex-1 mr-4">
                  {status === "success" && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                      <strong>✅ Sent successfully!</strong>
                      <br />
                      Delivered to {result?.sent} user{result?.sent !== 1 ? "s" : ""}.
                      {result?.errors ? ` (${result.errors} errors)` : ""}
                    </div>
                  )}
                  {status === "error" && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                      <strong>❌ Failed to send</strong>
                      <br />
                      {result?.msg || "Check server logs for details."}
                    </div>
                  )}
                </div>

                <Button
                  varient="primary"
                  size="md"
                  text={status === "loading" ? "Sending..." : "Send Announcement"}
                  onClick={() => {}} // Form takes care of submit
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
