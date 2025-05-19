import fetch from 'node-fetch';  // Para las peticiones HTTP
import ontologiaService from "../services/ontologiaService.js";  // Servicio de ontología local

const endpointUrl = 'https://dbpedia.org/sparql';  // Mejor HTTPS

const buscar = async (req, res) => {
  const termino = req.query.q;  
  if (!termino) {
    return res.status(400).json({ error: "Falta el parámetro de búsqueda" });
  }

  try {
    console.log("📌 [LOCAL] Iniciando búsqueda en ontología local con término:", termino);
    // 1) Buscamos en la ontología local
    const resultadosOntologia = await ontologiaService.buscarEnOntologia(termino);
   console.log("✅ [LOCAL] Resultados ontología local:", resultadosOntologia);

    // 2) Preparamos la consulta SPARQL para DBpedia
    const sparqlQuery = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT DISTINCT ?s ?label WHERE {
        ?s rdfs:label ?label .
        FILTER(
          lang(?label) = "en" &&
          CONTAINS(
            LCASE(STR(?label)),
            "${termino.toLowerCase()}"
          )
        )
      }
      LIMIT 20
    `;

    // 3) Ejecutamos la consulta vía GET pidiendo JSON
    const url = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}&format=json`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/sparql-results+json' }
    });

    if (!response.ok) {
      // Si DBpedia devuelve un error distinto de 200
      throw new Error(`DBpedia status ${response.status}`);
    }

    // 4) Parseamos los resultados JSON
    const dbData = await response.json();

    // 5) Mapeamos a tu propia forma { sujeto, predicado, objeto }
    const resultadosDBpedia = (dbData.results?.bindings || []).map(b => ({
      sujeto:    b.s.value,
      predicado: b.label.value,
      objeto:    ""            // aquí podrías añadir otro campo si lo necesitas
    }));

    // 6) Devolvemos UN SOLO ARRAY concatenando local + DBpedia
    res.json([
      ...resultadosOntologia,
      ...resultadosDBpedia
    ]);

  } catch (error) {
    console.error('Error en la búsqueda:', error);
    res.status(500).json({ error: "Error en la búsqueda", detalle: error.message });
  }
};

export default { buscar };

