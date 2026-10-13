const SKELETON_CARDS = 14;

export default function Loading() {
  return (
    <div className="flex-1">
      <main
        className="max-w-5xl mx-auto px-6 py-12"
        aria-busy="true"
        aria-label="Loading exchange rates"
      >
        <div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-900/80" />
        <div className="mt-2 h-4 w-44 animate-pulse rounded bg-zinc-900/80" />

        <div className="mt-8 h-56 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50" />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: SKELETON_CARDS }, (_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="h-3 w-10 rounded bg-zinc-800" />
              <div className="mt-2 h-3 w-24 rounded bg-zinc-800/70" />
              <div className="mt-4 h-7 w-20 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
