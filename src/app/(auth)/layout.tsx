import Link from "next/link";
import { Logo } from "@/components/marca/logo";
import { MessageCircle, ReceiptText, Users } from "lucide-react";

/**
 * Login y registro en dos columnas: el formulario a la izquierda y la
 * propuesta de valor a la derecha.
 *
 * Mobile primero: bajo lg el panel derecho no se renderiza —no se oculta con
 * CSS— y el formulario ocupa toda la pantalla. En un teléfono ese panel sería
 * scroll que estorba antes de llegar al campo de correo.
 */

const ARGUMENTOS = [
  {
    icono: MessageCircle,
    titulo: "Responde solo por WhatsApp",
    texto: "Tus socios preguntan cuánto deben y el bot contesta al instante.",
  },
  {
    icono: ReceiptText,
    titulo: "Boletas sin planillas",
    texto: "Emite el período completo desde un archivo y registra los pagos.",
  },
  {
    icono: Users,
    titulo: "Tu padrón ordenado",
    texto: "Socios, medidores y consumo en un solo lugar.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 lg:grid lg:grid-cols-[1fr_minmax(0,28rem)] xl:grid-cols-2">
      {/* Columna del formulario */}
      <div className="flex min-h-full flex-1 flex-col">
        <header className="px-6 py-6 sm:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold"
          >
            <Logo className="size-6.5" />
            Facilapr
          </Link>
        </header>

        {/* Sin límite de ancho aquí: cada página fija el suyo, porque el
            registro tiene más campos que el login y necesita más espacio. */}
        <main className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
          {children}
        </main>

        <footer className="px-6 py-6 text-[0.8rem] text-muted-foreground sm:px-10">
          &copy; 2026 Facilapr · Para comités de agua potable rural de Chile
        </footer>
      </div>

      {/* Panel de marca: solo desde lg. */}
      <aside className="relative hidden overflow-hidden bg-primary p-10 lg:flex lg:flex-col lg:justify-between">
        {/* Círculos difuminados: dan profundidad sin cargar una imagen. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/[0.07] blur-3xl"
        />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[0.8rem] font-medium text-white">
            <span className="size-1.5 rounded-full bg-white" />
            Para comités de agua potable rural
          </span>
        </div>

        <div className="relative">
          <h2 className="text-[2rem] leading-[1.15] font-semibold tracking-tight text-white">
            El agua la administra
            <br />
            tu comité.
            <br />
            <span className="text-white/70">Las respuestas, nosotros.</span>
          </h2>

          <div className="mt-10 flex flex-col gap-6">
            {ARGUMENTOS.map(({ icono: Icono, titulo, texto }) => (
              <div key={titulo} className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icono className="size-4.5 text-white" />
                </span>
                <div>
                  <div className="text-[0.95rem] font-medium text-white">
                    {titulo}
                  </div>
                  <p className="mt-0.5 text-[0.87rem] leading-relaxed text-white/70">
                    {texto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[0.83rem] text-white/60">
          Sin instalar nada. Tus socios usan el WhatsApp que ya tienen.
        </p>
      </aside>
    </div>
  );
}
