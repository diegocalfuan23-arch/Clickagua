import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aprs } from "@/lib/db/schema";
import { EntrarSocioForm } from "@/components/socio/entrar-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Mi cuenta — ${slug}` };
}

export default async function EntrarSocioPage({ params }: Props) {
  const { slug } = await params;

  const apr = await db.query.aprs.findFirst({
    where: eq(aprs.slug, slug),
    columns: { nombre: true },
  });
  if (!apr) notFound();

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-6 py-16">
      <h1 className="text-[1.4rem] font-semibold tracking-tight">
        Mi cuenta — {apr.nombre}
      </h1>
      <p className="mt-2 text-[0.92rem] text-muted-foreground">
        Ingresa con tu RUT y tu clave.
      </p>

      <EntrarSocioForm slug={slug} />

      <p className="mt-6 text-center text-[0.85rem] text-muted-foreground">
        ¿Todavía no tienes cuenta?{" "}
        <Link
          href="/socio/solicitar"
          className="font-medium text-primary hover:underline"
        >
          Solicítala aquí
        </Link>
      </p>
    </div>
  );
}
