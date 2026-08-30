"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { solicitarAcceso } from "@/app/socio/[slug]/actions";
import type { ResultadoSolicitud } from "@/lib/socios-acceso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SolicitarAccesoForm({ slug }: { slug: string }) {
  const [estado, accion, pendiente] = useActionState<
    ResultadoSolicitud | null,
    FormData
  >((prev, formData) => solicitarAcceso(slug, prev, formData), null);

  if (estado?.ok) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-forest/30 bg-forest/5 p-6 text-center">
        <Check className="size-8 text-forest" />
        <p className="text-[0.95rem] font-medium">Solicitud enviada</p>
        <p className="text-[0.88rem] text-muted-foreground">
          Tu comité revisará la solicitud. Te podrás conectar apenas la
          aprueben.
        </p>
      </div>
    );
  }

  return (
    <form action={accion} className="mt-7 flex flex-col gap-4">
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
        <Label htmlFor="clave">Crea una clave</Label>
        <Input
          id="clave"
          name="clave"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="h-10"
          required
        />
        <span className="text-[0.8rem] text-muted-foreground">
          Mínimo 8 caracteres. La usarás para entrar una vez que te aprueben.
        </span>
      </div>

      {estado && !estado.ok && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-[0.88rem] text-destructive"
        >
          {estado.error}
        </p>
      )}

      <Button type="submit" disabled={pendiente} className="mt-2 h-10 w-full">
        {pendiente && <Loader2 className="animate-spin" />}
        {pendiente ? "Enviando…" : "Solicitar acceso"}
      </Button>
    </form>
  );
}
