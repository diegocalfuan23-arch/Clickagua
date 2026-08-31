import type { Metadata } from "next";
import Link from "next/link";
import { OlvideClaveForm } from "@/components/auth/olvide-clave-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña — Facilapr",
  description: "Recupera el acceso a la cuenta de tu comité en Facilapr.",
};

export default function OlvideClavePage() {
  return (
    <div className="w-full max-w-100">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
        ¿Olvidaste tu contraseña?
      </h1>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Ingresa el correo con el que registraste tu comité y te enviamos un
        enlace para crear una contraseña nueva.
      </p>

      <OlvideClaveForm />

      <p className="mt-6 text-center text-[0.9rem] text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
