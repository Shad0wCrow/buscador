import ontologiaService from "../services/ontologiaService.js";

const buscar = async (req, res) => {
  const termino = req.query.q;
  if (!termino)
    return res.status(400).json({ error: "Falta el parámetro de búsqueda" });

  try {
    const resultados = await ontologiaService.buscarEnOntologia(termino);
    res.json(resultados);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en la búsqueda", detalle: error.message });
  }
};

export default { buscar };
