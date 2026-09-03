"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

interface Detection {
  label: string;
}

interface VQASectionProps {
  imageFile: File | null;
  apiUrl: string;
  accessibilityMode: boolean;
  detections: Detection[];
}

function getSuggestedQuestions(
  detections: Detection[]
): string[] {
  const labels = [
    ...new Set(
      detections.map((detection) => detection.label)
    ),
  ];

  const questions: string[] = [];

  if (labels.includes("person")) {
    questions.push(
      "How many people are in the image?",
      "What are the people doing?",
      "What is the person holding?"
    );
  }

  if (labels.includes("dog")) {
    questions.push(
      "Is there a dog in the image?",
      "What is the dog doing?"
    );
  }

  if (labels.includes("cat")) {
    questions.push(
      "Is there a cat in the image?",
      "What is the cat doing?"
    );
  }

  if (
    labels.some((label) =>
      ["car", "truck", "bus", "motorcycle", "bicycle"].includes(label)
    )
  ) {
    questions.push(
      "Are there any vehicles in the image?",
      "Is there a car in the image?"
    );
  }

  if (
    labels.some((label) =>
      ["horse", "bird", "sheep", "cow"].includes(label)
    )
  ) {
    questions.push(
      "What is the animal doing?",
      "How many animals are in the image?"
    );
  }

  questions.push(
    "What is happening in the image?",
    "What objects are visible in the image?"
  );

  return [...new Set(questions)].slice(0, 4);
}

export default function VQASection({
  imageFile,
  apiUrl,
  accessibilityMode,
  detections,
}: VQASectionProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = getSuggestedQuestions(detections);

  useEffect(() => {
    setQuestion("");
    setAnswer(null);
    setError(null);
  }, [imageFile]);

  useEffect(() => {
    if (!accessibilityMode) {
      window.speechSynthesis?.cancel();
    }
  }, [accessibilityMode]);

  const speakAnswer = (text: string) => {
    if (!accessibilityMode) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      setError(
        "Text-to-speech is not supported by this browser."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  };

  const askQuestion = async (
    event?: FormEvent<HTMLFormElement>,
    selectedQuestion?: string
  ) => {
    event?.preventDefault();

    const questionToAsk =
      selectedQuestion?.trim() || question.trim();

    if (!imageFile || !questionToAsk) {
      return;
    }

    setQuestion(questionToAsk);
    setIsAsking(true);
    setAnswer(null);
    setError(null);

    window.speechSynthesis?.cancel();

    try {
      const formData = new FormData();

      formData.append("file", imageFile);
      formData.append("question", questionToAsk);

      const response = await fetch(`${apiUrl}/api/ask`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to answer the question."
        );
      }

      const newAnswer = data.answer;

      setAnswer(newAnswer);

      if (accessibilityMode) {
        speakAnswer(newAnswer);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to answer the question.";

      setError(message);
    } finally {
      setIsAsking(false);
    }
  };

  return (
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
          Visual Question Answering
        </p>

        <h2 className="mt-1 text-lg font-semibold text-neutral-950">
          Ask about this image
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Ask a question about what you see in the image.
        </p>
      </div>

      {suggestedQuestions.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-neutral-500">
            Suggested questions
          </p>

          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isAsking}
                onClick={() =>
                  askQuestion(undefined, suggestion)
                }
                className={[
                  "rounded-full border px-3 py-2 text-left text-xs font-medium transition",
                  accessibilityMode
                    ? "border-neutral-300 bg-neutral-50 text-neutral-800 hover:bg-neutral-100"
                    : "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={askQuestion}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            placeholder="Ask anything about this image..."
            disabled={isAsking}
            aria-label="Question about the image"
            className={[
              "min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-neutral-900",
              "placeholder:text-neutral-400 focus:outline-none focus:ring-2",
              accessibilityMode
                ? "border-2 border-neutral-400 focus:border-neutral-900 focus:ring-neutral-200"
                : "border border-violet-200 focus:border-violet-400 focus:ring-violet-100",
              "disabled:opacity-60",
            ].join(" ")}
          />

          <button
            type="submit"
            disabled={
              isAsking ||
              !imageFile ||
              !question.trim()
            }
            className={[
              "rounded-xl px-5 py-3 text-sm font-semibold transition",
              accessibilityMode
                ? "border-2 border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
                : "bg-violet-600 text-white hover:bg-violet-700",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            {isAsking ? "Thinking..." : "Ask"}
          </button>
        </div>
      </form>

      {error && (
        <div
          className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {answer && !error && (
        <div
          className={[
            "mt-5 rounded-xl p-4",
            accessibilityMode
              ? "border-2 border-neutral-300 bg-neutral-50"
              : "bg-violet-50",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-violet-500">
            Answer
          </p>

          <p
            className={[
              "mt-2 text-base leading-7",
              accessibilityMode
                ? "text-lg font-medium text-neutral-950"
                : "text-violet-950",
            ].join(" ")}
          >
            {answer}
          </p>

          {accessibilityMode && (
            <button
              type="button"
              onClick={() => speakAnswer(answer)}
              className="mt-4 rounded-lg border-2 border-neutral-900 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              🔊 Read answer again
            </button>
          )}
        </div>
      )}
    </section>
  );
}