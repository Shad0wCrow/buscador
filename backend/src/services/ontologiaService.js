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

// Diccionario de términos equivalentes español-inglés-francés
const terminosEquivalentes = {
  // Español -> Inglés + Francés
  "producto": ["product", "produit"],
  "productos": ["products", "produits"],
  "disponible": ["available", "disponible"],
  "disponibles": ["available", "disponibles"],
  "categoria": ["category", "catégorie"],
  "precio": ["price", "prix"],
  "pago": ["payment", "paiement"],
  "usuario": ["user", "utilisateur"],
  "usuarios": ["users", "utilisateurs"],
  "pedido": ["order", "commande"],
  "pedidos": ["orders", "commandes"],
  "comentario": ["comment", "review", "commentaire"],
  "compra": ["purchase", "achat"],
  "email": ["email", "courriel"],
  "nombre": ["name", "nom"],
  "descripcion": ["description", "description"],
  
  // Inglés -> Español + Francés
  "product": ["producto", "produit"],
  "products": ["productos", "produits"],
  "available": ["disponible", "disponibles", "disponible"],
  "category": ["categoria", "categoría", "catégorie"],
  "price": ["precio", "prix"],
  "payment": ["pago", "paiement"],
  "user": ["usuario", "utilisateur"],
  "users": ["usuarios", "utilisateurs"],
  "order": ["pedido", "orden", "commande"],
  "orders": ["pedidos", "órdenes", "commandes"],
  "comment": ["comentario", "commentaire"],
  "review": ["comentario", "reseña", "avis"],
  "purchase": ["compra", "achat"],
  "email": ["email", "courriel"],
  "name": ["nombre", "nom"],
  "description": ["descripcion", "description"],
  
  // Francés -> Español + Inglés
  "produit": ["producto", "product"],
  "produits": ["productos", "products"],
  "disponible": ["disponible", "available"], // mismo en francés y español
  "disponibles": ["disponibles", "available"],
  "catégorie": ["categoria", "categoría", "category"],
  "prix": ["precio", "price"],
  "paiement": ["pago", "payment"],
  "utilisateur": ["usuario", "user"],
  "utilisateurs": ["usuarios", "users"],
  "commande": ["pedido", "orden", "order"],
  "commandes": ["pedidos", "órdenes", "orders"],
  "commentaire": ["comentario", "comment"],
  "avis": ["comentario", "reseña", "review"],
  "achat": ["compra", "purchase"],
  "courriel": ["email", "email"],
  "nom": ["nombre", "name"],
  "description": ["descripcion", "description"]
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

// Función para expandir términos de búsqueda con sus equivalentes en otros idiomas
const expandirTerminoBusqueda = (termino) => {
  const terminoLower = termino.trim().toLowerCase();
  
  // Casos especiales trilingües
  if (terminoLower === "productos disponibles" || terminoLower === "available products" || 
      terminoLower === "produits disponibles") {
    return ["productos disponibles", "available products", "produits disponibles", 
            "productos", "disponibles", "products", "available", "produits", "disponible"];
  }
  
  // Dividir el término en palabras para búsquedas de varias palabras
  const palabras = terminoLower.split(/\s+/);
  
  if (palabras.length === 1) {
    // Si es una sola palabra, buscar equivalentes
    const equivalentes = terminosEquivalentes[terminoLower] || [];
    return [terminoLower, ...equivalentes];
  } else {
    // Para múltiples palabras, mantenemos la frase original
    return [terminoLower];
  }
};

// Búsqueda mejorada: agrupa por instancia y permite búsquedas por campo o valor
const buscarEnOntologia = async (termino) => {
  const terminosExpandidos = expandirTerminoBusqueda(termino);
  console.log("🔍 Términos expandidos para búsqueda:", terminosExpandidos);
  
  let filtroExtra = "";

  // Casos especiales trilingües
  if (termino.toLowerCase() === "productos disponibles" || termino.toLowerCase() === "available products" || 
      termino.toLowerCase() === "produits disponibles" ||
      termino.toLowerCase() === "disponibles" || termino.toLowerCase() === "available" ||
      termino.toLowerCase() === "disponible") {
    filtroExtra = `?p = <http://www.ejemplo.org/ontologia#disponibilidad> && lcase(str(?o)) = "true"`;
  } else if (termino.toLowerCase() === "productos" || termino.toLowerCase() === "products" ||
             termino.toLowerCase() === "produits") {
    filtroExtra = `?p = <http://www.ejemplo.org/ontologia#categoria> || ?p = <http://www.ejemplo.org/ontologia#nombre>`;
  } else {
    // Búsqueda general: el término o sus equivalentes aparecen en cualquier propiedad relevante
    const condicionesBusqueda = terminosExpandidos.map(term => 
      propiedadesMostrar.map(p => `(?p = <${p}> && contains(lcase(str(?o)), lcase("${term}")))`).join(" || ")
    ).join(" || ");
    
    filtroExtra = condicionesBusqueda;
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
