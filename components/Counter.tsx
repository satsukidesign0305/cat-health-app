"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export default function Counter({ value, onChange, min = 0, max = 20 }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-100"
      >
        <Minus size={16} />
      </button>
      <span className="w-8 text-center text-xl font-semibold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white active:bg-purple-700"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
