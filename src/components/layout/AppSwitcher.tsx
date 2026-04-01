"use client";

import { useState, useRef, useEffect } from "react";

const APPS = [
  { id: "home",    label: "Home",    url: "https://nickpegan.com" },
  { id: "todo",    label: "To Do",   url: "https://todo.nickpegan.com" },
  { id: "frm",     label: "FRM",     url: "https://frm.nickpegan.com" },
  { id: "wine",    label: "Wine",    url: "https://wine.nickpegan.com" },
  { id: "watches", label: "Watches", url: "https://watches.nickpegan.com" },
  { id: "game",    label: "Game",    url: "https://cuteshootergame.nickpegan.com" },
];

const CURRENT_APP = "wine";

export default function AppSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch app"
        title="Switch app"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
          <rect x="9.5" y="1" width="5.5" height="5.5" rx="1" />
          <rect x="1" y="9.5" width="5.5" height="5.5" rx="1" />
          <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-[200] w-[280px]">
          <div className="grid grid-cols-2 gap-1.5">
            {APPS.map((app) => (
              <a
                key={app.id}
                href={app.url}
                className={`block rounded-lg overflow-hidden transition-transform hover:scale-[1.03] ${
                  app.id === CURRENT_APP ? "ring-2 ring-blue-600" : ""
                }`}
                onClick={() => setOpen(false)}
              >
                <img
                  src={`/appicons/${app.id}.png`}
                  alt={app.label}
                  className="w-full h-auto block"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
