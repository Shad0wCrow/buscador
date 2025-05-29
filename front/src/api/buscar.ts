import type { IdiomaSeleccionado } from "../types";

const URL = "http://localhost:3001/buscar";

export const buscar = async (termino: string, idioma: IdiomaSeleccionado = "all") => {
  const res = await fetch(`${URL}?q=${encodeURIComponent(termino)}&lang=${idioma}`);
  if (!res.ok) {
    throw new Error("Error al buscar en el backend");
  }
  return await res.json();
};
