"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const cargos = [
  { value: "presidente", label: "Presidente/a" },
  { value: "tesorero", label: "Tesorero/a" },
  { value: "secretario", label: "Secretario/a" },
  { value: "administrador", label: "Administrador/a" },
  { value: "otro", label: "Otro" },
];

export function RegisterForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="mt-7 grid gap-4 sm:grid-cols-2"
    >
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="apr">Nombre del APR o SSR</Label>
        <Input
          id="apr"
          name="apr"
          placeholder="Ej: APR Pitrelahué"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rut-comite">RUT del comité</Label>
        <Input
          id="rut-comite"
          name="rutComite"
          placeholder="76.543.210-9"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comuna">Comuna</Label>
        <Input id="comuna" name="comuna" placeholder="Ej: Freire" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="responsable">Nombre del responsable</Label>
        <Input
          id="responsable"
          name="responsable"
          placeholder="Nombre y apellido"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cargo">Cargo en el comité</Label>
        <Select name="cargo">
          <SelectTrigger id="cargo" className="w-full">
            <SelectValue placeholder="Selecciona un cargo" />
          </SelectTrigger>
          <SelectContent>
            {cargos.map((cargo) => (
              <SelectItem key={cargo.value} value={cargo.value}>
                {cargo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="email">Correo del comité</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tesoreria@apr-ejemplo.cl"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <span className="text-[0.8rem] text-muted-foreground">
          Mínimo 8 caracteres.
        </span>
      </div>

      <Button type="submit" className="mt-2 h-10 w-full sm:col-span-2">
        Crear cuenta del comité
      </Button>

      <p className="text-center text-[0.8rem] leading-relaxed text-muted-foreground sm:col-span-2">
        Al crear la cuenta aceptas los términos de servicio y la política de
        privacidad de ClickAgua.
      </p>
    </form>
  );
}
