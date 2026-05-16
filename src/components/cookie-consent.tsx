"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_KEY = "qualipilot_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  function refuse() {
    localStorage.setItem(COOKIE_KEY, "refused");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface p-4 shadow-raised sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-xl sm:border"
    >
      <p className="text-sm text-foreground">
        Nous utilisons des cookies strictement nécessaires au fonctionnement du service. Aucun cookie publicitaire ou de traçage tiers.{" "}
        <Link href="/cookies" className="font-semibold text-brand hover:underline">
          En savoir plus
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={accept}
          className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand/90"
        >
          Accepter
        </button>
        <button
          onClick={refuse}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-subtle"
        >
          Refuser
        </button>
      </div>
    </div>
  );
}
