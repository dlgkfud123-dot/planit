"use client";

import { useEffect, useState } from "react";

export default function BrandOpeningIntro({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [stage, setStage] = useState<"init" | "animating" | "subtitle" | "fadeout" | "done">("init");

  useEffect(() => {
    // 1. Start letter stagger sequence shortly after mount
    const timer1 = setTimeout(() => {
      setStage("animating");
    }, 150);

    // 2. Fade in subtitle after letters complete
    const timer2 = setTimeout(() => {
      setStage("subtitle");
    }, 1250);

    // 3. Begin smooth fade-out of the intro overlay
    const timer3 = setTimeout(() => {
      setStage("fadeout");
    }, 1850);

    // 4. Complete intro and remove from DOM
    const timer4 = setTimeout(() => {
      setStage("done");
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  if (stage === "done") return null;

  const letters = ["P", "L", "A", "N", "I", "T"];

  return (
    <div
      className={`brandIntroOverlay ${stage === "fadeout" ? "fadeOut" : ""}`}
      aria-hidden="true"
    >
      <div className="brandIntroContainer">
        <div className="brandLettersRow">
          {letters.map((letter, idx) => {
            const isVisible = stage !== "init";
            const delaySec = 0.15 + idx * 0.11;

            return (
              <span
                key={idx}
                className="introLetter"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "scale(1) translateY(0)" : "scale(0.94) translateY(6px)",
                  transitionDelay: `${delaySec}s`,
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        <div
          className="introSubtitle"
          style={{
            opacity: stage === "subtitle" || stage === "fadeout" ? 1 : 0,
            transform: stage === "subtitle" || stage === "fadeout" ? "translateY(0)" : "translateY(4px)",
          }}
        >
          Plan your journey.
        </div>
      </div>
    </div>
  );
}
