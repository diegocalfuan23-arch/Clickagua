import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Acceso APR — Facilapr",
  description:
    "Ingresa al panel de Facilapr para administrar los socios y boletas de tu APR o SSR.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ cuenta?: string }>;
}) {
  const { cuenta } = await searchParams;

  return (
    <div className="w-full max-w-100">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
        Acceso para tu APR
      </h1>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Ingresa con la cuenta de tu comité para administrar socios y boletas.
      </p>

      {cuenta === "desactivada" && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-destructive/10 px-3.5 py-2.5 text-[0.88rem] text-destructive"
        >
          Tu acceso fue desactivado por la directiva del comité. Si crees que es
          un error, habla con ellos.
        </p>
      )}

      <LoginForm />

      <p className="mt-6 text-center text-[0.9rem] text-muted-foreground">
        ¿Tu comité aún no tiene cuenta?{" "}
        <Link
          href="/registro"
          className="font-medium text-primary hover:underline"
        >
          Registrar mi APR
        </Link>
      </p>
    </div>
  );
}
