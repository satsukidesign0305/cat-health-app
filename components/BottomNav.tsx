"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cat, ClipboardList, BookOpen } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "今日の記録", icon: ClipboardList },
  { href: "/history", label: "履歴", icon: BookOpen },
  { href: "/cats", label: "猫の管理", icon: Cat },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around max-w-lg mx-auto pb-safe">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center py-2 px-4 text-xs gap-1 ${
              active ? "text-purple-600" : "text-gray-500"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
