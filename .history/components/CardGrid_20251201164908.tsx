"use client";

import { BirthdayCard } from "@/lib/supabase";
import PersonCard from "./PersonCard";

interface CardGridProps {
  cards: BirthdayCard[];
  onEdit: (card: BirthdayCard) => void;
  onDelete: (id: string) => void;
  viewMode?: boolean;
}

export default function CardGrid({ cards, onEdit, onDelete, viewMode = false }: CardGridProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <PersonCard
          key={card.id}
          card={card}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
