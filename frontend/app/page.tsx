"use client";

import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import UploadCard from "@/components/UploadCard";
import ImageViewer from "@/components/ImageViewer";
import VQASection from "@/components/VQASection";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

interface AnalysisResult {
  success: boolean;
  filename: string;
  image: {
    width: number;
    height: number;
  };
  caption: string;
  detections: Detection[];
}

function formatObjectLabel(label: string) {
  const irregularPlurals: Record<string, string> = {
    person: "people",
    mouse: "mice",
  };

  return irregularPlurals[label] || `${label}s`;
}

function buildAudioDescription(
  caption: string,
  detections: Detection[]
) {
  const objectCounts = detections.reduce<Record<string, number>>(
    (counts, detection) => {
      counts[detection.label] =
        (counts[detection.label] || 0) + 1;

      return counts;
    },
    {}
  );

  const objectSummary = Object.entries(objectCounts)
    .map(([label, count]) => {
      return `${count} ${
        count === 1 ? label : formatObjectLabel(label)
      }`;
    })
    .join(", ");

  if (!objectSummary) {
    return caption;
  }

  return `${caption} Detected objects include ${objectSummary}.`;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hoveredDetection, setHoveredDetection] = useState<number | null>(
    null
  );

  const [expandedObjects, setExpandedObjects] = useState<
    Record<string, boolean>
  >({});

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [accessibilityMode, setAccessibilityMode] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speakAnalysis = (analysis: AnalysisResult) => {
    if (!accessibilityMode) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      setError(
        "Text-to-speech is not supported by this browser."
      );
      return;
    }

    const description = buildAudioDescription(
      analysis.caption,
      analysis.detections
    );

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(description);

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setError("Unable to read the image description aloud.");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setResult(null);
    setHoveredDetection(null);
    setExpandedObjects({});
    setIsSpeaking(false);

    window.speechSynthesis?.cancel();

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(url);
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setHoveredDetection(null);
    setExpandedObjects({});
    setIsSpeaking(false);

    window.speechSynthesis?.cancel();

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Something went wrong while analyzing the image."
        );
      }

      setResult(data);

      if (accessibilityMode) {
        setTimeout(() => {
          speakAnalysis(data);
        }, 100);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to analyze the image.";

      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    window.speechSynthesis?.cancel();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setHoveredDetection(null);
    setExpandedObjects({});
    setIsSpeaking(false);
  };

  const toggleSpeech = () => {
    if (!result || !accessibilityMode) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      setError(
        "Text-to-speech is not supported by this browser."
      );
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    speakAnalysis(result);
  };

  const handleAccessibilityToggle = (enabled: boolean) => {
    if (!enabled) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setAccessibilityMode(false);
      return;
    }

    setAccessibilityMode(true);

    if (result) {
      setTimeout(() => {
        speakAnalysis(result);
      }, 100);
    }
  };

  const objectGroups =
    result?.detections.reduce<Record<string, number[]>>(
      (groups, detection, index) => {
        if (!groups[detection.label]) {
          groups[detection.label] = [];
        }

        groups[detection.label].push(index);

        return groups;
      },
      {}
    ) ?? {};

  const toggleObjectGroup = (label: string) => {
    setExpandedObjects((current) => ({
      ...current,
      [label]: !current[label],
    }));
  };

  return (
    <main
      className={[
        "min-h-screen transition-colors duration-200",
        accessibilityMode
          ? "bg-white"
          : "bg-[#f7f5ff]",
      ].join(" ")}
    >
      <Header />

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 lg:px-8">
        <div className="mb-8 flex justify-end">
          <div
            className={[
              "flex items-center rounded-xl border p-1",
              accessibilityMode
                ? "border-neutral-300 bg-neutral-100"
                : "border-violet-200 bg-white",
            ].join(" ")}
            role="group"
            aria-label="Display mode"
          >
            <button
              type="button"
              onClick={() => handleAccessibilityToggle(false)}
              aria-pressed={!accessibilityMode}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                !accessibilityMode
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-white hover:text-neutral-900",
              ].join(" ")}
            >
              Normal
            </button>

            <button
              type="button"
              onClick={() => handleAccessibilityToggle(true)}
              aria-pressed={accessibilityMode}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                accessibilityMode
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-white hover:text-neutral-900",
              ].join(" ")}
            >
              Accessibility
            </button>
          </div>
        </div>

        {accessibilityMode && (
          <div
            className="mb-8 rounded-2xl border-2 border-neutral-900 bg-neutral-50 px-5 py-4"
            role="status"
          >
            <div className="flex items-start gap-3">
              <span
                className="text-xl"
                aria-hidden="true"
              >
                🔊
              </span>

              <div>
                <p className="font-semibold text-neutral-950">
                  Accessibility mode is on
                </p>

                <p className="mt-1 text-sm leading-6 text-neutral-700">
                  Image descriptions and VQA answers will be read aloud
                  automatically. Controls are optimized for keyboard and
                  screen-reader use.
                </p>
              </div>
            </div>
          </div>
        )}

        {!selectedFile ? (
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-violet-600">
                Computer Vision
              </p>

              <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
                Understand your images
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-600">
                Upload an image and let AI generate a scene description and
                identify the objects inside it.
              </p>
            </div>

            <UploadCard
              onFileSelect={handleFileSelect}
              isAnalyzing={false}
            />

            {error && (
              <div
                className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-violet-600">
                  Image Analysis
                </p>

                <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  {result ? "Analysis complete" : "Ready to analyze"}
                </h1>

                <p className="mt-2 text-sm text-neutral-600">
                  {selectedFile.name}
                </p>
              </div>

              <button
                type="button"
                onClick={resetAnalysis}
                className={[
                  "w-fit rounded-lg border-2 px-4 py-2 text-sm font-semibold transition",
                  accessibilityMode
                    ? "border-neutral-400 bg-white text-neutral-900 hover:bg-neutral-100"
                    : "border-violet-200 bg-white text-violet-700 hover:border-violet-300 hover:bg-violet-50",
                ].join(" ")}
              >
                Choose another image
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <ImageViewer
                imageUrl={previewUrl}
                detections={result?.detections ?? []}
                hoveredDetection={hoveredDetection}
              />

              <div className="space-y-6">
                <section
                  className={[
                    "rounded-2xl bg-white p-6 shadow-sm",
                    accessibilityMode
                      ? "border-2 border-neutral-900"
                      : "border border-violet-100",
                  ].join(" ")}
                >
                  <div className="mb-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-500">
                      Scene
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-neutral-950">
                      Scene description
                    </h2>
                  </div>

                  {isAnalyzing ? (
                    <div className="space-y-3">
                      <div className="h-4 w-full animate-pulse rounded bg-violet-50" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-violet-50" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-violet-50" />
                    </div>
                  ) : result ? (
                    <>
                      <p className="text-lg leading-8 text-neutral-700">
                        {result.caption}
                      </p>

                      {accessibilityMode && (
                        <button
                          type="button"
                          onClick={toggleSpeech}
                          className="mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-neutral-900 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                          aria-label={
                            isSpeaking
                              ? "Stop reading image description"
                              : "Read image description aloud"
                          }
                        >
                          <span aria-hidden="true">
                            {isSpeaking ? "■" : "🔊"}
                          </span>

                          {isSpeaking
                            ? "Stop reading"
                            : "Read description aloud"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-neutral-400">
                      Your generated caption will appear here.
                    </p>
                  )}
                </section>

                <section
                  className={[
                    "rounded-2xl bg-white p-6 shadow-sm",
                    accessibilityMode
                      ? "border-2 border-neutral-900"
                      : "border border-violet-100",
                  ].join(" ")}
                >
                  <div className="mb-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-500">
                      Detection
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-neutral-950">
                      Objects in the image
                    </h2>
                  </div>

                  {isAnalyzing ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between"
                        >
                          <div className="h-4 w-24 animate-pulse rounded bg-violet-50" />
                          <div className="h-4 w-12 animate-pulse rounded bg-violet-50" />
                        </div>
                      ))}
                    </div>
                  ) : result &&
                    Object.keys(objectGroups).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(objectGroups).map(
                        ([label, detectionIndexes]) => {
                          const isExpanded =
                            expandedObjects[label] ?? false;

                          return (
                            <div
                              key={label}
                              className="overflow-hidden rounded-xl"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleObjectGroup(label)
                                }
                                aria-expanded={isExpanded}
                                className={[
                                  "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition",
                                  accessibilityMode
                                    ? "border border-neutral-300 bg-neutral-100 hover:bg-neutral-200"
                                    : "bg-violet-50 hover:bg-violet-100",
                                ].join(" ")}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className="text-xs text-violet-500"
                                    aria-hidden="true"
                                  >
                                    {isExpanded ? "▾" : "▸"}
                                  </span>

                                  <p className="text-sm font-semibold capitalize text-violet-900">
                                    {detectionIndexes.length}{" "}
                                    {detectionIndexes.length === 1
                                      ? label
                                      : formatObjectLabel(label)}
                                  </p>
                                </div>

                                <span className="text-xs font-medium text-violet-500">
                                  {detectionIndexes.length} detected
                                </span>
                              </button>

                              {isExpanded && (
                                <div className="space-y-1 px-2 pb-2 pt-2">
                                  {detectionIndexes.map(
                                    (detectionIndex, objectIndex) => {
                                      const detection =
                                        result.detections[
                                          detectionIndex
                                        ];

                                      const isHovered =
                                        hoveredDetection ===
                                        detectionIndex;

                                      return (
                                        <div
                                          key={detectionIndex}
                                          onMouseEnter={() =>
                                            setHoveredDetection(
                                              detectionIndex
                                            )
                                          }
                                          onMouseLeave={() =>
                                            setHoveredDetection(null)
                                          }
                                          className={[
                                            "flex items-center justify-between rounded-lg px-4 py-2.5",
                                            "transition-all duration-150",
                                            isHovered
                                              ? "bg-violet-100 ring-1 ring-violet-300"
                                              : "hover:bg-violet-50",
                                          ].join(" ")}
                                        >
                                          <span className="text-sm text-neutral-700">
                                            {label === "person"
                                              ? `Person ${
                                                  objectIndex + 1
                                                }`
                                              : `${label} ${
                                                  objectIndex + 1
                                                }`}
                                          </span>

                                          <span className="text-xs font-semibold text-violet-600">
                                            {(
                                              detection.confidence *
                                              100
                                            ).toFixed(0)}
                                            %
                                          </span>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : result ? (
                    <p className="text-sm text-neutral-400">
                      No supported objects were detected.
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-400">
                      Detected objects will appear here.
                    </p>
                  )}
                </section>

                <VQASection
                  imageFile={selectedFile}
                  apiUrl={API_URL}
                  accessibilityMode={accessibilityMode}
                  detections={result?.detections ?? []}
                />

                {error && (
                  <div
                    className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className={[
                    "w-full rounded-xl px-5 py-3.5 text-sm font-semibold shadow-sm transition",
                    accessibilityMode
                      ? "border-2 border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
                      : "bg-violet-600 text-white hover:bg-violet-700 hover:shadow-md",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  ].join(" ")}
                >
                  {isAnalyzing
                    ? "Analyzing image..."
                    : "Analyze image"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}