"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await signOut();
        // Borra la copia de la pantalla de lecturas que guarda el service
        // worker: en un teléfono compartido no debe sobrevivir a la sesión.
        try {
          await caches.delete("facilapr-terreno-v1");
        } catch {
          // Sin Cache API no hay nada que borrar.
        }
        router.push("/login");
      }}
    >
      Cerrar sesión
    </Button>
  );
}
