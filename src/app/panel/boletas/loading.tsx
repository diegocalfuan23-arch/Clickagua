import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoBoletas() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-125 rounded-xl" />
    </>
  );
}
