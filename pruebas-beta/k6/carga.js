import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://host.docker.internal:3000";
const COOKIE = __ENV.COOKIE;

export const options = {
  scenarios: {
    navegacion: {
      executor: "constant-vus",
      vus: 10,
      duration: "1m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
  summaryTrendStats: ["avg", "min", "med", "max", "p(50)", "p(90)", "p(95)", "p(99)"],
};

const PAGINAS = [
  ["inicio", "/inicio", "Hola,"],
  ["alimentar", "/alimentar", "Alimentar"],
  ["inventario", "/inventario", "Disponible ahora"],
];

export default function () {
  const cabeceras = { headers: { Cookie: `plumita_sesion=${COOKIE}` }, redirects: 0 };
  for (const [nombre, ruta, texto] of PAGINAS) {
    group(nombre, () => {
      const respuesta = http.get(`${BASE}${ruta}`, cabeceras);
      check(respuesta, {
        "estado 200": (r) => r.status === 200,
        "contenido esperado": (r) => typeof r.body === "string" && r.body.indexOf(texto) !== -1,
      });
    });
    sleep(1 + Math.random() * 2);
  }
}
