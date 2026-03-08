"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wine, MapPin, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/wines", label: "Wines", icon: Wine },
  { href: "/trips", label: "Trips", icon: MapPin },
  { href: "/search", label: "Search", icon: Search },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[60px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}

        {/* Add button */}
        <Link
          href="/wines/new"
          className="flex flex-col items-center gap-1 px-4 py-2"
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </div>
        </Link>
      </div>
    </nav>
  );
}
