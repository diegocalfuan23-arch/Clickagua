"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OlvideClaveForm() {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);

    const datos = new FormData(e.currentTarget);

    // Better Auth responde igual exista o no la cuenta, para no confirmarle
    // a un desconocido si un correo está registrado. Por eso no hay manejo
    // de error aquí: siempre se muestra el mismo mensaje de éxito.
    await authClient.requestPasswordReset({
      email: String(datos.get("email") ?? ""),
      redirectTo: "/reset-password",
    });

    setEnviando(false);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="mt-7 flex items-start gap-3 rounded-lg bg-forest/10 px-4 py-3.5 text-[0.9rem] text-forest">
        <Check className="mt-0.5 size-4.5 shrink-0" />
        <p>
          Si ese correo está registrado, te enviamos un enlace para crear una
          contraseña nueva. Revisa también spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo del comité</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tesoreria@apr-ejemplo.cl"
          className="h-10"
          required
        />
      </div>

      <Button type="submit" disabled={enviando} className="mt-2 h-10 w-full">
        {enviando && <Loader2 className="animate-spin" />}
        {enviando ? "Enviando…" : "Enviar enlace de recuperación"}
      </Button>
    </form>
  );
}
