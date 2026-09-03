"use client";

import { useEffect, useState } from "react";

interface Detection {
  label: string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface ImageViewerProps {
  imageUrl: string | null;
  detections: Detection[];
  hoveredDetection: number | null;
}

export default function ImageViewer({
  imageUrl,
  detections,
  hoveredDetection,
}: ImageViewerProps) {
  const [imageSize, setImageSize] = useState({
    width: 1,
    height: 1,
  });

  const [viewMode, setViewMode] = useState<"original" | "detections">(
    "detections"
  );

  useEffect(() => {
    if (!imageUrl) {
      setImageSize({
        width: 1,
        height: 1,
      });

      setViewMode("detections");
    }
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50">
        <p className="text-sm text-violet-400">
          Select an image to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="border-b border-violet-100 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-500">
              Visual Analysis
            </p>

            <h2 className="mt-1 text-lg font-semibold text-neutral-950">
              Image preview
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {detections.length > 0 && (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                {detections.length}{" "}
                {detections.length === 1 ? "object" : "objects"}
              </span>
            )}

            <div
              className="flex rounded-lg border border-violet-200 bg-violet-50 p-1"
              role="group"
              aria-label="Image view"
            >
              <button
                type="button"
                onClick={() => setViewMode("original")}
                aria-pressed={viewMode === "original"}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  viewMode === "original"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-violet-500 hover:text-violet-700",
                ].join(" ")}
              >
                Original
              </button>

              <button
                type="button"
                onClick={() => setViewMode("detections")}
                disabled={detections.length === 0}
                aria-pressed={viewMode === "detections"}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  viewMode === "detections"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-violet-500 hover:text-violet-700",
                  detections.length === 0
                    ? "cursor-not-allowed opacity-40"
                    : "",
                ].join(" ")}
              >
                Detections
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[500px] items-center justify-center bg-violet-50 p-4 sm:p-6">
        <div className="relative inline-block max-w-full">
          <img
            src={imageUrl}
            alt={
              viewMode === "detections"
                ? "Uploaded image with detected objects highlighted"
                : "Uploaded image"
            }
            className="block max-h-[650px] max-w-full rounded-lg object-contain"
            onLoad={(event) => {
              const image = event.currentTarget;

              setImageSize({
                width: image.naturalWidth,
                height: image.naturalHeight,
              });
            }}
          />

          {viewMode === "detections" &&
            imageSize.width > 1 &&
            imageSize.height > 1 &&
            detections.map((detection, index) => {
              const left =
                (detection.box.x1 / imageSize.width) * 100;

              const top =
                (detection.box.y1 / imageSize.height) * 100;

              const width =
                ((detection.box.x2 - detection.box.x1) /
                  imageSize.width) *
                100;

              const height =
                ((detection.box.y2 - detection.box.y1) /
                  imageSize.height) *
                100;

              const isHighlighted = hoveredDetection === index;

              return (
                <div
                  key={`${detection.label}-${index}`}
                  className={[
                    "pointer-events-none absolute rounded-sm border-2 transition-all duration-150",
                    isHighlighted
                      ? "border-violet-500 bg-violet-400/20 shadow-[0_0_0_3px_rgba(139,92,246,0.25)]"
                      : "border-white/80",
                  ].join(" ")}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                  }}
                >
                  <span
                    className={[
                      "absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize shadow-sm transition-all duration-150",
                      isHighlighted
                        ? "bg-violet-600 text-white"
                        : "bg-white/90 text-neutral-900",
                    ].join(" ")}
                  >
                    {detection.label}{" "}
                    {(detection.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}