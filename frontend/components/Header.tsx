export default function Header() {
  return (
    <header className="border-b border-violet-100 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>

          <span className="text-base font-semibold tracking-tight text-neutral-950">
            VisionAI
          </span>
        </div>
      </div>
    </header>
  );
}