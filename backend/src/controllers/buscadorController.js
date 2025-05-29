import fetch from 'node-fetch';  // Para las peticiones HTTP
import ontologiaService from "../services/ontologiaService.js";  // Servicio de ontología local

const endpointUrl = 'https://dbpedia.org/sparql';  // Mejor HTTPS

const buscar = async (req, res) => {
  const termino = req.query.q;  
  const idioma = req.query.lang || 'all'; // Puede ser 'es', 'en', 'fr' o 'all' (default)
  
  if (!termino) {
    return res.status(400).json({ error: "Falta el parámetro de búsqueda" });
  }

  try {
    console.log("📌 [LOCAL] Iniciando búsqueda en ontología local con término:", termino);
    // 1) Buscamos en la ontología local
    const resultadosOntologia = await ontologiaService.buscarEnOntologia(termino);
    console.log("✅ [LOCAL] Resultados ontología local:", resultadosOntologia);

    // 2) Preparamos la consulta SPARQL para DBpedia según el idioma solicitado
    let filtroIdioma;
    if (idioma === 'es') {
      filtroIdioma = 'lang(?label) = "es"';
    } else if (idioma === 'en') {
      filtroIdioma = 'lang(?label) = "en"';
    } else if (idioma === 'fr') {
      filtroIdioma = 'lang(?label) = "fr"';
    } else {
      // Por defecto, buscar en los tres idiomas
      filtroIdioma = '(lang(?label) = "es" || lang(?label) = "en" || lang(?label) = "fr")';
    }

    const sparqlQuery = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT DISTINCT ?s ?label ?lang WHERE {
        ?s rdfs:label ?label .
        BIND(lang(?label) AS ?lang)
        FILTER(
          ${filtroIdioma} &&
          CONTAINS(
            LCASE(STR(?label)),
            "${termino.toLowerCase()}"
          )
        )
      }
      LIMIT 60
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
      objeto:    b.lang?.value || "",    // Incluimos el idioma como objeto
      fuente:    "DBpedia"               // Marcamos la fuente
    }));

    // 6) Añadimos fuente a los resultados de la ontología local
    const resultadosOntologiaConFuente = resultadosOntologia.map(r => ({
      ...r,
      fuente: "Ontología Local"
    }));

    // 7) Devolvemos UN SOLO ARRAY concatenando local + DBpedia
    res.json([
      ...resultadosOntologiaConFuente,
      ...resultadosDBpedia
    ]);

  } catch (error) {
    console.error('Error en la búsqueda:', error);
    res.status(500).json({ error: "Error en la búsqueda", detalle: error.message });
  }
};

export default { buscar };

