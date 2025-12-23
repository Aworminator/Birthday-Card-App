"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase, BirthdayCard, ShareSession, Project } from "@/lib/supabase";
import CardGrid from "@/components/CardGrid";
export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [cards, setCards] = useState<BirthdayCard[]>([]);
  const [session, setSession] = useState<ShareSession | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const debugAnimations = process.env.NEXT_PUBLIC_DEBUG_ANIMATIONS === "true";
  // Device-specific handling removed; use soft background tracks universally.
  // Fetch share session and related data
  useEffect(() => {
    fetchShareSession();
  }, [shareId]);

  // No Web Audio routing; use element volume directly per current rules

  const fetchShareSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("share_sessions")
        .select("*")
        .eq("share_id", shareId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch the project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", sessionData.project_id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch cards for this project
      const { data: cardsData, error: cardsError } = await supabase
        .from("birthday_cards")
        .select("*")
        .eq("project_id", sessionData.project_id)
        .order("created_at", { ascending: false });

      if (cardsError) throw cardsError;
      setCards(cardsData || []);
    } catch (err) {
      console.error("Error fetching share data:", err);
      setLoadError("Share link not found or expired");
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultMusicUrl = () => {
    switch (project?.theme) {
      case "birthday":
        return "/music/Birthday_Lofi_soft.mp3";
      case "christmas":
        return "/music/Christmas Lofi_soft.mp3";
      case "neutral":
        return "/music/neutral.mp3";
      default:
        return null;
    }
  };

  const getMusicUrl = () => {
    if (project?.custom_music_url) return project.custom_music_url;
    if (project?.use_default_music) return getDefaultMusicUrl();
    return null;
  };

  const getBackgroundClass = () => {
    switch (project?.theme) {
      case "birthday":
        return "bg-white";
      case "christmas":
        return "bg-[#e8d5d1]";
      case "neutral":
        return "bg-gradient-to-br from-slate-100 via-gray-100 to-stone-100";
      default:
        return "bg-gradient-to-br from-gray-50 via-white to-gray-100";
    }
  };

  // Animate snow/balloons on shared view based on theme
  useEffect(() => {
    if (!project) return;

    let cleanup: (() => void) | undefined;

    const startSnow = (container: HTMLElement) => {
      if (debugAnimations)
        console.log("[share] snow container found, starting animations");
      const createSnowflake = () => {
        const snowflake = document.createElement("div");
        snowflake.classList.add("snowflake");
        snowflake.textContent = "❄";
        const size = Math.random() * 1.5 + 0.8;
        snowflake.style.fontSize = `${size}rem`;
        snowflake.style.left = Math.random() * 100 + "vw";
        const duration = Math.random() * 5 + 5;
        snowflake.style.animationDuration = `${duration}s`;
        snowflake.style.animationDelay = Math.random() * 5 + "s";
        container.appendChild(snowflake);
        setTimeout(() => snowflake.remove(), duration * 2000);
      };
      for (let i = 0; i < 8; i++) createSnowflake();
      const snowInterval = setInterval(createSnowflake, 300);
      cleanup = () => {
        clearInterval(snowInterval);
        container.innerHTML = "";
      };
    };

    const startBalloons = (container: HTMLElement) => {
      if (debugAnimations)
        console.log("[share] balloon container found, starting animations");
      const colors = ["#ff4d4d", "#ff9f1c", "#2ec4b6", "#9d4edd", "#ffbf00"];
      const createBalloon = () => {
        const balloon = document.createElement("div");
        balloon.classList.add("balloon");
        const size = Math.random() * 40 + 40;
        balloon.style.width = `${size}px`;
        balloon.style.height = `${size}px`;
        balloon.style.borderRadius = "50%";
        balloon.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        balloon.style.left = Math.random() * 100 + "vw";
        const duration = Math.random() * 6 + 6;
        balloon.style.animationDuration = `${duration}s`;
        balloon.style.animationTimingFunction = "ease-in-out";
        container.appendChild(balloon);
        setTimeout(() => balloon.remove(), duration * 1000);
      };
      for (let i = 0; i < 5; i++) createBalloon();
      const balloonInterval = setInterval(createBalloon, 900);
      cleanup = () => {
        clearInterval(balloonInterval);
        container.innerHTML = "";
      };
    };

    const ensureContainerThenStart = () => {
      const id =
        project.theme === "christmas"
          ? "snow"
          : project.theme === "birthday"
          ? "balloons"
          : null;
      if (!id) return;
      const container = document.getElementById(id) as HTMLElement | null;
      if (!container) {
        if (debugAnimations)
          console.log(`[share] waiting for container #${id}`);
        setTimeout(ensureContainerThenStart, 50);
        return;
      }
      if (project.theme === "christmas") startSnow(container);
      if (project.theme === "birthday") startBalloons(container);
    };

    // Ensure DOM is committed before querying containers
    requestAnimationFrame(ensureContainerThenStart);

    return () => {
      if (cleanup) cleanup();
    };
  }, [project?.theme]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{loadError}</h1>
          <a
            href="/"
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg font-semibold inline-block"
          >
            Go Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen transition-colors duration-500 ${getBackgroundClass()} relative`}
    >
      {/* Birthday background with striped pattern */}
      {project?.theme === "birthday" && (
        <div
          className="fixed top-0 left-0 w-full h-full z-0"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              #FF6B6B 0,
              #FF6B6B 20px,
              #FFD93D 20px,
              #FFD93D 40px,
              #6BC9FF 40px,
              #6BC9FF 60px
            )`,
            opacity: 0.5,
          }}
        />
      )}

      {/* Balloon container for Birthday */}
      {project?.theme === "birthday" && (
        <div
          id="balloons"
          className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50"
        />
      )}

      {/* Christmas background image */}
      {project?.theme === "christmas" && (
        <div
          className="fixed top-0 left-0 w-full h-full z-0"
          style={{
            backgroundImage: `url('https://www.itakeyou.co.uk/wp-content/uploads/2022/10/christmas-wallpapers.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "repeat",
            opacity: 0.3,
          }}
        />
      )}

      {/* Snowflake container for Christmas */}
      {project?.theme === "christmas" && (
        <div
          id="snow"
          className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50"
        />
      )}

      {/* Header Text Display */}
      {project?.header_text &&
        (project?.theme === "birthday" || project?.theme === "christmas") && (
          <div className="relative z-40 px-8 pt-16 pb-8">
            <h1
              className={
                (project?.theme === "birthday"
                  ? "text-7xl font-bold text-center text-pink-600"
                  : "text-7xl font-bold text-center text-red-700") +
                " max-w-[90vw] mx-auto break-words leading-tight px-2"
              }
              style={{
                fontFamily:
                  project?.theme === "birthday"
                    ? '"Lobster", sans-serif'
                    : "serif",
                fontWeight: project?.theme === "birthday" ? 500 : 700,
                fontSize: "clamp(2rem, 9vw, 5rem)",
                textShadow:
                  project?.theme === "christmas"
                    ? "3px 3px 6px rgba(0,0,0,0.4), 1px 1px 2px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.3)"
                    : "3px 3px 6px rgba(0,0,0,0.3), 1px 1px 2px rgba(255,105,180,0.4), 0 0 20px rgba(255,255,255,0.5)",
                letterSpacing: "0.03em",
              }}
            >
              {project.header_text}
            </h1>
          </div>
        )}

      {/* Play/Pause Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={async () => {
            const audio = bgAudioRef.current;
            if (!audio) return;
            if (isPlaying) {
              audio.pause();
              setIsPlaying(false);
            } else {
              try {
                audio.muted = false;
                try {
                  audio.volume = 1.0;
                } catch {}
                await audio.play();
                setIsPlaying(true);
              } catch (err) {
                console.error("Play failed:", err);
                alert("Could not play audio. It may be blocked or missing.");
              }
            }
          }}
          className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg font-semibold"
        >
          {isPlaying ? (
            <>
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
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pause
            </>
          ) : (
            <>
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Play
            </>
          )}
        </button>
      </div>

      {/* Background Music */}
      {getMusicUrl() && (
        <audio
          id="background-music"
          ref={bgAudioRef}
          src={getMusicUrl() || undefined}
          loop
          playsInline
          preload="auto"
          onError={(e) => {
            console.error("Error loading music:", e);
            setIsPlaying(false);
          }}
        />
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <CardGrid
          cards={cards}
          onEdit={() => {}}
          onDelete={() => {}}
          viewMode={true}
          background={project?.theme || "neutral"}
          automaticMode={project?.automatic_mode || false}
        />
      </div>
    </main>
  );
}
