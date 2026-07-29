import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoSitio() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>

      <Skeleton className="h-12 rounded-xl" />

      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-52 rounded-xl" />
      ))}
    </>
  );
}
