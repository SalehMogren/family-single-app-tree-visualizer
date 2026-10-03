"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { Button } from "./button";

/** Switches between Arabic and English; `onChange` persists the choice (e.g. a server action). */
export const LocaleToggle = ({
  locale,
  label,
  onChange,
}: {
  locale: "ar" | "en";
  label: string;
  onChange: (locale: "ar" | "en") => Promise<void>;
}) => {
  const [pending, startTransition] = useTransition();
  const next = locale === "ar" ? "en" : "ar";
  const handleClick = () => startTransition(() => onChange(next));
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      aria-label={label}
      className="gap-1.5"
    >
      <Languages />
      <span className="text-xs font-semibold">{next === "ar" ? "عربي" : "EN"}</span>
    </Button>
  );
};
