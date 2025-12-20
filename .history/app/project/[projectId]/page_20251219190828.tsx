"use client";
import { useEffect, useState, useRef } from "react";
            <h1
              className={
                (background === "birthday"
                  ? "text-7xl font-bold text-center text-pink-600"
                  : "text-7xl font-bold text-center text-red-700") +
                " max-w-[90vw] mx-auto break-words leading-tight px-2"
              }
export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<any>(null);
  const [cards, setCards] = useState<BirthdayCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<BirthdayCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [themeMode, setThemeMode] = useState(false);
  const [background, setBackground] = useState<
    "birthday" | "christmas" | "neutral"
  >("neutral");
  const [savedTheme, setSavedTheme] = useState<
    "birthday" | "christmas" | "neutral"
  >("neutral");
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useDefaultMusic, setUseDefaultMusic] = useState(false);
  const [automaticMode, setAutomaticMode] = useState(false);
  const [headerText, setHeaderText] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const isMobileDevice = () => {
    if (typeof navigator === "undefined") return false;
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  useEffect(() => {
    checkAuthAndFetchData();
  }, [projectId]);

  const checkAuthAndFetchData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/");
      return;
    }
    setUser(session.user);
    await fetchProject();
    await fetchCards();
  };

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      setProject(data);
      setBackground(data.theme);
      setSavedTheme(data.theme);
      setHeaderText(data.header_text);
      setCustomMusicUrl(data.custom_music_url);
      setUseDefaultMusic(data.use_default_music);
      setAutomaticMode(data.automatic_mode);
    } catch (error) {
      console.error("Error fetching project:", error);
      setLoadError("Project not found");
    }
  };

  useEffect(() => {
    // Create snowflakes when Christmas background is active
    if ((viewMode || themeMode) && background === "christmas") {
      const snowContainer = document.getElementById("snow");
      if (!snowContainer) return;

      const createSnowflake = () => {
        const snowflake = document.createElement("div");
        snowflake.classList.add("snowflake");
        snowflake.textContent = "❄";

        // Random size
        const size = Math.random() * 1.5 + 0.8;
        snowflake.style.fontSize = `${size}rem`;

        // Random horizontal start
        snowflake.style.left = Math.random() * 100 + "vw";

        // Random fall duration
        const duration = Math.random() * 5 + 5;
        snowflake.style.animationDuration = `${duration}s`;

        // Random sideways drift
        snowflake.style.animationDelay = Math.random() * 5 + "s";

        snowContainer.appendChild(snowflake);

        // Clean up after animation
        setTimeout(() => {
          snowflake.remove();
        }, duration * 2000);
      };

      const interval = setInterval(createSnowflake, 300);

      return () => {
        clearInterval(interval);
        if (snowContainer) {
          snowContainer.innerHTML = "";
        }
      };
    }

    // Create balloons when Birthday background is active
    if ((viewMode || themeMode) && background === "birthday") {
      const balloonContainer = document.getElementById("balloons");
      if (!balloonContainer) return;

      const colors = ["#ff4d4d", "#ff9f1c", "#2ec4b6", "#9d4edd", "#ffbf00"];

      const createBalloon = () => {
        const balloon = document.createElement("div");
        balloon.classList.add("balloon");

        // Make the balloon a colored circle
        const size = Math.random() * 40 + 40;
        balloon.style.width = `${size}px`;
        balloon.style.height = `${size}px`;
        balloon.style.borderRadius = "50%";

        // Random color
        balloon.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];

        // Random horizontal position
        balloon.style.left = Math.random() * 100 + "vw";

        // Random animation duration
        const duration = Math.random() * 6 + 6;
        balloon.style.animationDuration = `${duration}s`;
        balloon.style.animationTimingFunction = "ease-in-out";

        balloonContainer.appendChild(balloon);

        // Clean up after animation
        setTimeout(() => {
          balloon.remove();
        }, duration * 1000);
      };

      const interval = setInterval(createBalloon, 900);

      return () => {
        clearInterval(interval);
        if (balloonContainer) {
          balloonContainer.innerHTML = "";
        }
      };
    }
  }, [viewMode, themeMode, background]);

  const fetchCards = async () => {
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("birthday_cards")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error((error as any).message || "Unknown fetch error");
      }
      setCards(data || []);
    } catch (err) {
      const message =
        (err as any)?.message || "Failed to load cards. Please try again.";
      setLoadError(message);
      console.error("Error fetching cards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (card: BirthdayCard) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    imageFile: File | null;
    audioFile: File | null;
  }) => {
    try {
      let imageUrl = editingCard?.image_url || "";
      let audioUrl = editingCard?.audio_url || "";

      // Upload image if provided
      if (data.imageFile) {
        console.log("Uploading image:", data.imageFile.name);
        // Sanitize filename - remove special characters and spaces
        const sanitizedName = data.imageFile.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_{2,}/g, "_");
        const imageFileName = `${Date.now()}_${sanitizedName}`;
        const { data: uploadData, error: imageError } = await supabase.storage
          .from("birthday-cards")
          .upload(imageFileName, data.imageFile);

        if (imageError) {
          console.error("Image upload error:", imageError);
          throw imageError;
        }

        console.log("Upload successful:", uploadData);
        const {
          data: { publicUrl },
        } = supabase.storage.from("birthday-cards").getPublicUrl(imageFileName);
        imageUrl = publicUrl;
        console.log("Public URL:", publicUrl);
      }

      // Upload audio if provided
      if (data.audioFile) {
        console.log("Uploading audio:", data.audioFile.name);
        // Sanitize filename - remove special characters and spaces
        const sanitizedName = data.audioFile.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_{2,}/g, "_");
        const audioFileName = `${Date.now()}_${sanitizedName}`;
        const { data: uploadData, error: audioError } = await supabase.storage
          .from("birthday-cards")
          .upload(audioFileName, data.audioFile);

        if (audioError) {
          console.error("Audio upload error:", audioError);
          throw audioError;
        }

        console.log("Audio upload successful:", uploadData);
        const {
          data: { publicUrl },
        } = supabase.storage.from("birthday-cards").getPublicUrl(audioFileName);
        audioUrl = publicUrl;
        console.log("Audio public URL:", publicUrl);
      }

      // Insert or update card
      if (editingCard) {
        console.log("Updating card:", {
          name: data.name,
          image_url: imageUrl,
          audio_url: audioUrl,
        });
        const { error } = await supabase
          .from("birthday_cards")
          .update({
            name: data.name,
            image_url: imageUrl,
            audio_url: audioUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCard.id);
        if (error) {
          console.error("Update error:", error);
          throw error;
        }
      } else {
        console.log("Inserting card:", {
          name: data.name,
          image_url: imageUrl,
          audio_url: audioUrl,
        });
        const { error } = await supabase.from("birthday_cards").insert({
          name: data.name,
          image_url: imageUrl,
          audio_url: audioUrl,
          project_id: projectId,
          user_id: user?.id,
        });
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
      }

      await fetchCards();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving card:", error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;
    try {
      const { error } = await supabase
        .from("birthday_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await fetchCards();
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete card");
    }
  };

  const handleSaveTheme = async () => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          theme: background,
          header_text: headerText,
          custom_music_url: customMusicUrl,
          use_default_music: useDefaultMusic,
          automatic_mode: automaticMode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (error) throw error;

      setSavedTheme(background);
      setThemeMode(false);
      await fetchProject();
    } catch (error) {
      console.error("Error saving theme:", error);
      alert("Failed to save theme settings");
    }
  };

  const handleEnterViewMode = () => {
    // Use project data already loaded
    setBackground(savedTheme);
    setViewMode(true);

    // Initialize background music volume per latest rules
    setTimeout(() => {
      const audio = bgAudioRef.current;
      if (audio) {
        audio.muted = false;
        try {
          const isMobile = isMobileDevice();
          const isBirthday = savedTheme === "birthday";
          const desiredVolume = !isMobile && isBirthday ? 0.4 : 1.0;
          audio.volume = desiredVolume;
        } catch {}
      }
    }, 50);

    // In automatic mode, start playing music automatically
    if (automaticMode) {
      setTimeout(() => {
        const audio = document.getElementById(
          "background-music"
        ) as HTMLAudioElement | null;
        if (audio) {
          try {
            const isMobile = isMobileDevice();
            const isBirthday = savedTheme === "birthday";
            const desiredVolume = !isMobile && isBirthday ? 0.4 : 1.0;
            audio.muted = false;
            audio.volume = desiredVolume;
          } catch {}
        }
        audio?.play().catch((err) => {
          console.error("Auto-play failed:", err);
        });
        setIsPlaying(true);
      }, 100);
    } else {
      setIsPlaying(false); // Don't auto-play, let user click the Play button
    }
  };

  const handleMusicUpload = async (file: File) => {
    try {
      // Sanitize filename
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_{2,}/g, "_");
      const musicFileName = `music_${Date.now()}_${sanitizedName}`;

      const { data: uploadData, error: musicError } = await supabase.storage
        .from("birthday-cards")
        .upload(musicFileName, file);

      if (musicError) {
        console.error("Music upload error:", musicError);
        throw musicError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("birthday-cards").getPublicUrl(musicFileName);

      setCustomMusicUrl(publicUrl);
      alert("Music uploaded successfully!");
    } catch (error) {
      console.error("Error uploading music:", error);
      alert("Failed to upload music. Please try again.");
    }
  };

  const generateShareLink = async () => {
    try {
      const { nanoid } = await import("nanoid");
      const shareId = nanoid(10);

      // Save share session to database
      const { error } = await supabase.from("share_sessions").insert({
        share_id: shareId,
        project_id: projectId,
      });

      if (error) {
        console.error("Error creating share session:", error);
        throw error;
      }

      const url = `${window.location.origin}/share/${shareId}`;
      setShareUrl(url);
      setShowShareModal(true);
    } catch (error) {
      console.error("Error generating share link:", error);
      alert("Failed to generate share link. Please try again.");
    }
  };

  const copyShareLink = () => {
    if (shareUrl) {
      // Use a fallback method for better mobile support
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            alert("Link copied to clipboard!");
          })
          .catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            alert("Link copied to clipboard!");
          });
      } else {
        // Fallback for very old browsers
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("Link copied to clipboard!");
      }
    }
  };

  const generateInviteLink = async () => {
    try {
      const { nanoid } = await import("nanoid");
      const inviteId = nanoid(10);
      const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code

      // Save invite session to database
      const { error } = await supabase.from("invite_sessions").insert({
        invite_id: inviteId,
        project_id: projectId,
        access_code: code,
      });

      if (error) {
        console.error("Error creating invite session:", error);
        throw error;
      }

      const url = `${window.location.origin}/invite/${inviteId}`;
      setInviteUrl(url);
      setInviteCode(code);
      setShowInviteModal(true);
    } catch (error) {
      console.error("Error generating invite link:", error);
      alert("Failed to generate invite link. Please try again.");
    }
  };

  const copyInviteInfo = () => {
    if (inviteUrl && inviteCode) {
      const message = `Add your card to my project!\n\nLink: ${inviteUrl}\nAccess Code: ${inviteCode}`;
      // Use a fallback method for better mobile support
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(message)
          .then(() => {
            alert("Invite link and code copied to clipboard!");
          })
          .catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = message;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            alert("Invite link and code copied to clipboard!");
          });
      } else {
        // Fallback for very old browsers
        const textarea = document.createElement("textarea");
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("Invite link and code copied to clipboard!");
      }
    }
  };

  const getDefaultMusicUrl = () => {
    switch (savedTheme) {
      case "birthday":
        return isMobileDevice()
          ? "/music/Birthday_Lofi_soft.mp3"
          : "/music/Birthday_Lofi.mp3";
      case "christmas":
        return isMobileDevice()
          ? "/music/Christmas Lofi_soft.mp3"
          : "/music/Christmas Lofi.mp3";
      case "neutral":
        return "/music/neutral.mp3";
      default:
        return null;
    }
  };

  const getMusicUrl = () => {
    if (customMusicUrl) return customMusicUrl;
    if (useDefaultMusic) return getDefaultMusicUrl();
    return null;
  };

  const getBackgroundClass = () => {
    if (!viewMode && !themeMode)
      return "bg-gradient-to-br from-gray-50 via-white to-gray-100";

    switch (background) {
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

  return (
    <main
      className={`min-h-screen transition-colors duration-500 ${getBackgroundClass()} relative`}
    >
      {/* Birthday background with striped pattern */}
      {(viewMode || themeMode) && background === "birthday" && (
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

      {/* Balloon container for Birthday background */}
      {(viewMode || themeMode) && background === "birthday" && (
        <div
          id="balloons"
          className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50"
        />
      )}

      {/* Christmas background image with opacity */}
      {(viewMode || themeMode) && background === "christmas" && (
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

      {/* Snowflake container for Christmas background */}
      {(viewMode || themeMode) && background === "christmas" && (
        <div
          id="snow"
          className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50"
        />
      )}

      {/* Header */}
      {!viewMode && (
        <div className="bg-white shadow-sm border-b border-gray-200 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to Dashboard"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
                    {project?.name || "Loading..."}
                  </h1>
                  <p className="text-xs md:text-base text-gray-600">
                    Create and share personalized voice message cards
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                <button
                  onClick={() => setThemeMode(true)}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-semibold text-xs md:text-base bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                  <span className="hidden sm:inline">Select Theme</span>
                  <span className="sm:hidden">Theme</span>
                </button>
                <button
                  onClick={generateInviteLink}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-md hover:shadow-lg font-semibold text-xs md:text-base"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Invite Guest</span>
                  <span className="sm:hidden">Invite</span>
                </button>
                <button
                  onClick={handleEnterViewMode}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all shadow-md hover:shadow-lg font-semibold text-xs md:text-base"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="hidden sm:inline">View Mode</span>
                  <span className="sm:hidden">View</span>
                </button>
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-semibold text-xs md:text-base"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="hidden sm:inline">Add New Card</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selection Modal */}
      {themeMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Select Theme & Music
            </h2>

            {/* Theme Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Background Theme
              </label>
              <div className="relative">
                <select
                  value={background}
                  onChange={(e) => {
                    const newTheme = e.target.value as
                      | "birthday"
                      | "christmas"
                      | "neutral";
                    setBackground(newTheme);
                    // Set default header text based on theme if current header is empty or matches old default
                    if (
                      !headerText ||
                      headerText === "Merry Christmas" ||
                      headerText.startsWith("Happy Birthday")
                    ) {
                      if (newTheme === "christmas") {
                        setHeaderText("Merry Christmas");
                      } else if (newTheme === "birthday") {
                        setHeaderText("Happy Birthday");
                      } else {
                        setHeaderText("");
                      }
                    }
                  }}
                  className="w-full appearance-none px-4 py-3 pr-10 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 transition-all shadow-md hover:shadow-lg font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="neutral">Neutral Background</option>
                  <option value="birthday">Birthday Background</option>
                  <option value="christmas">Christmas Background</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Header Text Input */}
            {(background === "birthday" || background === "christmas") && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Header Text{" "}
                  {background === "birthday"
                    ? "(e.g., Happy Birthday John)"
                    : "(e.g., Merry Christmas Family)"}
                </label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder={
                    background === "christmas"
                      ? "Merry Christmas"
                      : "Happy Birthday"
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 transition-all shadow-md hover:shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Music Upload */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Background Music (Optional)
              </label>
              <div className="flex items-center gap-3 mb-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg font-semibold cursor-pointer">
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
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                  {customMusicUrl ? "Change Music" : "Upload Music"}
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMusicUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
                {customMusicUrl && (
                  <button
                    onClick={() => setCustomMusicUrl(null)}
                    className="px-3 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md font-semibold"
                    title="Remove custom music"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => setUseDefaultMusic(!useDefaultMusic)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-semibold ${
                  useDefaultMusic
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {useDefaultMusic ? (
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                Use Default Music
              </button>
              {customMusicUrl && (
                <p className="text-sm text-gray-600 mt-2">
                  ✓ Custom music uploaded
                </p>
              )}
            </div>

            {/* Automatic Mode */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Playback Mode
              </label>
              <button
                onClick={() => setAutomaticMode(!automaticMode)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-semibold ${
                  automaticMode
                    ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {automaticMode ? (
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                Automatic Mode (Suggested for elderly)
              </button>
              <p className="text-xs text-gray-500 mt-2">
                {automaticMode
                  ? "Music and cards will play automatically in sequence"
                  : "Manual controls for music and card playback"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveTheme}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-semibold"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Theme
              </button>
              <button
                onClick={() => setThemeMode(false)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all shadow-md hover:shadow-lg font-semibold"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Text Display */}
      {viewMode &&
        headerText &&
        (background === "birthday" || background === "christmas") && (
          <div className="relative z-40 px-8 pt-16 pb-8">
            <h1
              className={
                background === "birthday"
                  ? "text-7xl font-bold text-center text-pink-600"
                  : "text-7xl font-bold text-center text-red-700"
              + " max-w-[90vw] mx-auto break-words leading-tight px-2"
              style={{
                fontFamily:
                  background === "birthday" ? '"Lobster", sans-serif' : "serif",
                fontWeight: background === "birthday" ? 500 : 700,
                fontSize: "clamp(2rem, 9vw, 5rem)",
                textShadow:
                  background === "christmas"
                    ? "3px 3px 6px rgba(0,0,0,0.4), 1px 1px 2px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.3)"
                    : "3px 3px 6px rgba(0,0,0,0.3), 1px 1px 2px rgba(255,105,180,0.4), 0 0 20px rgba(255,255,255,0.5)",
                letterSpacing: "0.03em",
              }}
            >
              {headerText}
            </h1>
          </div>
        )}

      {/* Exit View Mode button */}
      {viewMode && (
        <>
          <div className="fixed top-4 right-4 z-50 flex flex-wrap gap-2 md:gap-3 max-w-xs md:max-w-none">
            {/* Play/Pause Music Button */}
            <button
              onClick={async () => {
                const audio = bgAudioRef.current;
                if (!audio) return;
                if (isPlaying) {
                  audio.pause();
                  setIsPlaying(false);
                } else {
                  try {
                    // Set desired volume based on device and theme
                    const isMobile = isMobileDevice();
                    const isBirthday = savedTheme === "birthday";
                    const desiredVolume = !isMobile && isBirthday ? 0.4 : 1.0;
                    audio.muted = false;
                    try {
                      audio.volume = desiredVolume;
                    } catch {}
                    await audio.play();
                    setIsPlaying(true);
                  } catch (err) {
                    console.error("Play failed:", err);
                    // Fallback: if mobile Christmas soft track might be missing, try standard Christmas
                    try {
                      const isMobile = isMobileDevice();
                      const isChristmas = savedTheme === "christmas";
                      const usingDefault = !customMusicUrl && useDefaultMusic;
                      if (isMobile && isChristmas && usingDefault) {
                        const fallbackOrder = [
                          "/music/Christmas Lofi.mp3",
                          "/music/christmas.mp3",
                        ];
                        for (const src of fallbackOrder) {
                          audio.src = src;
                          audio.load();
                          try {
                            audio.muted = false;
                            audio.volume = 1.0;
                          } catch {}
                          try {
                            await audio.play();
                            setIsPlaying(true);
                            return;
                          } catch {}
                        }
                      }
                    } catch {}
                    alert(
                      "Could not play audio. It may be blocked or missing."
                    );
                  }
                }
              }}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg font-semibold text-xs md:text-base"
            >
              {isPlaying ? (
                <>
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
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
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
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
                  <span className="hidden sm:inline">Play</span>
                </>
              )}
            </button>
            <button
              onClick={generateShareLink}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-lg font-semibold text-xs md:text-base"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={generateInviteLink}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all shadow-lg font-semibold text-xs md:text-base"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              <span className="hidden sm:inline">Invite</span>
            </button>
            <button
              onClick={() => {
                setViewMode(false);
                setIsPlaying(false);
                const audio = document.getElementById(
                  "background-music"
                ) as HTMLAudioElement;
                if (audio) {
                  audio.pause();
                  audio.volume = 1.0;
                }
              }}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg font-semibold text-xs md:text-base"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
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
              <span className="hidden sm:inline">Exit View Mode</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
          {/* Background Music Audio Element */}
          {getMusicUrl() && (
            <audio
              id="background-music"
              ref={bgAudioRef}
              src={getMusicUrl() || undefined}
              loop
              crossOrigin="anonymous"
              playsInline
              preload="auto"
              onError={(e) => {
                console.error("Error loading music:", e);
                setIsPlaying(false);
              }}
            />
          )}
        </>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : loadError ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-red-600 font-semibold text-lg">
              {loadError}
            </div>
            <button
              onClick={() => {
                setIsLoading(true);
                fetchCards();
              }}
              className="px-5 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <CardGrid
            cards={cards}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            viewMode={viewMode || themeMode}
            background={background}
            automaticMode={automaticMode && viewMode}
          />
        )}
      </div>

      {/* Modal */}
      <AddEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editCard={editingCard}
        onShare={generateShareLink}
      />

      {/* Share Modal */}
      {showShareModal && shareUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              🎉 Your card is ready!
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Share the link below with your friends and family:
            </p>

            <div className="mb-6">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-gray-700 text-sm font-mono outline-none"
                />
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && inviteUrl && inviteCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              👥 Invite Guest to Add Card
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Share this link and access code with someone to let them add a
              card to your project:
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Invite Link
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                <input
                  type="text"
                  value={inviteUrl}
                  readOnly
                  className="flex-1 bg-transparent text-gray-700 text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Access Code
              </label>
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 text-center">
                <div className="text-4xl font-bold text-purple-600 tracking-widest">
                  {inviteCode}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This code is required to access the invite link
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyInviteInfo}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold flex items-center justify-center gap-2"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy All
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
