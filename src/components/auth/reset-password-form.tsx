"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const datos = new FormData(e.currentTarget);
    const clave = String(datos.get("password") ?? "");
    const confirmacion = String(datos.get("confirmacion") ?? "");

    if (clave !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);

    const { error: errorReset } = await authClient.resetPassword({
      newPassword: clave,
      token,
    });

    if (errorReset) {
      setEnviando(false);
      setError(
        "Este enlace ya venció o no es válido. Pide uno nuevo desde la página anterior."
      );
      return;
    }

    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="h-10"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmacion">Repite la contraseña</Label>
        <Input
          id="confirmacion"
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="h-10"
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-[0.88rem] text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={enviando} className="mt-2 h-10 w-full">
        {enviando && <Loader2 className="animate-spin" />}
        {enviando ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
