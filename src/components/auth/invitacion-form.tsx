"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { unirseConInvitacion } from "@/app/(auth)/invitacion/[codigo]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InvitacionForm({
  codigo,
  apr,
}: {
  codigo: string;
  apr: { nombre: string; rut: string; comuna: string };
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const datos = new FormData(e.currentTarget);
    const nombre = String(datos.get("nombre") ?? "");

    const { data, error: errorRegistro } = await signUp.email({
      email: String(datos.get("email") ?? ""),
      password: String(datos.get("password") ?? ""),
      name: nombre,
      apr: apr.nombre,
      rutComite: apr.rut,
      comuna: apr.comuna,
      cargo: "operador",
    });

    if (errorRegistro || !data) {
      setEnviando(false);
      setError(
        errorRegistro?.message ??
          "No pudimos crear la cuenta. Revisa los datos e inténtalo otra vez."
      );
      return;
    }

    const resultado = await unirseConInvitacion(codigo, data.user.id);
    if (!resultado.ok) {
      setEnviando(false);
      setError(resultado.error);
      return;
    }

    router.push("/panel");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Tu nombre</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Nombre y apellido"
          className="h-10"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="h-10"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="h-10"
          required
        />
        <span className="text-[0.8rem] text-muted-foreground">
          Mínimo 8 caracteres.
        </span>
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
        {enviando ? "Creando cuenta…" : "Crear mi cuenta"}
      </Button>
    </form>
  );
}
