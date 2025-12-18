"use client";

import { useState, useEffect } from "react";
import { BirthdayCard } from "@/lib/supabase";
import ImageUpload from "./ImageUpload";
import AudioUpload from "./AudioUpload";

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    imageFile: File | null;
    audioFile: File | null;
  }) => Promise<void>;
  editCard?: BirthdayCard | null;
}

export default function AddEditModal({
  isOpen,
  onClose,
  onSave,
  editCard,
}: AddEditModalProps) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [requiresHttps, setRequiresHttps] = useState(false);

  useEffect(() => {
    if (editCard) {
      setName(editCard.name);
      setImagePreview(editCard.image_url);
    } else {
      setName("");
      setImageFile(null);
      setAudioFile(null);
      setImagePreview(null);
    }
  }, [editCard, isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRequiresHttps(!window.isSecureContext);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a name");
      return;
    }
    if (!editCard && !imageFile) {
      alert("Please upload an image");
      return;
    }
    if (!editCard && !audioFile) {
      alert("Please upload an audio message");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ name, imageFile, audioFile });
      handleClose();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setImageFile(null);
    setAudioFile(null);
    setImagePreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-800">
              {editCard ? "Edit Card" : "Add New Card"}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter their name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Photo
            </label>
            <ImageUpload
              onImageSelect={setImageFile}
              existingImageUrl={editCard?.image_url}
              preview={imagePreview}
              setPreview={setImagePreview}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Voice Message
            </label>
            {requiresHttps && (
              <div className="mb-3 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                Recording requires HTTPS on mobile. Open this app via an HTTPS
                URL (e.g., ngrok or Cloudflare Tunnel). Uploading an audio file
                works without HTTPS.
              </div>
            )}
            <AudioUpload
              onAudioSelect={setAudioFile}
              existingAudioUrl={editCard?.audio_url}
              allowRecording={true}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Saving...
                </>
              ) : editCard ? (
                "Update Card"
              ) : (
                "Add Card"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
