import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Droplet } from "lucide-react";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = {
  title: "Panel — ClickAgua",
};

export default async function PanelPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-7 py-4">
        <div className="flex items-center gap-2 text-base font-semibold">
          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-secondary">
            <Droplet className="size-3.5 fill-white text-white" />
          </span>
          ClickAgua
        </div>
        <SignOutButton />
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-7 py-12">
        <h1 className="text-[1.6rem] font-semibold tracking-tight">
          Hola, {user.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Cuenta de <strong className="text-foreground">{user.apr}</strong> ·{" "}
          {user.comuna}
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-7">
          <h2 className="text-[1.05rem] font-semibold">
            Aún no hay socios cargados
          </h2>
          <p className="mt-2 max-w-[52ch] text-[0.93rem] leading-relaxed text-muted-foreground">
            Cuando cargues a los socios de tu comité, aparecerán aquí junto a
            sus boletas y el estado de sus consultas por WhatsApp.
          </p>
        </div>
      </main>
    </div>
  );
}
