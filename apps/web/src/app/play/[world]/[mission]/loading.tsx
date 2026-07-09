import { Skeleton } from "@logicland/ui";

export default function Loading() {
  return (
    <main className="mx-auto max-w-lg px-5 py-6">
      <Skeleton className="mb-4 h-5 w-32" />
      <Skeleton className="mb-5 h-12 w-64" />
      <Skeleton className="mb-4 aspect-square w-full rounded-3xl" />
      <Skeleton className="mb-4 h-14 rounded-2xl" />
      <div className="flex justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-16 rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
