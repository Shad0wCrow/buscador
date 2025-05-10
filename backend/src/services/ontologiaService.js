// src/services/ontologiaService.js

import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const rdfParser = require("rdf-parse").default;
import motor from "../config/sparql.js";
import { Store } from "n3";

let datosTienda = [];
let store = new Store();

const cargarOntologia = async () => {
  const archivo = fs.createReadStream(
    "./src/ontologia/comercioElectronico.rdf"
  );

  const quadStream = rdfParser.parse(archivo, {
    contentType: "application/rdf+xml", // cambia esto si tu archivo no es RDF/XML
  });

  for await (const quad of quadStream) {
    datosTienda.push(quad);
    store.addQuad(quad);
  }
};

// Lista de predicados relevantes (puedes agregar más si lo deseas)
const predicadosRelevantes = [
  "http://www.ejemplo.org/ontologia#nombre",
  "http://www.ejemplo.org/ontologia#descripcion",
  "http://www.ejemplo.org/ontologia#categoria",
  "http://www.ejemplo.org/ontologia#precio",
  "http://www.ejemplo.org/ontologia#formato",
  "http://www.ejemplo.org/ontologia#tipoPago",
  "http://www.ejemplo.org/ontologia#nombreUsuarios",
  "http://www.ejemplo.org/ontologia#comentario",
  "http://www.ejemplo.org/ontologia#estadoPedido",
  "http://www.ejemplo.org/ontologia#estadoPago",
  "http://www.ejemplo.org/ontologia#email"
];

// Propiedades relevantes para mostrar agrupadas por instancia
const propiedadesMostrar = [
  "http://www.ejemplo.org/ontologia#nombre",
  "http://www.ejemplo.org/ontologia#descripcion",
  "http://www.ejemplo.org/ontologia#categoria",
  "http://www.ejemplo.org/ontologia#precio",
  "http://www.ejemplo.org/ontologia#formato",
  "http://www.ejemplo.org/ontologia#tipoPago",
  "http://www.ejemplo.org/ontologia#nombreUsuarios",
  "http://www.ejemplo.org/ontologia#comentario",
  "http://www.ejemplo.org/ontologia#estadoPedido",
  "http://www.ejemplo.org/ontologia#estadoPago",
  "http://www.ejemplo.org/ontologia#email",
  "http://www.ejemplo.org/ontologia#disponibilidad"
];

// Búsqueda mejorada: agrupa por instancia y permite búsquedas por campo o valor
const buscarEnOntologia = async (termino) => {
  const term = termino.trim().toLowerCase();
  let filtroExtra = "";

  // Búsqueda especial para "productos disponibles"
  if (term === "productos disponibles" || term === "disponibles") {
    filtroExtra = `?p = <http://www.ejemplo.org/ontologia#disponibilidad> && lcase(str(?o)) = "true"`;
  } else if (term === "productos") {
    filtroExtra = `?p = <http://www.ejemplo.org/ontologia#categoria> || ?p = <http://www.ejemplo.org/ontologia#nombre>`;
  } else {
    // Búsqueda general: el término aparece en cualquier propiedad relevante
    filtroExtra = propiedadesMostrar.map(p => `(?p = <${p}> && contains(lcase(str(?o)), lcase("${term}")))`).join(" || ");
  }

  const consulta = `
    SELECT ?s ?p ?o WHERE {
      ?s ?p ?o .
      FILTER (
        (${propiedadesMostrar.map(p => `?p = <${p}>`).join(" || ")}) &&
        (${filtroExtra}) &&
        isLiteral(?o)
      )
    } LIMIT 100
  `;

  const resultados = {};
  const bindingsStream = await motor.queryBindings(consulta, {
    sources: [store],
  });
  for await (const binding of bindingsStream) {
    const sujeto = binding.get("s")?.value || "";
    const predicado = binding.get("p")?.value || "";
    const objeto = binding.get("o")?.value || "";
    if (!resultados[sujeto]) resultados[sujeto] = { sujeto, propiedades: {} };
    resultados[sujeto].propiedades[predicado] = objeto;
  }
  // Devuelve un array de instancias con sus propiedades
  return Object.values(resultados);
};

export default { cargarOntologia, buscarEnOntologia };
