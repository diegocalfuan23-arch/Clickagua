"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const datos = new FormData(e.currentTarget);

    const { error: errorLogin } = await signIn.email({
      email: String(datos.get("email") ?? ""),
      password: String(datos.get("password") ?? ""),
    });

    if (errorLogin) {
      setEnviando(false);
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/panel");
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link
            href="/olvide-clave"
            className="text-[0.82rem] text-muted-foreground hover:text-foreground"
          >
            ¿La olvidaste?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={mostrar ? "text" : "password"}
            autoComplete="current-password"
            className="h-10 pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            aria-label={mostrar ? "Ocultar la contraseña" : "Mostrar la contraseña"}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
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
        {enviando ? "Entrando…" : "Entrar al panel"}
      </Button>
    </form>
  );
}
