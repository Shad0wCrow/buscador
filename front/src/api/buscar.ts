const URL = "http://localhost:3001/buscar";

export const buscar = async (termino: string) => {
  const res = await fetch(`${URL}?q=${encodeURIComponent(termino)}`);
  if (!res.ok) {
    throw new Error("Error al buscar en el backend");
  }
  return await res.json();
};
