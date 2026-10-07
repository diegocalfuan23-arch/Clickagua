"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Abre el diálogo de impresión del navegador: ahí también se elige "Guardar como PDF". */
export function ImprimirBoton({ etiqueta = "Imprimir o guardar PDF" }: { etiqueta?: string }) {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer />
      {etiqueta}
    </Button>
  );
}
