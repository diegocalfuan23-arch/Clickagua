import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/auth-schema";
import { aprs } from "@/lib/db/schema";
import { user as userTable } from "@/lib/db/auth-schema";

export const auth = betterAuth({
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
