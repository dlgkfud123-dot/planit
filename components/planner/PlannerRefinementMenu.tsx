"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./PlannerDesktop.module.css";

type RefinementKey = "food" | "culture" | "nature" | "shopping";
type Props = {
  onSelect: (key: RefinementKey, label: string) => void;
};

const options: { key: RefinementKey; label: string }[] = [
  { key: "food", label: "맛집 중심" },
  { key: "culture", label: "문화 중심" },
  { key: "nature", label: "자연 중심" },
  { key: "shopping", label: "쇼핑 중심" },
];

export default function PlannerRefinementMenu({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selectOption = async (key: RefinementKey, label: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await Promise.resolve(onSelect(key, label));
      setOpen(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className={styles.refinementMenu} ref={wrapperRef}>
      <button
        type="button"
        className={styles.refinementTrigger}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span>일정 취향 조정</span>
        <i aria-hidden="true">{open ? "⌃" : "⌄"}</i>
      </button>
      {open && (
        <div id={menuId} className={styles.refinementPopover} role="menu">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => void selectOption(option.key, option.label)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
