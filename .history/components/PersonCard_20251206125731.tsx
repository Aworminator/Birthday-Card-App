"use client";

import { useState, useRef, useEffect } from "react";
import { BirthdayCard } from "@/lib/supabase";
import Image from "next/image";

interface PersonCardProps {
  card: BirthdayCard;
  onEdit: (card: BirthdayCard) => void;
  onDelete: (id: string) => void;
  viewMode?: boolean;
}

export default function PersonCard({
  card,
  onEdit,
  onDelete,
  viewMode = false,
}: PersonCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

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
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = Number.parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    audio.currentTime = time;
    setCurrentTime(time);

    // Auto-play when clicking to seek
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex-shrink-0"
      style={{
        width: "500px",
        height: "500px",
        minWidth: "500px",
        maxWidth: "500px",
      }}
    >
      <div
        className="relative bg-gradient-to-br from-gray-100 to-gray-200"
        style={{ width: "500px", height: "500px" }}
      >
        {card.image_url && (
          <Image
            src={card.image_url}
            alt={card.name}
            fill
            className="object-cover"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col" style={{ height: "0px", display: "none" }}>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          {card.name}
        </h3>

        <div className="space-y-3">
          {/* Custom Audio Player */}
          <div className="relative">
            <div
              onClick={handleTimelineClick}
              className="relative bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer overflow-hidden"
            >
              <audio ref={audioRef} src={card.audio_url} />

              {/* Progress overlay - lighter color */}
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-300 to-teal-400 transition-all pointer-events-none"
                style={{
                  width: `${(currentTime / duration) * 100}%`,
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-center gap-2 font-medium">
                {isPlaying ? (
                  <>Playing...</>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Play Message
                  </>
                )}
              </div>

              {/* Time display */}
              <div className="relative z-10 flex items-center justify-between px-4 mt-1 text-xs">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Pause button overlay - only shows when playing */}
            {isPlaying && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAudio();
                }}
                className="absolute top-2 left-2 z-20 w-8 h-8 bg-white/90 hover:bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-lg transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>

          {!viewMode && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(card)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(card.id)}
                className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors duration-200 font-medium"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgb(16, 185, 129);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
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
