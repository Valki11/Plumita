"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feather, House, Package, Settings, Wheat } from "lucide-react";

const PESTANAS = [
  { ruta: "/inicio", etiqueta: "Inicio", titulo: "Inicio", Icono: House },
  { ruta: "/aves", etiqueta: "Mis aves", titulo: "Mis aves", Icono: Feather },
  { ruta: "/alimentar", etiqueta: "Alimentar", titulo: "Alimentar", Icono: Wheat },
  { ruta: "/inventario", etiqueta: "Inventario", titulo: "Inventario", Icono: Package },
  { ruta: "/ajustes", etiqueta: "Ajustes", titulo: "Configuración", Icono: Settings },
];

export function BarraSuperior() {
  const ruta = usePathname();
  const pestana = PESTANAS.find((p) => ruta.startsWith(p.ruta));
  return (
    <header className="barra-superior">
      <div className="logo" aria-hidden="true">
        <Feather size={22} strokeWidth={2.75} />
      </div>
      <div>
        <p className="barra-titulo">Plumita</p>
        <p className="barra-subtitulo">{pestana?.titulo}</p>
      </div>
    </header>
  );
}

export function NavegacionInferior() {
  const ruta = usePathname();
  return (
    <nav className="nav-inferior" aria-label="Principal">
      {PESTANAS.map(({ ruta: destino, etiqueta, Icono }) => (
        <Link
          key={destino}
          href={destino}
          className="nav-item"
          aria-current={ruta.startsWith(destino) ? "page" : undefined}
        >
          <Icono size={24} strokeWidth={2.75} aria-hidden="true" />
          {etiqueta}
        </Link>
      ))}
    </nav>
  );
}
