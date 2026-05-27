"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

type LandingVideo = {
  id: number;
  src: string;
  title?: string;
};

export default function LandingVideoWall({
  videos,
}: {
  videos: ReadonlyArray<LandingVideo>;
}) {
  const [activeVideo, setActiveVideo] = useState<LandingVideo | null>(null);

  useEffect(() => {
    if (!activeVideo) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveVideo(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeVideo]);

  const columns = [
    { key: "down", videos: videos.slice(0, 6), className: "landing-video-track-down" },
    { key: "up", videos: videos.slice(6), className: "landing-video-track-up" },
  ] as const;

  return (
    <>
      <div className="block md:hidden">
        <div className="landing-video-mobile-wall overflow-hidden rounded-[1.5rem] bg-transparent p-2">
          <div className="landing-video-mobile-column">
            <div className="landing-video-track landing-video-track-up">
              {[...videos, ...videos].map((video, index) => (
                <button
                  key={`mobile-${video.id}-${index}`}
                  type="button"
                  className="landing-video-mobile-card landing-video-card-button group relative block overflow-hidden rounded-[1.5rem] text-left"
                  onClick={() => setActiveVideo(video)}
                  aria-label={`Open video ${video.id}`}
                >
                  <video
                    className="aspect-[16/10] w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/landing-hero-human.png"
                  >
                    <source src={video.src} type="video/mp4" />
                  </video>
                  <div className="landing-video-fade absolute inset-0" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/18 bg-[rgba(6,16,24,0.58)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-sm transition duration-200 group-hover:scale-105 group-hover:bg-[rgba(22,151,32,0.78)]">
                      <Play className="ml-1 h-5 w-5 fill-current" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="landing-video-wall hidden overflow-hidden rounded-[1.5rem] bg-transparent p-2 md:block md:p-3">
        <div className="grid grid-cols-2 gap-3">
          {columns.map((column) => (
            <div key={column.key} className="landing-video-column">
              <div className={`landing-video-track ${column.className}`}>
                {[...column.videos, ...column.videos].map((video, index) => (
                  <button
                    key={`${column.key}-${video.id}-${index}`}
                    type="button"
                    className="landing-video-card landing-video-card-button group relative overflow-hidden rounded-[1.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-left"
                    onClick={() => setActiveVideo(video)}
                    aria-label={`Open video ${video.id}`}
                  >
                    <video
                      className="aspect-[4/5] w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      poster="/landing-hero-human.png"
                    >
                      <source src={video.src} type="video/mp4" />
                    </video>
                    <div className="landing-video-fade absolute inset-0" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/18 bg-[rgba(6,16,24,0.58)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-sm transition duration-200 group-hover:scale-105 group-hover:bg-[rgba(22,151,32,0.78)]">
                        <Play className="ml-1 h-5 w-5 fill-current" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeVideo ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(4,10,16,0.82)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Video ${activeVideo.id}`}
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="landing-video-modal-shell relative w-full max-w-3xl overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#07131b] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-[rgba(7,19,27,0.78)] text-white transition hover:bg-[rgba(255,255,255,0.16)]"
              onClick={() => setActiveVideo(null)}
              aria-label="Close video"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              key={activeVideo.id}
              className="landing-video-modal-player w-full rounded-[1.25rem] bg-black"
              controls
              autoPlay
              playsInline
              preload="metadata"
              poster="/landing-hero-human.png"
            >
              <source src={activeVideo.src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      ) : null}
    </>
  );
}
