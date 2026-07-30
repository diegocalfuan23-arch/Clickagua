import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoConfiguracion() {
  return (
    <>
      <Skeleton className="h-9 w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </>
  );
}
