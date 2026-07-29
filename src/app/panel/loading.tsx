import { Skeleton } from "@/components/ui/skeleton";

/**
 * Sin este archivo, Next espera a que la página termine sus consultas antes
 * de pintar nada: el clic en el sidebar quedaba "colgado" y el ítem nuevo no
 * se marcaba hasta que respondía la base.
 *
 * Con loading.tsx la navegación es inmediata y esto ocupa el lugar mientras
 * llegan los datos.
 */
export default function CargandoPanel() {
  return (
    <>
      <Skeleton className="h-9 w-48" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-96 rounded-xl lg:row-span-2" />
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
      </div>
    </>
  );
}
