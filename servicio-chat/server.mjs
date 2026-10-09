/**
 * Servidor de tiempo real del chat. Hace de Pusher, pero propio:
 *
 *  - Los navegadores se conectan por Socket.IO con un token corto (JWT) que
 *    firma Facilapr tras comprobar la sesión. El token dice a qué salas puede
 *    entrar esa persona; aquí no se consulta ninguna base de datos.
 *  - Facilapr publica los mensajes con POST /emitir, protegido por un secreto
 *    compartido. Este servicio no guarda nada: si se reinicia, solo se
 *    reconectan los clientes y el historial sigue en la base de Facilapr.
 *
 * Variables de entorno: ver .env.example
 */
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { Server } from "socket.io";
import { jwtVerify } from "jose";

const PUERTO = Number(process.env.PORT ?? 3001);
const SECRETO_JWT = process.env.CHAT_JWT_SECRET;
const SECRETO_EMITIR = process.env.CHAT_EMIT_SECRET;
const ORIGENES = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (!SECRETO_JWT || SECRETO_JWT.length < 32 || !SECRETO_EMITIR || SECRETO_EMITIR.length < 32) {
  console.error(
    "Faltan CHAT_JWT_SECRET y CHAT_EMIT_SECRET (mínimo 32 caracteres cada uno). Genera uno con: openssl rand -hex 32",
  );
  process.exit(1);
}

const clave = new TextEncoder().encode(SECRETO_JWT);

function secretoValido(recibido) {
  if (typeof recibido !== "string") return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(SECRETO_EMITIR);
  return a.length === b.length && timingSafeEqual(a, b);
}

function leerCuerpo(req, limite = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const partes = [];
    req.on("data", (c) => {
      total += c.length;
      if (total > limite) {
        reject(new Error("Cuerpo demasiado grande"));
        req.destroy();
        return;
      }
      partes.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(partes).toString("utf8")));
    req.on("error", reject);
  });
}

const http = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/salud") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }

  if (req.method === "POST" && req.url === "/emitir") {
    if (!secretoValido(req.headers["x-api-secret"])) {
      res.writeHead(401).end();
      return;
    }
    try {
      const { sala, evento, datos } = JSON.parse(await leerCuerpo(req));
      if (typeof sala !== "string" || typeof evento !== "string") {
        res.writeHead(400).end();
        return;
      }
      io.to(sala).emit(evento, datos);
      res.writeHead(204).end();
    } catch {
      res.writeHead(400).end();
    }
    return;
  }

  res.writeHead(404).end();
});

const io = new Server(http, {
  cors: { origin: ORIGENES.length ? ORIGENES : false },
  // En el campo la señal se corta seguido: se tolera más antes de dar por caída la conexión.
  pingInterval: 25_000,
  pingTimeout: 30_000,
});

// Cada conexión trae un token; sin token válido no entra.
io.use(async (socket, next) => {
  try {
    const { payload } = await jwtVerify(String(socket.handshake.auth?.token ?? ""), clave, {
      algorithms: ["HS256"],
      issuer: "facilapr",
    });
    const salas = payload.salas;
    if (!Array.isArray(salas) || salas.length === 0 || salas.length > 20) {
      return next(new Error("sin salas"));
    }
    socket.data.salas = salas.filter((s) => typeof s === "string");
    next();
  } catch {
    next(new Error("no autorizado"));
  }
});

io.on("connection", (socket) => {
  for (const sala of socket.data.salas) socket.join(sala);
});

http.listen(PUERTO, () => {
  console.log(`Servicio de chat escuchando en el puerto ${PUERTO}`);
});

function apagar() {
  io.close(() => process.exit(0));
}
process.on("SIGTERM", apagar);
process.on("SIGINT", apagar);
