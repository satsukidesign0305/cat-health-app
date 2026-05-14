import { Link, useLocation } from "react-router-dom";
import { Cat, ClipboardList, BookOpen } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "今日の記録", icon: ClipboardList },
  { href: "/history", label: "履歴", icon: BookOpen },
  { href: "/cats", label: "猫の管理", icon: Cat },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around max-w-lg mx-auto">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            to={href}
            className={`flex flex-col items-center py-3 px-4 text-xs gap-1 ${
              active ? "text-orange-500" : "text-gray-400"
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
