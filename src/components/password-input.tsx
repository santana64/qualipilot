"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { inputClass } from "@/components/ui";

export function PasswordInput({
  name,
  autoComplete,
  required,
  minLength,
  placeholder,
}: {
  name: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className={inputClass + " pr-10"}
        type={visible ? "text" : "password"}
        name={name}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-faint transition hover:text-foreground-muted"
        tabIndex={-1}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
