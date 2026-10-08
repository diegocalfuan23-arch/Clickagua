"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import {
  confirmarIniciales,
  previsualizarIniciales,
  type PrevisualizacionIniciales,
} from "@/app/panel/lecturas/iniciales-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Vista = Extract<PrevisualizacionIniciales, { ok: true }>;

const numero = new Intl.NumberFormat("es-CL");

/** El mes anterior, que es lo normal para la lectura de partida. */
function mesAnterior() {
  const hoy = new Date();
  const d = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Cargar la lectura de partida de cada medidor, de una vez, desde Excel o CSV.
 * Se guardan aprobadas pero SIN boleta: sirven de "lectura anterior" para que
 * la primera boleta cobre solo el consumo del mes y no el medidor completo.
 */
export function LecturasInicialesDialog({
  abierto,
  onAbiertoChange,
}: {
  abierto: boolean;
  onAbiertoChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [vista, setVista] = useState<Vista | null>(null);
  const [cargadas, setCargadas] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, iniciar] = useTransition();
  // El reloj se lee una vez al montar, no en cada render.
  const [periodoInicial] = useState(mesAnterior);

  function cambiarAbierto(v: boolean) {
    onAbiertoChange(v);
    if (!v) {
      setVista(null);
      setCargadas(null);
      setError(null);
    }
  }

  function leer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    setError(null);
    iniciar(async () => {
      const r = await previsualizarIniciales(datos);
      if (r.ok) setVista(r);
      else setError(r.error);
    });
  }

  const validas = vista?.filas.filter((f) => !f.error && f.socioId) ?? [];
  const conProblema = (vista?.filas.length ?? 0) - validas.length;

  function confirmar() {
    if (!vista) return;
    setError(null);
    iniciar(async () => {
      const r = await confirmarIniciales(
        validas.map((f) => ({ socioId: f.socioId!, valor: f.valor! })),
        vista.periodo
      );
      if (r.ok) {
        setCargadas(r.cargadas);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={cambiarAbierto}>
      <DialogContent className={vista && cargadas === null ? "sm:max-w-3xl" : "sm:max-w-130"}>
        <DialogHeader>
          <DialogTitle>Cargar lecturas iniciales</DialogTitle>
          <DialogDescription>
            {cargadas !== null
              ? "Listo."
              : vista
                ? "Revisa a qué arranque entendí cada lectura. Las que tienen un problema no se cargan."
                : "La lectura de partida de cada medidor. No genera boletas: sirve para que la primera boleta cobre solo el consumo del mes."}
          </DialogDescription>
        </DialogHeader>

        {cargadas !== null ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-forest/30 bg-forest/5 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-forest" />
              <p className="text-[0.92rem]">
                <strong>{cargadas}</strong>{" "}
                {cargadas === 1 ? "lectura inicial cargada" : "lecturas iniciales cargadas"}. Desde
                ahora, la próxima lectura de cada uno cobrará solo su consumo.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => cambiarAbierto(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : vista ? (
          <div className="flex min-w-0 flex-col gap-3">
            <ul className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-[0.82rem] text-muted-foreground">
              {vista.notas.map((n) => (
                <li key={n}>{n}</li>
              ))}
              <li>Período con que se guardan: {vista.periodo}.</li>
            </ul>

            <p className="text-[0.88rem]">
              <strong className="tabular-nums">{validas.length}</strong> listas para cargar
              {conProblema > 0 && (
                <span className="ml-2 font-medium text-destructive">
                  · {conProblema} con problema (no se cargan)
                </span>
              )}
            </p>

            <div className="max-h-[48vh] overflow-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[560px] text-[0.85rem]">
                <thead className="sticky top-0 bg-muted text-left text-[0.78rem] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Fila</th>
                    <th className="px-3 py-2 font-medium">Arranque</th>
                    <th className="px-3 py-2 text-right font-medium">Lectura</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {vista.filas.map((f) => (
                    <tr key={f.linea} className={cn(f.error && "bg-destructive/5")}>
                      <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{f.linea}</td>
                      <td className="px-3 py-1.5">
                        <div className="font-medium">{f.nombre ?? f.referencia}</div>
                        {f.nombre && (
                          <div className="text-[0.76rem] text-muted-foreground">{f.referencia}</div>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {f.valor !== null ? numero.format(f.valor) : "—"}
                      </td>
                      <td className="px-3 py-1.5">
                        {f.error ? (
                          <span className="text-[0.78rem] font-medium text-destructive">{f.error}</span>
                        ) : (
                          <span className="text-[0.78rem] text-forest">Lista</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <p className="text-[0.88rem] text-destructive">{error}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={() => setVista(null)} disabled={trabajando}>
                Elegir otro archivo
              </Button>
              <Button onClick={confirmar} disabled={trabajando || validas.length === 0}>
                {trabajando && <Loader2 className="animate-spin" />}
                Cargar {validas.length} {validas.length === 1 ? "lectura" : "lecturas"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={leer} className="flex flex-col gap-4">
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-[0.85rem]">
              <p className="font-medium">Cómo debe venir el archivo</p>
              <p className="mt-1.5 text-muted-foreground">
                Una fila por arranque, con una columna <strong>Lectura</strong> y otra que lo
                identifique: <strong>N.º</strong>, <strong>Nombre</strong> o <strong>RUT</strong>. Si
                hay socios y usuarios con el mismo N.º, agrega una columna <strong>Tipo</strong>.
                Solo se aceptan arranques que todavía no tienen lecturas.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="periodo-iniciales">Período de estas lecturas</Label>
              <Input
                id="periodo-iniciales"
                name="periodo"
                defaultValue={periodoInicial}
                placeholder="2026-09"
                required
                className="max-w-40"
              />
              <span className="text-[0.8rem] text-muted-foreground">
                Normalmente el mes anterior al primer mes que vas a cobrar.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="archivo-iniciales">Archivo (Excel o CSV)</Label>
              <Input
                id="archivo-iniciales"
                name="archivo"
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                required
              />
            </div>

            {error && (
              <p className="flex items-start gap-2 text-[0.88rem] text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => cambiarAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={trabajando}>
                {trabajando ? <Loader2 className="animate-spin" /> : <FileUp />}
                {trabajando ? "Leyendo…" : "Leer y revisar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
