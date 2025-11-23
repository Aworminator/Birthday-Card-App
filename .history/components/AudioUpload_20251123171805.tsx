"use client";

import { useState, useRef, useEffect } from "react";

interface AudioUploadProps {
  onAudioSelect: (file: File | null) => void;
  existingAudioUrl?: string;
}

export default function AudioUpload({
  onAudioSelect,
  existingAudioUrl,
}: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingAudioUrl && !audioUrl) {
      setAudioUrl(existingAudioUrl);
    }
  }, [existingAudioUrl, audioUrl]);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
      onAudioSelect(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    } else if (file) {
      alert("Please upload an audio file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setAudioFile(null);
    setAudioUrl(null);
    onAudioSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      {audioUrl ? (
        <div className="space-y-3">
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <audio controls className="w-full">
              <source src={audioUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold"
          >
            Remove Audio
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <div>
              <p className="text-gray-700 font-semibold">
                Drag and drop an audio file here
              </p>
              <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              <p className="text-gray-400 text-xs mt-2">
                Supported formats: MP3, WAV, M4A, OGG
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
