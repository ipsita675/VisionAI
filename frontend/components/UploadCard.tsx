"use client";

import { DragEvent, useRef, useState } from "react";

interface UploadCardProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export default function UploadCard({
  onFileSelect,
  isAnalyzing,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleBrowse = () => {
    if (!isAnalyzing) {
      inputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleBrowse}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          handleBrowse();
        }
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={[
        "group cursor-pointer rounded-2xl border-2 border-dashed p-10",
        "transition-all duration-200 sm:p-14",
        isDragging
          ? "border-violet-500 bg-violet-50"
          : "border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50/50",
        isAnalyzing ? "pointer-events-none opacity-60" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onFileSelect(file);
          }

          event.target.value = "";
        }}
        className="hidden"
      />

      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div
          className={[
            "mb-5 flex h-14 w-14 items-center justify-center rounded-full",
            "border border-violet-100 bg-violet-50",
            "transition-transform duration-200 group-hover:scale-105",
          ].join(" ")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-violet-600"
            aria-hidden="true"
          >
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M4 16.5v1.25A2.25 2.25 0 0 0 6.25 20h11.5A2.25 2.25 0 0 0 20 17.75V16.5" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-neutral-950">
          {isDragging ? "Drop your image here" : "Upload an image"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Drag and drop an image here, or{" "}
          <span className="font-medium text-violet-700 underline underline-offset-4">
            browse your files
          </span>
        </p>

        <p className="mt-5 text-xs text-violet-400">
          JPG, PNG or WebP · Maximum 10 MB
        </p>
      </div>
    </div>
  );
}