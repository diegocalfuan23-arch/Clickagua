import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const estadoBoletaEnum = pgEnum("EstadoBoleta", [
  "PENDIENTE",
  "PAGADA",
  "VENCIDA",
  "ANULADA",
]);

export const direccionMensajeEnum = pgEnum("DireccionMensaje", [
  "ENTRANTE",
  "SALIENTE",
]);

export const socios = pgTable(
  "Socio",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    tenantId: text("tenantId").notNull().default("default"),
    nombre: text("nombre").notNull(),
    rut: text("rut").notNull(),
    telefono: text("telefono").notNull(),
    direccion: text("direccion"),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("Socio_rut_key").on(table.rut),
    uniqueIndex("Socio_telefono_key").on(table.telefono),
    index("Socio_tenantId_idx").on(table.tenantId),
  ]
);

export const sociosRelations = relations(socios, ({ many, one }) => ({
  boletas: many(boletas),
  conversacion: one(conversaciones, {
    fields: [socios.id],
    references: [conversaciones.socioId],
  }),
}));

export const boletas = pgTable(
  "Boleta",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    socioId: text("socioId")
      .notNull()
      .references(() => socios.id),
    periodo: text("periodo").notNull(),
    montoTotal: integer("montoTotal").notNull(),
    montoPagado: integer("montoPagado").notNull().default(0),
    estado: estadoBoletaEnum("estado").notNull().default("PENDIENTE"),
    fechaEmision: timestamp("fechaEmision", { precision: 3 }).notNull(),
    fechaVencimiento: timestamp("fechaVencimiento", {
      precision: 3,
    }).notNull(),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    index("Boleta_socioId_idx").on(table.socioId),
    index("Boleta_socioId_estado_idx").on(table.socioId, table.estado),
  ]
);

export const boletasRelations = relations(boletas, ({ one }) => ({
  socio: one(socios, {
    fields: [boletas.socioId],
    references: [socios.id],
  }),
}));

export const conversaciones = pgTable(
  "Conversacion",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    telefono: text("telefono").notNull(),
    socioId: text("socioId").references(() => socios.id),
    estado: text("estado"),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("Conversacion_telefono_key").on(table.telefono),
    uniqueIndex("Conversacion_socioId_key").on(table.socioId),
  ]
);

export const conversacionesRelations = relations(
  conversaciones,
  ({ one, many }) => ({
    socio: one(socios, {
      fields: [conversaciones.socioId],
      references: [socios.id],
    }),
    mensajes: many(mensajes),
  })
);

export const mensajes = pgTable(
  "Mensaje",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    conversacionId: text("conversacionId")
      .notNull()
      .references(() => conversaciones.id),
    direccion: direccionMensajeEnum("direccion").notNull(),
    whatsappMessageId: text("whatsappMessageId"),
    contenido: text("contenido").notNull(),
    payloadCrudo: jsonb("payloadCrudo"),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("Mensaje_whatsappMessageId_key").on(table.whatsappMessageId),
    index("Mensaje_conversacionId_idx").on(table.conversacionId),
  ]
);

export const mensajesRelations = relations(mensajes, ({ one }) => ({
  conversacion: one(conversaciones, {
    fields: [mensajes.conversacionId],
    references: [conversaciones.id],
  }),
}));
