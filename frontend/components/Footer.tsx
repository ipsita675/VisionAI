
export default function Footer() {
  return (
    <footer className="border-t border-violet-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold text-neutral-950">
            Ipsita Pandey
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            Computer Vision · AI Image Analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm">
          <a
            href="mailto:msipsitapandey@gmail.com"
            className="text-neutral-600 transition hover:text-violet-600"
          >
            Email
          </a>

          <a
            href="https://github.com/ipsita675"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 transition hover:text-violet-600"
          >
            GitHub
          </a>

          <a
            href="https://www.linkedin.com/in/ipsitapandey/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 transition hover:text-violet-600"
          >
            LinkedIn
          </a>
        </div>
      </div>

      <div className="border-t border-violet-50">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <p className="text-center text-xs text-neutral-400">
            © {new Date().getFullYear()} Ipsita Pandey. Built with Next.js,
            FastAPI and computer vision models.
          </p>
        </div>
      </div>
    </footer>
  );
}