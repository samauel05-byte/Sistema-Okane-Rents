"use client";

import { useEffect, useRef } from "react";
import { logout } from "@/app/login/actions";

const IDLE_MINUTES = 5;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

export default function IdleLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
      }, IDLE_MINUTES * 60 * 1000);
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset));
    reset();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
