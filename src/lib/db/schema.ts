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
import { relations, sql } from "drizzle-orm";
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

/**
 * Plan contratado. Define qué puede hacer el comité:
 * BASICO   → panel + bot de WhatsApp
 * ESTANDAR → + landing pública en subdominio
 * PREMIUM  → + dominio propio
 */
export const planEnum = pgEnum("Plan", ["BASICO", "ESTANDAR", "PREMIUM"]);

export const frecuenciaLecturaEnum = pgEnum("FrecuenciaLectura", [
  "MENSUAL",
  "BIMENSUAL",
  "TRIMESTRAL",
]);

export const tipoAvisoEnum = pgEnum("TipoAviso", [
  "CORTE",
  "MANTENCION",
  "NOTICIA",
]);

/**
 * Un APR/SSR: el comité dueño de los datos. Todo lo demás cuelga de aquí,
 * de modo que un comité nunca vea los socios ni boletas de otro.
 */
export const aprs = pgTable(
  "Apr",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    nombre: text("nombre").notNull(),
    rut: text("rut").notNull(),
    comuna: text("comuna").notNull(),
    region: text("region"),
    direccion: text("direccion"),
    telefono: text("telefono"),
    email: text("email"),
    activo: boolean("activo").notNull().default(true),

    plan: planEnum("plan").notNull().default("BASICO"),

    // --- Landing pública (planes ESTANDAR y PREMIUM) ---
    /** Subdominio: pitrelahue → pitrelahue.clickagua.com */
    slug: text("slug"),
    /** Dominio propio, solo PREMIUM. Null hasta que se verifique. */
    dominioPropio: text("dominioPropio"),
    /** El comité decide cuándo publicarla; se genera antes de estar visible. */
    sitioPublicado: boolean("sitioPublicado").notNull().default(false),
    /** Texto libre de presentación. Si va vacío usamos uno por defecto. */
    sitioDescripcion: text("sitioDescripcion"),
    horarioAtencion: text("horarioAtencion"),
    /** Tarifas en CLP. Enteros: en Chile no se usan decimales. */
    tarifaCargoFijo: integer("tarifaCargoFijo"),
    tarifaMetroCubico: integer("tarifaMetroCubico"),
    /** Dónde y cómo pagar, en texto libre: varía mucho entre comités. */
    infoPago: text("infoPago"),

    // --- Datos del comité ---
    /** El nombre legal, que no siempre coincide con el de uso diario. */
    razonSocial: text("razonSocial"),
    sitioWeb: text("sitioWeb"),
    logoUrl: text("logoUrl"),

    // --- Facturación ---
    /** Día del mes en que el comité emite las boletas. */
    diaGeneracionBoletas: integer("diaGeneracionBoletas").notNull().default(1),
    /** Cuántos días desde la emisión hasta el vencimiento. */
    diasVencimiento: integer("diasVencimiento").notNull().default(15),
    /** Prefijo del número de boleta: BOL-000123. */
    prefijoBoleta: text("prefijoBoleta").notNull().default("BOL-"),
    /** Los APR suelen estar exentos, pero algunos facturan con IVA. */
    incluyeIva: boolean("incluyeIva").notNull().default(false),
    porcentajeIva: integer("porcentajeIva").notNull().default(19),

    // --- Medidores ---
    frecuenciaLectura: frecuenciaLecturaEnum("frecuenciaLectura")
      .notNull()
      .default("MENSUAL"),
    /**
     * Umbrales de consumo, en porcentaje sobre el promedio del socio.
     * El de fuga es el más útil: un salto grande casi siempre es una fuga,
     * y avisarlo a tiempo le ahorra plata al socio.
     */
    toleranciaConsumoAnormal: integer("toleranciaConsumoAnormal")
      .notNull()
      .default(50),
    alertaFugaConsumo: integer("alertaFugaConsumo").notNull().default(100),
    requiereFotoLectura: boolean("requiereFotoLectura")
      .notNull()
      .default(false),

    // --- Cortes por morosidad ---
    /** Días después del vencimiento antes de poder cortar. */
    diasGraciaCorte: integer("diasGraciaCorte").notNull().default(5),
    /** Con cuántos días de anticipación se avisa al socio. */
    diasAvisoCorte: integer("diasAvisoCorte").notNull().default(3),
    costoReconexion: integer("costoReconexion").notNull().default(0),

    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("Apr_rut_key").on(table.rut),
    // Parciales: varios comités pueden tener slug/dominio en null sin chocar.
    uniqueIndex("Apr_slug_key")
      .on(table.slug)
      .where(sql`${table.slug} IS NOT NULL`),
    uniqueIndex("Apr_dominioPropio_key")
      .on(table.dominioPropio)
      .where(sql`${table.dominioPropio} IS NOT NULL`),
  ]
);

export const aprsRelations = relations(aprs, ({ many }) => ({
  socios: many(socios),
  avisos: many(avisos),
}));

/**
 * Avisos de corte, mantención y noticias. Se publican en la landing y son
 * la misma fuente que responde el bot cuando preguntan por un corte.
 */
export const avisos = pgTable(
  "Aviso",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    aprId: text("aprId")
      .notNull()
      .references(() => aprs.id, { onDelete: "cascade" }),
    tipo: tipoAvisoEnum("tipo").notNull().default("CORTE"),
    titulo: text("titulo").notNull(),
    cuerpo: text("cuerpo"),
    /** Sectores afectados, en texto libre. */
    sectores: text("sectores"),
    /** Null en noticias: solo los cortes tienen ventana horaria. */
    inicia: timestamp("inicia", { precision: 3 }),
    termina: timestamp("termina", { precision: 3 }),
    publicado: boolean("publicado").notNull().default(true),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    index("Aviso_aprId_idx").on(table.aprId),
    index("Aviso_aprId_publicado_idx").on(table.aprId, table.publicado),
  ]
);

export const avisosRelations = relations(avisos, ({ one }) => ({
  apr: one(aprs, {
    fields: [avisos.aprId],
    references: [aprs.id],
  }),
}));

export const socios = pgTable(
  "Socio",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    aprId: text("aprId")
      .notNull()
      .references(() => aprs.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    rut: text("rut").notNull(),
    telefono: text("telefono").notNull(),
    direccion: text("direccion"),
    numeroCliente: text("numeroCliente"),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    // Únicos por APR, no globalmente: dos comités pueden tener socios
    // distintos con el mismo RUT o teléfono sin colisionar.
    uniqueIndex("Socio_apr_rut_key").on(table.aprId, table.rut),
    uniqueIndex("Socio_apr_telefono_key").on(table.aprId, table.telefono),
    index("Socio_aprId_idx").on(table.aprId),
  ]
);

export const sociosRelations = relations(socios, ({ many, one }) => ({
  apr: one(aprs, {
    fields: [socios.aprId],
    references: [aprs.id],
  }),
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

    /**
     * Lecturas del medidor. Opcionales: un comité puede seguir calculando en
     * su planilla y cargar solo el monto. Si vienen las dos, guardamos también
     * el desglose para poder mostrarlo en la boleta y explicárselo al socio.
     */
    lecturaAnterior: integer("lecturaAnterior"),
    lecturaActual: integer("lecturaActual"),
    consumoM3: integer("consumoM3"),
    /** Tarifas con las que se calculó, congeladas: si suben, la boleta vieja
        no debe cambiar de monto. */
    cargoFijo: integer("cargoFijo"),
    valorM3: integer("valorM3"),

    observacion: text("observacion"),

    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    index("Boleta_socioId_idx").on(table.socioId),
    index("Boleta_socioId_estado_idx").on(table.socioId, table.estado),
    // Un socio no puede tener dos boletas del mismo período: es lo que evita
    // que reimportar un CSV duplique el mes completo.
    uniqueIndex("Boleta_socio_periodo_key").on(table.socioId, table.periodo),
    index("Boleta_periodo_idx").on(table.periodo),
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
