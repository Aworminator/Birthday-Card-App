"use client";

import { useState, useEffect } from "react";
import { BirthdayCard } from "@/lib/supabase";
import ImageUpload from "./ImageUpload";
import VoiceRecorder from "./VoiceRecorder";

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
      alert("Please record or upload an audio message");
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
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
            <VoiceRecorder
              onAudioReady={setAudioFile}
              existingAudioUrl={editCard?.audio_url}
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : editCard ? "Update Card" : "Add Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
