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

  useEffect(() => {
    fetchCards();
  }, []);

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
      // let audioUrl = editingCard?.audio_url || "";

      // Upload image if provided
      if (data.imageFile) {
        console.log("Uploading image:", data.imageFile.name);
        const imageFileName = `${Date.now()}_${data.imageFile.name}`;
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
      // if (data.audioFile) {
      //   const audioFileName = `${Date.now()}_${data.audioFile.name}`;
      //   const { error: audioError } = await supabase.storage
      //     .from("birthday-cards")
      //     .upload(audioFileName, data.audioFile);
      //   if (audioError) throw audioError;
      //   const {
      //     data: { publicUrl },
      //   } = supabase.storage.from("birthday-cards").getPublicUrl(audioFileName);
      //   audioUrl = publicUrl;
      // }

      // Insert or update card
      if (editingCard) {
        const { error } = await supabase
          .from("birthday_cards")
          .update({
            name: data.name,
            image_url: imageUrl,
            // audio_url: audioUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCard.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("birthday_cards").insert({
          name: data.name,
          image_url: imageUrl,
          // audio_url: audioUrl,
        });
        if (error) throw error;
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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
