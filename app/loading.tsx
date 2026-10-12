const SKELETON_CARDS = 12;

export default function Loading() {
  return (
    <div className="flex-1 bg-zinc-50">
      <main
        className="max-w-5xl mx-auto px-6 py-12"
        aria-busy="true"
        aria-label="Loading exchange rates"
      >
        <div className="mb-8 h-8 w-56 animate-pulse rounded-md bg-zinc-200" />
        <div className="mb-6 h-4 w-40 animate-pulse rounded bg-zinc-200" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: SKELETON_CARDS }, (_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5"
            >
              <div className="h-4 w-12 rounded bg-zinc-200" />
              <div className="mt-2 h-3 w-28 rounded bg-zinc-200" />
              <div className="mt-5 h-7 w-20 rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
