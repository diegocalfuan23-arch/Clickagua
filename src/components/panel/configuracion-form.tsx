"use client";

import { useActionState, useState } from "react";
import {
  Building2,
  Check,
  Gauge,
  Globe,
  Loader2,
  ReceiptText,
  Scissors,
} from "lucide-react";
import {
  guardarComite,
  guardarCortes,
  guardarFacturacion,
  guardarMedidores,
  guardarRegional,
  type ResultadoAccion,
} from "@/app/panel/configuracion/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type DatosConfiguracion = {
  nombre: string;
  razonSocial: string | null;
  rut: string;
  comuna: string;
  region: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  sitioWeb: string | null;
  pais: string;
  moneda: string;
  zonaHoraria: string;
  diaGeneracionBoletas: number;
  diasVencimiento: number;
  prefijoBoleta: string;
  incluyeIva: boolean;
  porcentajeIva: number;
  frecuenciaLectura: "MENSUAL" | "BIMENSUAL" | "TRIMESTRAL";
  toleranciaConsumoAnormal: number;
  alertaFugaConsumo: number;
  requiereFotoLectura: boolean;
  diasGraciaCorte: number;
  diasAvisoCorte: number;
  costoReconexion: number;
};

/**
 * Cada bloque guarda por separado. Un solo formulario gigante obliga a
 * revisar todo para cambiar un dato, y un error en cualquier campo bloquea
 * el resto.
 */
function Bloque({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string;
  descripcion: string;
  accion: (
    prev: ResultadoAccion | null,
    formData: FormData,
  ) => Promise<ResultadoAccion>;
  children: React.ReactNode;
}) {
  const [estado, enviar, pendiente] = useActionState<
    ResultadoAccion | null,
    FormData
  >(accion, null);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h2 className="text-[1.05rem] font-semibold">{titulo}</h2>
      <p className="mt-0.5 text-[0.87rem] text-muted-foreground">
        {descripcion}
      </p>

      <form action={enviar} className="mt-5 flex flex-col gap-4">
        {children}

        {estado && !estado.ok && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[0.88rem] text-destructive">
            {estado.error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button type="submit" disabled={pendiente}>
            {pendiente && <Loader2 className="animate-spin" />}
            Guardar
          </Button>
          {estado?.ok && (
            <span className="flex items-center gap-1.5 text-[0.88rem] text-forest">
              <Check className="size-4" />
              Guardado
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

function Campo({
  id,
  label,
  ayuda,
  children,
}: {
  id: string;
  label: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {ayuda && <p className="text-[0.8rem] text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

type Seccion = "comite" | "regional" | "facturacion" | "medidores" | "cortes";

const SECCIONES: { id: Seccion; label: string; icono: typeof Building2 }[] = [
  { id: "comite", label: "Comité", icono: Building2 },
  { id: "regional", label: "País y moneda", icono: Globe },
  { id: "facturacion", label: "Facturación", icono: ReceiptText },
  { id: "medidores", label: "Medidores", icono: Gauge },
  { id: "cortes", label: "Cortes", icono: Scissors },
];

export function ConfiguracionForm({ datos }: { datos: DatosConfiguracion }) {
  const [seccion, setSeccion] = useState<Seccion>("comite");

  return (
    <>
      <div>
        <h1 className="text-[1.35rem] font-semibold tracking-tight">
          Configuración
        </h1>
        <p className="mt-0.5 text-[0.9rem] text-muted-foreground">
          Los datos de tu comité y las reglas con que se emiten las boletas.
        </p>
      </div>

      {/* Cinco bloques apilados eran un muro de campos. Con el menú al
          costado cada tema se ve solo, los nombres se leen en vertical sin
          competir por el ancho, y el formulario conserva el espacio. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav
          aria-label="Secciones de configuración"
          className="flex shrink-0 gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible"
        >
          {SECCIONES.map(({ id, label, icono: Icono }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSeccion(id)}
              aria-current={seccion === id ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.9rem] font-medium transition-colors lg:w-full",
                seccion === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icono className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* min-w-0 evita que un campo ancho empuje el menú fuera de la vista. */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
      {seccion === "comite" && (
        <Bloque
          titulo="Datos del comité"
          descripcion="Aparecen en las boletas y en tu sitio público."
          accion={guardarComite}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="nombre" label="Nombre del comité">
              <Input
                id="nombre"
                name="nombre"
                defaultValue={datos.nombre}
                required
              />
            </Campo>
            <Campo
              id="razonSocial"
              label="Razón social"
              ayuda="El nombre legal, si es distinto del de uso diario."
            >
              <Input
                id="razonSocial"
                name="razonSocial"
                defaultValue={datos.razonSocial ?? ""}
              />
            </Campo>
            <Campo id="rut" label="RUT">
              <Input id="rut" name="rut" defaultValue={datos.rut} required />
            </Campo>
            <Campo id="telefono" label="Teléfono">
              <Input
                id="telefono"
                name="telefono"
                defaultValue={datos.telefono ?? ""}
                placeholder="+56 9 1234 5678"
              />
            </Campo>
            <Campo id="comuna" label="Comuna">
              <Input
                id="comuna"
                name="comuna"
                defaultValue={datos.comuna}
                required
              />
            </Campo>
            <Campo id="region" label="Región">
              <Input
                id="region"
                name="region"
                defaultValue={datos.region ?? ""}
              />
            </Campo>
            <Campo id="direccion" label="Dirección">
              <Input
                id="direccion"
                name="direccion"
                defaultValue={datos.direccion ?? ""}
              />
            </Campo>
            <Campo id="email" label="Correo">
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={datos.email ?? ""}
              />
            </Campo>
            <Campo id="sitioWeb" label="Sitio web">
              <Input
                id="sitioWeb"
                name="sitioWeb"
                defaultValue={datos.sitioWeb ?? ""}
                placeholder="https://…"
              />
            </Campo>
          </div>
        </Bloque>
      )}

      {seccion === "regional" && (
        <Bloque
          titulo="País y moneda"
          descripcion="Dónde opera el comité. Prepara el sistema para operar fuera de Chile."
          accion={guardarRegional}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="pais" label="País">
              <select
                id="pais"
                name="pais"
                defaultValue={datos.pais}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="CL">Chile</option>
                <option value="PE">Perú</option>
                <option value="BO">Bolivia</option>
                <option value="AR">Argentina</option>
                <option value="CO">Colombia</option>
                <option value="EC">Ecuador</option>
              </select>
            </Campo>
            <Campo
              id="moneda"
              label="Moneda"
              ayuda="Código de 3 letras: CLP, PEN, BOB…"
            >
              <Input
                id="moneda"
                name="moneda"
                defaultValue={datos.moneda}
                maxLength={3}
                className="uppercase"
              />
            </Campo>
            <Campo id="zonaHoraria" label="Zona horaria">
              <select
                id="zonaHoraria"
                name="zonaHoraria"
                defaultValue={datos.zonaHoraria}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="America/Santiago">Chile continental</option>
                <option value="Pacific/Easter">Isla de Pascua</option>
                <option value="America/Lima">Perú</option>
                <option value="America/La_Paz">Bolivia</option>
                <option value="America/Argentina/Buenos_Aires">
                  Argentina
                </option>
                <option value="America/Bogota">Colombia</option>
                <option value="America/Guayaquil">Ecuador</option>
              </select>
            </Campo>
          </div>

          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-[0.83rem] text-muted-foreground">
            Por ahora los montos y fechas del panel se muestran en formato
            chileno. Estos datos quedan guardados para cuando FacilAgua opere
            fuera de Chile.
          </p>
        </Bloque>
      )}

      {seccion === "facturacion" && (
        <Bloque
          titulo="Facturación"
          descripcion="Cuándo se emiten las boletas y cuándo vencen."
          accion={guardarFacturacion}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              id="diaGeneracionBoletas"
              label="Día de emisión"
              ayuda="Del 1 al 28, para que exista en todos los meses."
            >
              <Input
                id="diaGeneracionBoletas"
                name="diaGeneracionBoletas"
                inputMode="numeric"
                defaultValue={datos.diaGeneracionBoletas}
              />
            </Campo>
            <Campo
              id="diasVencimiento"
              label="Días para pagar"
              ayuda="Desde la emisión hasta el vencimiento."
            >
              <Input
                id="diasVencimiento"
                name="diasVencimiento"
                inputMode="numeric"
                defaultValue={datos.diasVencimiento}
              />
            </Campo>
            <Campo
              id="prefijoBoleta"
              label="Prefijo del número"
              ayuda={`Las boletas se numeran ${datos.prefijoBoleta}000123.`}
            >
              <Input
                id="prefijoBoleta"
                name="prefijoBoleta"
                defaultValue={datos.prefijoBoleta}
                maxLength={10}
              />
            </Campo>
            <Campo
              id="porcentajeIva"
              label="Porcentaje de IVA"
              ayuda="Solo se aplica si marcas la casilla de abajo."
            >
              <Input
                id="porcentajeIva"
                name="porcentajeIva"
                inputMode="numeric"
                defaultValue={datos.porcentajeIva}
              />
            </Campo>
          </div>

          <label className="flex items-start gap-2.5 text-[0.9rem]">
            <Checkbox
              name="incluyeIva"
              defaultChecked={datos.incluyeIva}
              className="mt-0.5"
            />
            <span>
              Las boletas incluyen IVA
              <span className="mt-0.5 block text-[0.8rem] text-muted-foreground">
                La mayoría de los comités de agua rural está exenta.
              </span>
            </span>
          </label>
        </Bloque>
      )}

      {seccion === "medidores" && (
        <Bloque
          titulo="Medidores y lecturas"
          descripcion="Cada cuánto se toman las lecturas y cuándo avisar de un consumo raro."
          accion={guardarMedidores}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="frecuenciaLectura" label="Frecuencia de lectura">
              <select
                id="frecuenciaLectura"
                name="frecuenciaLectura"
                defaultValue={datos.frecuenciaLectura}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="MENSUAL">Mensual</option>
                <option value="BIMENSUAL">Cada dos meses</option>
                <option value="TRIMESTRAL">Cada tres meses</option>
              </select>
            </Campo>
            <Campo
              id="toleranciaConsumoAnormal"
              label="Consumo anormal (%)"
              ayuda="Sobre el promedio del socio. Al superarlo, conviene revisar."
            >
              <Input
                id="toleranciaConsumoAnormal"
                name="toleranciaConsumoAnormal"
                inputMode="numeric"
                defaultValue={datos.toleranciaConsumoAnormal}
              />
            </Campo>
            <Campo
              id="alertaFugaConsumo"
              label="Posible fuga (%)"
              ayuda="Un salto de este tamaño casi siempre es una fuga."
            >
              <Input
                id="alertaFugaConsumo"
                name="alertaFugaConsumo"
                inputMode="numeric"
                defaultValue={datos.alertaFugaConsumo}
              />
            </Campo>
          </div>

          <label className="flex items-start gap-2.5 text-[0.9rem]">
            <Checkbox
              name="requiereFotoLectura"
              defaultChecked={datos.requiereFotoLectura}
              className="mt-0.5"
            />
            <span>
              Pedir foto del medidor al registrar la lectura
              <span className="mt-0.5 block text-[0.8rem] text-muted-foreground">
                Sirve como respaldo si un socio reclama su consumo.
              </span>
            </span>
          </label>
        </Bloque>
      )}

      {seccion === "cortes" && (
        <Bloque
          titulo="Cortes por morosidad"
          descripcion="Cuánto se espera antes de cortar y con cuánto aviso."
          accion={guardarCortes}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo
              id="diasGraciaCorte"
              label="Días de gracia"
              ayuda="Después del vencimiento, antes de poder cortar."
            >
              <Input
                id="diasGraciaCorte"
                name="diasGraciaCorte"
                inputMode="numeric"
                defaultValue={datos.diasGraciaCorte}
              />
            </Campo>
            <Campo
              id="diasAvisoCorte"
              label="Días de aviso previo"
              ayuda="Con cuánta anticipación se avisa al socio."
            >
              <Input
                id="diasAvisoCorte"
                name="diasAvisoCorte"
                inputMode="numeric"
                defaultValue={datos.diasAvisoCorte}
              />
            </Campo>
            <Campo
              id="costoReconexion"
              label="Costo de reconexión"
              ayuda="En pesos. Deja 0 si no se cobra."
            >
              <Input
                id="costoReconexion"
                name="costoReconexion"
                inputMode="numeric"
                defaultValue={datos.costoReconexion}
              />
            </Campo>
          </div>
        </Bloque>
      )}
        </div>
      </div>
    </>
  );
}
