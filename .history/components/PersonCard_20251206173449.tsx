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
      className="flex flex-col justify-center items-center"
      style={{
        width: "400px",
        height: "400px",
        minWidth: "500px",
        maxWidth: "500px",
        border: "2px solid black",
        backgroundColor: "#fefdf3",
        borderRadius: "20px",
        boxShadow: "5px 10px",
      }}
    >
      {/* Circular image */}
      <div className="relative" style={{ width: "250px", height: "250px" }}>
        {card.image_url && (
          <Image
            src={card.image_url}
            alt={card.name}
            fill
            className="rounded-full object-cover"
            style={{ objectFit: "cover" }}
          />
        )}
      </div>

      <h3 className="text-2xl font-bold text-gray-800 my-4">{card.name}</h3>

      {/* Audio Player */}
      <div className="flex items-center gap-3">
        <audio ref={audioRef} src={card.audio_url} />

        <button
          onClick={toggleAudio}
          className="flex items-center justify-center w-12 h-12 text-gray-800 hover:scale-95 active:scale-90 transition-transform"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Progress Bar */}
        <div
          onClick={handleTimelineClick}
          className="relative rounded-full cursor-pointer"
          style={{
            backgroundColor: "white",
            border: "1px solid #fab240",
            width: "250px",
            height: "12px",
          }}
        >
          <div
            className="rounded-full h-full transition-all pointer-events-none"
            style={{
              backgroundColor: "#fab240",
              width: `${(currentTime / duration) * 100}%`,
            }}
          />
        </div>
      </div>

      {!viewMode && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onEdit(card)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
