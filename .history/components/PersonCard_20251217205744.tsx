"use client";

import { useState, useRef, useEffect } from "react";
import { BirthdayCard } from "@/lib/supabase";
import Image from "next/image";

interface PersonCardProps {
  card: BirthdayCard;
  onEdit: (card: BirthdayCard) => void;
  onDelete: (id: string) => void;
  viewMode?: boolean;
  background?: "birthday" | "christmas" | "neutral";
  automaticMode?: boolean;
  shouldAutoPlay?: boolean;
  onCardEnded?: (cardId: string) => void;
}

export default function PersonCard({
  card,
  onEdit,
  onDelete,
  viewMode = false,
  background = "neutral",
  automaticMode = false,
  shouldAutoPlay = false,
  onCardEnded,
}: PersonCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAutoPlayed = useRef(false);
  const isIOS =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Restore background music volume when card audio ends with fade
      const backgroundMusic = document.getElementById(
        "background-music"
      ) as HTMLAudioElement;
      if (backgroundMusic) {
        fadeVolume(backgroundMusic, 1.0, 500);
      }

      // Notify parent that this card has ended
      if (automaticMode && onCardEnded) {
        onCardEnded(card.id);
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [automaticMode, onCardEnded, card.id]);

  // Auto-play effect when shouldAutoPlay becomes true
  useEffect(() => {
    if (shouldAutoPlay && !hasAutoPlayed.current && audioRef.current) {
      hasAutoPlayed.current = true;

      // Small delay to ensure smooth transition
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.error("Auto-play failed:", err);
          });
          setIsPlaying(true);

          // Reduce background music volume
          const backgroundMusic = document.getElementById(
            "background-music"
          ) as HTMLAudioElement;
          if (backgroundMusic) {
            fadeVolume(backgroundMusic, 0.3, 500);
          }
        }
      }, 500);
    } else if (!shouldAutoPlay && hasAutoPlayed.current) {
      // Reset the flag when card is no longer supposed to auto-play
      hasAutoPlayed.current = false;
    }
  }, [shouldAutoPlay]);

  const fadeVolume = (
    audio: HTMLAudioElement,
    targetVolume: number,
    duration: number
  ) => {
    const startVolume = audio.volume;
    const volumeChange = targetVolume - startVolume;
    const steps = 20;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
      } else {
        audio.volume = startVolume + (volumeChange * currentStep) / steps;
      }
    }, stepDuration);
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      const backgroundMusic = document.getElementById(
        "background-music"
      ) as HTMLAudioElement;

      if (isPlaying) {
        audioRef.current.pause();
        // Restore background music volume with fade
        if (backgroundMusic) {
          if (isIOS) {
            backgroundMusic.play().catch(() => {});
          } else {
            backgroundMusic.volume = Math.max(backgroundMusic.volume || 0.4, 0.4);
            fadeVolume(backgroundMusic, 1.0, 500);
          }
        }
      } else {
        audioRef.current.play().catch((err) => {
          console.error("Error playing audio:", err);
        });
        // Reduce background music volume to 40% with fade
        if (backgroundMusic) {
          if (isIOS) {
            backgroundMusic.pause();
          } else {
            backgroundMusic.volume = backgroundMusic.volume || 1.0;
            fadeVolume(backgroundMusic, 0.4, 500);
          }
        }
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
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
      setIsPlaying(true);

      // Reduce background music volume when starting playback
      const backgroundMusic = document.getElementById(
        "background-music"
      ) as HTMLAudioElement;
      if (backgroundMusic) {
        if (isIOS) {
          backgroundMusic.pause();
        } else {
          backgroundMusic.volume = backgroundMusic.volume || 1.0;
          fadeVolume(backgroundMusic, 0.4, 500);
        }
      }
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
      className="flex flex-col justify-center items-center transition-all hover:translate-y-[-4px]"
      style={{
        width: "360px",
        height: "360px",
        minWidth: "360px",
        maxWidth: "360px",
        border: "3px solid rgba(0, 0, 0, 0.15)",
        backgroundColor: "#fefdf3",
        borderRadius: "24px",
        boxShadow:
          "0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Circular image */}
      <div className="relative" style={{ width: "172px", height: "172px" }}>
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

      <h3 className="text-lg font-bold text-gray-800 my-2">{card.name}</h3>

      {/* Audio Player */}
      <div className="flex items-center gap-3">
        <audio ref={audioRef} src={card.audio_url} />

        <button
          onClick={toggleAudio}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            background:
              background === "christmas"
                ? "linear-gradient(135deg, #f16844 0%, #ff8a6b 100%)"
                : "linear-gradient(135deg, #fab240 0%, #ffd575 100%)",
            boxShadow: `0 4px 12px rgba(${
              background === "christmas" ? "241, 104, 68" : "250, 178, 64"
            }, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.4)`,
            border: "2px solid white",
          }}
        >
          {isPlaying ? (
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
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
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            border: `2px solid ${
              background === "christmas" ? "#f16844" : "#fab240"
            }`,
            width: "172px",
            height: "12px",
            boxShadow: `0 2px 8px rgba(${
              background === "christmas" ? "241, 104, 68" : "250, 178, 64"
            }, 0.25)`,
          }}
        >
          <div
            className="rounded-full h-full transition-all pointer-events-none relative"
            style={{
              background:
                background === "christmas"
                  ? "linear-gradient(90deg, #f16844 0%, #ff8a6b 100%)"
                  : "linear-gradient(90deg, #fab240 0%, #ffd575 100%)",
              width: `${(currentTime / duration) * 100}%`,
              boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.4)`,
            }}
          >
            {/* Progress indicator dot */}
            {currentTime > 0 && currentTime < duration && (
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2"
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor:
                    background === "christmas" ? "#f16844" : "#fab240",
                  borderRadius: "50%",
                  boxShadow: `0 2px 6px rgba(${
                    background === "christmas" ? "241, 104, 68" : "250, 178, 64"
                  }, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.5)`,
                  border: "2px solid white",
                  transform: "translateX(50%) translateY(-50%)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {!viewMode && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onEdit(card)}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
