import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/auth-schema";

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
    },
  },
});
