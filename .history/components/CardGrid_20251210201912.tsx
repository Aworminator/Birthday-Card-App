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
}

export default function CardGrid({
  cards,
  onEdit,
  onDelete,
  viewMode = false,
  background = "neutral",
  automaticMode = false,
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

  if (cards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">
          No birthday cards yet. Add your first one!
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
