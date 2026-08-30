"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { correoParaLogin } from "@/app/socio/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EntrarSocioForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const datos = new FormData(e.currentTarget);
    const rut = String(datos.get("rut") ?? "");
    const clave = String(datos.get("clave") ?? "");

    // El RUT no es lo que Better Auth espera como identificador: se traduce
    // primero al correo sintético del socio en este comité.
    const resuelto = await correoParaLogin(slug, rut);
    if (!resuelto.ok) {
      setEnviando(false);
      setError(resuelto.error);
      return;
    }

    const { error: errorLogin } = await signIn.email({
      email: resuelto.email,
      password: clave,
    });

    if (errorLogin) {
      setEnviando(false);
      setError(
        "RUT o clave incorrectos, o tu solicitud todavía no ha sido aprobada."
      );
      return;
    }

    router.push("/socio/panel");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rut">RUT</Label>
        <Input
          id="rut"
          name="rut"
          placeholder="12345678-9"
          className="h-10"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clave">Clave</Label>
        <Input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
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
        {enviando ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
