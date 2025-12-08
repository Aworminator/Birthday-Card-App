"use client";

import { BirthdayCard } from "@/lib/supabase";
import PersonCard from "./PersonCard";

interface CardGridProps {
  cards: BirthdayCard[];
  onEdit: (card: BirthdayCard) => void;
  onDelete: (id: string) => void;
  viewMode?: boolean;
}

export default function CardGrid({
  cards,
  onEdit,
  onDelete,
  viewMode = false,
}: CardGridProps) {
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
    <div className="flex flex-wrap gap-6" style={{ width: '100%' }}>
      {cards.map((card) => (
        <div key={card.id} style={{ width: '500px', height: '500px' }}>
          <PersonCard
            card={card}
            onEdit={onEdit}
            onDelete={onDelete}
            viewMode={viewMode}
          />
        </div>
      ))}
    </div>
  );
}
