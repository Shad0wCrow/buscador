// src/services/ontologiaService.js

import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const rdfParser = require("rdf-parse").default; // default export de rdf-parse
import motor from "../config/sparql.js";

let datosTienda = [];

const cargarOntologia = async () => {
  const archivo = fs.createReadStream(
    "./src/ontologia/comercioElectronico.owx"
  );

  const quadStream = rdfParser(archivo, {
    contentType: "application/rdf+xml", // cambia esto si tu archivo no es RDF/XML
  });

  for await (const quad of quadStream) {
    datosTienda.push(quad);
  }

  motor.store.addQuads(datosTienda);
};

export default cargarOntologia;
