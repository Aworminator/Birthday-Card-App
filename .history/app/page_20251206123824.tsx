"use client";
import { useEffect, useState } from "react";
import { supabase, BirthdayCard } from "@/lib/supabase";
import CardGrid from "@/components/CardGrid";
import AddEditModal from "@/components/AddEditModal";

export default function Home() {
  const [cards, setCards] = useState<BirthdayCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<BirthdayCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [background, setBackground] = useState<
    "birthday" | "christmas" | "neutral"
  >("neutral");

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    // Create snowflakes when Christmas background is active
    if (viewMode && background === "christmas") {
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
  }, [viewMode, background]);

  const fetchCards = async () => {
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("birthday_cards")
        .select("*")
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

  const getBackgroundClass = () => {
    if (!viewMode)
      return "bg-gradient-to-br from-gray-50 via-white to-gray-100";

    switch (background) {
      case "birthday":
        return "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100";
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
      style={
        viewMode && background === "christmas"
          ? {
              backgroundImage: `url('https://www.itakeyou.co.uk/wp-content/uploads/2022/10/christmas-wallpapers.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "repeat",
              opacity: "80%";
            }
          : undefined
      }
    >
      {/* Snowflake container for Christmas background */}
      {viewMode && background === "christmas" && (
        <div
          id="snow"
          className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50"
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Birthday Cards
              </h1>
              <p className="text-gray-600">
                Create and share personalized birthday messages
              </p>
            </div>
            <div className="flex gap-3">
              {viewMode && (
                <div className="relative">
                  <select
                    value={background}
                    onChange={(e) =>
                      setBackground(
                        e.target.value as "birthday" | "christmas" | "neutral"
                      )
                    }
                    className="appearance-none px-4 py-3 pr-10 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 transition-all shadow-md hover:shadow-lg font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              )}
              <button
                onClick={() => setViewMode(!viewMode)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-semibold ${
                  viewMode
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {viewMode ? "Exit View Mode" : "View Mode"}
              </button>
              {!viewMode && (
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-semibold"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add New Card
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            viewMode={viewMode}
          />
        )}
      </div>

      {/* Modal */}
      <AddEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editCard={editingCard}
      />
    </main>
  );
}
