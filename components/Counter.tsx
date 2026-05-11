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
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 active:bg-gray-100"
      >
        <Minus size={16} />
      </button>
      <span className="w-8 text-center text-2xl font-bold text-gray-700">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white active:bg-orange-600"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
