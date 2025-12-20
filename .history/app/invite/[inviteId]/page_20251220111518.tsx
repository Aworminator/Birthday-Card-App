"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ImageUpload from "@/components/ImageUpload";
import AudioUpload from "@/components/AudioUpload";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteId = params.inviteId as string;

  const [step, setStep] = useState<"verify" | "submit" | "success">("verify");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [inviteSession, setInviteSession] = useState<any>(null);
  const [projectName, setProjectName] = useState<string>("");

  // Form state
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"error" | "success">("error");

  const verifyCode = async () => {
    if (code.length !== 4) {
      setToastType("error");
      setToastMessage("Please enter a 4-digit code");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }

    setVerifying(true);
    try {
      // Use server route to verify and fetch project name without auth
      const res = await fetch("/api/invite/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, code }),
      });
      const result = await res.json();
      if (!res.ok || !result?.ok) {
        setToastType("error");
        setToastMessage(
          result?.error || "Invalid code. Please check and try again."
        );
        setShowToast(true);
        setVerifying(false);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      setInviteSession({
        invite_id: inviteId,
        access_code: code,
        project_id: result.projectId,
      });
      setProjectName(result.projectName);
      setStep("submit");
    } catch (error) {
      console.error("Verification error:", error);
      setToastType("error");
      setToastMessage("An error occurred. Please try again.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setToastType("error");
      setToastMessage("Please enter your name");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }

    if (!imageFile) {
      setToastType("error");
      setToastMessage("Please upload a photo");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }

    if (!audioFile) {
      setToastType("error");
      setToastMessage("Please record or upload an audio message");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }

    setSubmitting(true);
    try {
      // Upload image
      const sanitizedImageName = imageFile.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_{2,}/g, "_");
      const imageFileName = `${Date.now()}_${sanitizedImageName}`;
      const { error: imageError } = await supabase.storage
        .from("birthday-cards")
        .upload(imageFileName, imageFile);

      if (imageError) throw imageError;

      const {
        data: { publicUrl: imageUrl },
      } = supabase.storage.from("birthday-cards").getPublicUrl(imageFileName);

      // Upload audio
      const sanitizedAudioName = audioFile.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_{2,}/g, "_");
      const audioFileName = `${Date.now()}_${sanitizedAudioName}`;
      const { error: audioError } = await supabase.storage
        .from("birthday-cards")
        .upload(audioFileName, audioFile);

      if (audioError) throw audioError;

      const {
        data: { publicUrl: audioUrl },
      } = supabase.storage.from("birthday-cards").getPublicUrl(audioFileName);

      // Submit via server API to bypass RLS
      const res = await fetch("/api/invite/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteId: inviteSession.invite_id,
          code,
          name: name.trim(),
          imageUrl,
          audioUrl,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result?.ok) {
        throw new Error(result?.error || "Submission failed");
      }

      setToastType("success");
      setToastMessage("Card submitted successfully!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setStep("success");
    } catch (error) {
      console.error("Submission error:", error);
      setToastType("error");
      setToastMessage("Failed to submit your card. Please try again.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "verify") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        {showToast && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                toastType === "error"
                  ? "bg-red-600 text-white"
                  : "bg-green-600 text-white"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    toastType === "error"
                      ? "M6 18L18 6M6 6l12 12"
                      : "M5 13l4 4L19 7"
                  }
                />
              </svg>
              <span className="text-sm font-semibold">{toastMessage}</span>
            </div>
          </div>
        )}
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Add Your Card
              </h1>
              <p className="text-gray-600">
                Enter the 4-digit access code you received
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyCode();
              }}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-semibold text-gray-700 mb-2 text-center"
                >
                  Access Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCode(value);
                  }}
                  maxLength={4}
                  placeholder="1234"
                  className="w-full px-4 py-4 text-center text-3xl font-bold tracking-widest border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-gray-900"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || code.length !== 4}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? "Verifying..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (step === "submit") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 py-12">
        {showToast && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                toastType === "error"
                  ? "bg-red-600 text-white"
                  : "bg-green-600 text-white"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    toastType === "error"
                      ? "M6 18L18 6M6 6l12 12"
                      : "M5 13l4 4L19 7"
                  }
                />
              </svg>
              <span className="text-sm font-semibold">{toastMessage}</span>
            </div>
          </div>
        )}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Add Your Card to {projectName}
              </h1>
              <p className="text-gray-600">
                Add your photo, name, and voice message
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Photo
                </label>
                <ImageUpload
                  onImageSelect={setImageFile}
                  existingImageUrl={undefined}
                  preview={imagePreview}
                  setPreview={setImagePreview}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Voice Message
                </label>
                <AudioUpload
                  onAudioSelect={setAudioFile}
                  existingAudioUrl={null}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Card"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Success step
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toastType === "error"
                ? "bg-red-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  toastType === "error"
                    ? "M6 18L18 6M6 6l12 12"
                    : "M5 13l4 4L19 7"
                }
              />
            </svg>
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Card Added Successfully!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for adding your card to {projectName}. The project owner
            will be able to see your contribution!
          </p>
          <div className="text-sm text-gray-500">
            You can close this page now.
          </div>
          <div className="mt-6">
            <button
              onClick={() => router.push("/")}
              className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
