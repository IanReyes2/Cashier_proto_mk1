"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MenuMakerModalProps {
  menuItem: {
    id: number;
    name: string;
    availabilities: { dayOfWeek: string }[];
  };
  onClose: () => void;
  onUpdate: (newDays: string[]) => void;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function MenuMakerModal({ menuItem, onClose, onUpdate }: MenuMakerModalProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(
    menuItem.availabilities.map((a) => a.dayOfWeek.toLowerCase())
  );
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu/${menuItem.id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: selectedDays }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onUpdate(selectedDays);
      onClose();
    } catch (err) {
      console.error("Failed to update availability:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">{menuItem.name} Availability</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {DAYS.map((day) => (
            <button
              key={day}
              className={`py-2 px-3 rounded border ${
                selectedDays.includes(day)
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => toggleDay(day)}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button onClick={onClose} variant="destructive" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
