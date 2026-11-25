"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

interface HeroCarouselProps {
  slides: string[];
  intervalMs?: number;
}

export default function HeroCarousel({
  slides,
  intervalMs = 5000,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = slides.length;

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
  const goTo = (i: number) => setIndex(i);

  // Auto-slide digerakkan animasi CSS (.hero-progress) -> tidak ada re-render React
  // tiap 50ms. Saat animasi bar selesai (onAnimationEnd) pindah ke slide berikut.

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) next();
    else if (distance < -minSwipeDistance) prev();

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      role="region"
      aria-label="Hero Carousel"
      className="relative rounded-3xl overflow-hidden shadow-xl h-72 sm:h-80 lg:h-[420px] group bg-slate-950 select-none cursor-grab active:cursor-grabbing w-full ring-1 ring-black/5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }}
    >
      {/* Slides with smooth cross-fade + Ken Burns */}
      {slides.map((src, i) => {
        const isActive = index === i;
        return (
          <div
            key={i}
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
              isActive
                ? "opacity-100 z-10 pointer-events-auto"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Aksi relawan NARASSA slide ${i + 1}`}
              className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${
                isActive ? "scale-100" : "scale-110"
              }`}
              loading={i === 0 ? "eager" : "lazy"}
            />
            {/* Soft gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />
          </div>
        );
      })}

      {/* Progress bar segments at top */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-4 pt-3">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/25">
            <div
              key={i === index ? `active-${index}` : i}
              className={`h-full rounded-full bg-white ${i === index && total > 1 ? "hero-progress" : ""}`}
              style={{
                width: i < index ? "100%" : i === index ? undefined : "0%",
                animationDuration: `${intervalMs}ms`,
                animationPlayState: isPaused ? "paused" : "running",
              }}
              onAnimationEnd={i === index ? next : undefined}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        aria-label="Foto sebelumnya"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        aria-label="Foto berikutnya"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-0 right-0 px-5 flex items-center justify-between z-20">
        {/* Dot indicators */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Lihat slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                index === i
                  ? "w-6 h-2.5 bg-white shadow"
                  : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        {/* Play/Pause & Counter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? "Lanjutkan putar" : "Jeda slide"}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 flex items-center justify-center transition-colors border border-white/10"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
          </button>

          <div className="bg-black/40 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/10 tabular-nums">
            {index + 1}/{total}
          </div>
        </div>
      </div>
    </div>
  );
}
