/*
 * Service worker del técnico de terreno. Hace UNA cosa: que la pantalla de
 * cargar lecturas abra aunque no haya señal, para que la cola local del
 * formulario pueda seguir recibiendo lecturas (ver lecturas-offline.ts).
 *
 * Es mínimo a propósito. No cachea datos de la API ni ninguna otra página:
 * un caché de páginas autenticadas es fácil de dejar desactualizado y
 * delicado en un teléfono compartido.
 *   - /panel/lecturas: red primero; si falla, la última copia buena.
 *   - /_next/static/*: archivos con hash en el nombre, no cambian; caché primero.
 * El caché se borra al cerrar sesión (sign-out-button.tsx).
 */
const CACHE = "facilapr-terreno-v1";
const PAGINA = "/panel/lecturas";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate" && url.pathname === PAGINA) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Una redirección (p. ej. a /login sin sesión) no se guarda: dejaría
          // la pantalla de login como si fuera la de lecturas.
          if (res.ok && !res.redirected) {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(PAGINA, copia));
          }
          return res;
        })
        .catch(() => caches.match(PAGINA).then((hit) => hit || Response.error()))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copia = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copia));
            }
            return res;
          })
      )
    );
  }
});
