import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Crear nueva contraseña — Facilapr",
  description: "Crea una contraseña nueva para tu cuenta de Facilapr.",
};

type Props = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams;

  if (!token || error) {
    return (
      <div className="w-full max-w-100">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
          Enlace no válido
        </h1>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">
          Este enlace de recuperación ya venció o no es válido. Pide uno
          nuevo para seguir.
        </p>
        <Link
          href="/olvide-clave"
          className="mt-6 inline-block font-medium text-primary hover:underline"
        >
          Pedir un nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-100">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
        Crea una contraseña nueva
      </h1>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Elige una contraseña de al menos 8 caracteres.
      </p>

      <ResetPasswordForm token={token} />
    </div>
  );
}
