import Image from "next/image";

export type NombreIcono = "polluelo" | "gallina" | "gallo" | "pato" | "maiz" | "concentrado" | "telegram";

export function IconoGrafico({ nombre, tamano }: { nombre: NombreIcono; tamano: number }) {
  return <Image src={`/icons/${nombre}.svg`} alt="" width={tamano} height={tamano} />;
}
