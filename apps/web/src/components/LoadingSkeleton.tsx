export function CardSkeleton() {
  return (
    <div className="bg-dark-900 rounded-xl overflow-hidden border border-dark-800 animate-pulse flex flex-col">
      <div className="aspect-[2/3] w-full bg-dark-850" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-dark-800 rounded w-4/5" />
        <div className="h-2.5 bg-dark-800/60 rounded w-2/5" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-80 sm:h-96 rounded-2xl bg-dark-900 border border-dark-800 animate-pulse p-8 flex flex-col justify-end space-y-4 mb-12">
      <div className="h-4 bg-dark-800 rounded w-32" />
      <div className="h-8 bg-dark-800 rounded w-2/3 max-w-md" />
      <div className="h-3.5 bg-dark-800/60 rounded w-4/5 max-w-lg" />
      <div className="h-3.5 bg-dark-800/60 rounded w-3/5 max-w-md" />
      <div className="h-9 bg-dark-800 rounded w-36 pt-2" />
    </div>
  );
}

