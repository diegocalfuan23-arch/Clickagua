import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Acceso APR — FacilAgua",
  description:
    "Ingresa al panel de FacilAgua para administrar los socios y boletas de tu APR o SSR.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-100">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
        Acceso para tu APR
      </h1>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Ingresa con la cuenta de tu comité para administrar socios y boletas.
      </p>

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
