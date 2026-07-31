import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/auth-schema";
import { aprs } from "@/lib/db/schema";
import { user as userTable } from "@/lib/db/auth-schema";

/**
 * Orígenes aceptados. Sin esto, Better Auth solo confía en BETTER_AUTH_URL y
 * rechaza con "invalid origin" cualquier petición que llegue desde otra
 * variante del dominio: el sitio se sirve en www pero la variable apunta al
 * raíz, y el registro fallaba por esa diferencia.
 *
 * Los sitios de los comités viven en subdominios, así que el comodín cubre
 * pitrelahue.facilagua.com y cualquier otro que se publique.
 */
const DOMINIO = process.env.NEXT_PUBLIC_DOMINIO_RAIZ ?? "facilagua.com";

const origenesConfiables = [
  `https://${DOMINIO}`,
  `https://www.${DOMINIO}`,
  `https://*.${DOMINIO}`,
  // Los previews de Vercel cambian de URL en cada deploy.
  "https://*.vercel.app",
];

export const auth = betterAuth({
  trustedOrigins: origenesConfiables,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    camelCase: true,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      apr: {
        type: "string",
        required: true,
      },
      rutComite: {
        type: "string",
        required: true,
      },
      comuna: {
        type: "string",
        required: true,
      },
      cargo: {
        type: "string",
        required: true,
      },
      aprId: {
        type: "string",
        required: false,
        // Lo asigna el servidor tras crear el APR, nunca el cliente.
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Al registrarse un dirigente creamos el comité y lo vinculamos,
        // de modo que sus socios y boletas queden aislados de otros APR.
        after: async (nuevoUsuario) => {
          const datos = nuevoUsuario as typeof nuevoUsuario & {
            apr: string;
            rutComite: string;
            comuna: string;
          };

          const existente = await db.query.aprs.findFirst({
            where: eq(aprs.rut, datos.rutComite),
          });

          const aprId =
            existente?.id ??
            (
              await db
                .insert(aprs)
                .values({
                  nombre: datos.apr,
                  rut: datos.rutComite,
                  comuna: datos.comuna,
                })
                .returning()
            )[0].id;

          await db
            .update(userTable)
            .set({ aprId })
            .where(eq(userTable.id, nuevoUsuario.id));
        },
      },
    },
  },
});
