"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutSocioButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await signOut();
        router.push("/socio/entrar");
      }}
    >
      Cerrar sesión
    </Button>
  );
}
