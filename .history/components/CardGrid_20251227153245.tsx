"use client";

import { useEffect, useState, useRef } from "react";
import { BirthdayCard } from "@/lib/supabase";
import PersonCard from "./PersonCard";

interface CardGridProps {
  cards: BirthdayCard[];
  onEdit: (card: BirthdayCard) => void;
  onDelete: (id: string) => void;
  viewMode?: boolean;
  background?: "birthday" | "christmas" | "neutral";
  automaticMode?: boolean;
  onReorder?: (newCards: BirthdayCard[]) => void;
}

export default function CardGrid({
  cards,
  onEdit,
  onDelete,
  viewMode = false,
  background = "neutral",
  automaticMode = false,
  onReorder,
}: CardGridProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(
    automaticMode ? 0 : -1
  );
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (automaticMode && cards.length > 0) {
      // Start with the first card
      setCurrentCardIndex(0);
    }
  }, [automaticMode, cards.length]);

  useEffect(() => {
    // Scroll to the current card when it changes
    if (currentCardIndex >= 0 && currentCardIndex < cards.length) {
      const cardId = cards[currentCardIndex].id;
      const cardElement = cardRefs.current[cardId];
      if (cardElement) {
        cardElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }
  }, [currentCardIndex, cards]);

  const handleCardEnded = (cardId: string) => {
    if (!automaticMode) return;

    const currentIndex = cards.findIndex((card) => card.id === cardId);
    if (currentIndex >= 0 && currentIndex < cards.length - 1) {
      // Move to the next card
      setTimeout(() => {
        setCurrentCardIndex(currentIndex + 1);
      }, 1000); // Small delay before moving to next card
    }
  };

  // Drag and drop handlers (enabled only when not in view mode)
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (viewMode) return;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (viewMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, overId: string) => {
    if (viewMode) return;
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    const draggedIndex = cards.findIndex((c) => c.id === draggingId);
    const overIndex = cards.findIndex((c) => c.id === overId);
    if (draggedIndex < 0 || overIndex < 0) return;
    const newCards = [...cards];
    const [moved] = newCards.splice(draggedIndex, 1);
    newCards.splice(overIndex, 0, moved);
    if (onReorder) onReorder(newCards);
    setDraggingId(null);
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">
          No CircleCards yet. Select a theme first and then add your first one!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-8" style={{ width: "100%" }}>
      {cards.map((card, index) => (
        <div
          key={card.id}
          ref={(el) => {
            cardRefs.current[card.id] = el;
          }}
          draggable={!viewMode}
          onDragStart={(e) => handleDragStart(e, card.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, card.id)}
          style={{ width: "350px", height: "350px" }}
        >
          <PersonCard
            card={card}
            onEdit={onEdit}
            onDelete={onDelete}
            viewMode={viewMode}
            background={background}
            automaticMode={automaticMode}
            shouldAutoPlay={automaticMode && index === currentCardIndex}
            onCardEnded={handleCardEnded}
          />
        </div>
      ))}
    </div>
  );
}
