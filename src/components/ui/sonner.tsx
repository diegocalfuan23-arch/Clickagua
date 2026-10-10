"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Avisos breves (toasts) con los colores de la app. Se monta una sola vez en
 * el layout raíz; desde cualquier componente de cliente se usa
 * `import { toast } from "sonner"` y `toast.success("…")`.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      offset={{ bottom: 88, right: 20 }}
      mobileOffset={{ bottom: 88, right: 16, left: 16 }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border-border !font-sans !text-[0.88rem] !shadow-lg",
        },
      }}
      {...props}
    />
  );
}
