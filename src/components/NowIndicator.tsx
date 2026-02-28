"use client";

import { useEffect, useState } from "react";

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatTime(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function NowIndicator({ nowMinutes }: { nowMinutes: number }) {
  const [time, setTime] = useState(formatTime(new Date()));

  useEffect(() => {
    const tick = setInterval(() => setTime(formatTime(new Date())), 30000); // Update every 30s
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="relative pl-12 -my-4">
      {/* Line across timeline */}
      <div
        className="absolute -left-px right-0 h-px"
        style={{ backgroundColor: "#D4AF37", opacity: 0.7 }}
      />
      {/* Dot on the line */}
      <div
        className="absolute w-2.5 h-2.5 rounded-full -left-[5px] -top-[4.5px]"
        style={{ backgroundColor: "#D4AF37" }}
      >
        {/* Pulse ring */}
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ backgroundColor: "#D4AF37", opacity: 0.4 }}
        />
      </div>
      {/* "NOW" label */}
      <div className="pl-4 -mt-3.5">
        <span
          className="font-sans text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded"
          style={{ color: "#D4AF37", backgroundColor: "rgba(212,175,55,0.08)" }}
        >
          Now · {time}
        </span>
      </div>
    </div>
  );
}
