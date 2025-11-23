"use client";

import { useState, useRef, useEffect } from "react";
import { BirthdayCard } from "@/lib/supabase";
import Image from "next/image";

interface PersonCardProps {
  card: BirthdayCard;
  onEdit: (card: BirthdayCard) => void;
  onDelete: (id: string) => void;
}

export default function PersonCard({
  card,
  onEdit,
  onDelete,
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
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
        {card.image_url && (
          <Image
            src={card.image_url}
            alt={card.name}
            fill
            className="object-cover"
          />
        )}
      </div>

      <div className="p-5">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          {card.name}
        </h3>

        <div className="space-y-3">
          {/* Custom Audio Player */}
          <div 
            onClick={handleTimelineClick}
            className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4 cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-all"
          >
            <audio ref={audioRef} src={card.audio_url} />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAudio();
                }}
                className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md flex items-center justify-center"
              >
                {isPlaying ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="flex-1 pointer-events-none">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {isPlaying ? "Playing message..." : "Play message"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium w-10">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 h-2 bg-emerald-200 rounded-full overflow-hidden relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all"
                      style={{
                        width: `${(currentTime / duration) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 font-medium w-10 text-right">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 px-2">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, rgb(16, 185, 129) 0%, rgb(16, 185, 129) ${
                          (currentTime / duration) * 100
                        }%, rgb(167, 243, 208) ${
                          (currentTime / duration) * 100
                        }%, rgb(167, 243, 208) 100%)`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 font-medium w-10 text-right">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
