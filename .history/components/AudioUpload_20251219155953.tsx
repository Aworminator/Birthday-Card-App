"use client";

import { useState, useRef, useEffect } from "react";

interface AudioUploadProps {
  onAudioSelect: (file: File | null) => void;
  existingAudioUrl?: string | null;
  allowRecording?: boolean;
}

export default function AudioUpload({
  onAudioSelect,
  existingAudioUrl,
  allowRecording = true,
}: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (existingAudioUrl && !audioUrl) {
      setAudioUrl(existingAudioUrl);
    }
  }, [existingAudioUrl, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
      onAudioSelect(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setCurrentTime(0);
      setIsPlaying(false);
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
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioFile(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    onAudioSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      // iOS/Safari and modern browsers require HTTPS for microphone access
      if (typeof window !== "undefined" && !window.isSecureContext) {
        alert(
          "Voice recording requires HTTPS. Please open the app via an https URL (e.g., using an ngrok/Cloudflare tunnel) to enable microphone access on mobile."
        );
        return;
      }

      // Check for browser support first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Your browser does not support voice recording. Please use a modern browser or upload an audio file instead."
        );
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Your browser does not support voice recording. Please use a modern browser or try uploading an audio file instead."
        );
        return;
      }

      // Request microphone access with explicit permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "voice-memo.webm", {
          type: "audio/webm",
        });
        handleFileChange(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Attempt to keep any background music playing (e.g., view mode)
      // Some mobile browsers pause audio when mic starts; try resuming it.
      const bg = document.getElementById(
        "background-music"
      ) as HTMLAudioElement | null;
      if (bg) {
        try {
          // Ensure inline playback on iOS
          // @ts-expect-error playsInline is an attribute on HTMLMediaElement
          bg.playsInline = true;
          await bg.play();
        } catch (_) {
          // Ignore if browser blocks replay; UI can resume manually
        }
      }
      // Notify pages using Web Audio to resume their AudioContext
      if (typeof window !== "undefined") {
        try {
          window.dispatchEvent(new CustomEvent("bg-audio-resume"));
        } catch {}
      }

      // Update recording time display
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error("Error accessing microphone:", error);

      // Provide more specific error messages
      if (error?.name === "NotAllowedError") {
        alert(
          "Microphone permission denied. Please allow microphone access in your browser settings and try again."
        );
      } else if (error?.name === "NotFoundError") {
        alert("No microphone found on your device.");
      } else if (error?.name === "NotReadableError") {
        alert(
          "Microphone is in use by another application. Please close it and try again."
        );
      } else if (
        error?.name === "NotSupportedError" ||
        error?.name === "TypeError"
      ) {
        alert(
          "Voice recording is not supported on this device or browser. Please use a modern browser like Chrome, Firefox, or Safari on iOS 14.5+, or upload an audio file instead."
        );
      } else {
        alert(
          "Unable to access microphone. Make sure you've granted permission and are using HTTPS."
        );
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = Number.parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

      {isRecording ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4 justify-center">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-lg font-bold text-red-600">Recording...</span>
            <span className="text-lg font-semibold text-red-500">
              {formatRecordingTime(recordingTime)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="w-full px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold"
          >
            Stop Recording
          </button>
        </div>
      ) : audioUrl ? (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6">
            <audio ref={audioRef} src={audioUrl} />

            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={togglePlayPause}
                className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center"
              >
                {isPlaying ? (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {isPlaying ? "Playing message..." : "Play message"}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 font-medium">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(16, 185, 129) 0%, rgb(16, 185, 129) ${
                        (currentTime / duration) * 100
                      }%, rgb(167, 243, 208) ${
                        (currentTime / duration) * 100
                      }%, rgb(167, 243, 208) 100%)`,
                    }}
                  />
                  <span className="text-xs text-gray-600 font-medium">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
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
        <div className="space-y-3">
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
          {allowRecording && (
            <button
              type="button"
              onClick={startRecording}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-semibold flex items-center justify-center gap-2"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Record Voice Memo
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(16, 185, 129);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(16, 185, 129);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
