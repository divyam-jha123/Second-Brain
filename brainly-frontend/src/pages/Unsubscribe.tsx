import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

type UnsubscribeStatus = "loading" | "success" | "error";

export function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<UnsubscribeStatus>("loading");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");
  const type = searchParams.get("type") || "all";

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link — no token provided.");
      return;
    }

    const doUnsubscribe = async () => {
      try {
        const res = await axios.post(`${API_URL}/unsubscribe`, { token });
        setStatus("success");
        setMessage(
          res.data.type === "all"
            ? "You've been unsubscribed from all BrainExpo emails."
            : res.data.type === "digest"
              ? "You've been unsubscribed from weekly digest emails."
              : "You've been unsubscribed from feature announcements.",
        );
      } catch {
        setStatus("error");
        setMessage(
          "This unsubscribe link is invalid or has expired. You can manage your preferences in Settings.",
        );
      }
    };

    doUnsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, type]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          {status === "loading" && (
            <div className="w-12 h-12 mx-auto border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          )}
          {status === "success" && (
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          {status === "error" && (
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {status === "loading"
            ? "Processing..."
            : status === "success"
              ? "Unsubscribed"
              : "Something went wrong"}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <a
            href="/dashboard"
            className="inline-block bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Go to Dashboard
          </a>
          <a
            href="/settings"
            className="text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            Manage email preferences
          </a>
        </div>

        {/* Branding */}
        <p className="mt-8 text-xs text-gray-400">
          BrainExpo — Your second brain
        </p>
      </div>
    </div>
  );
}
