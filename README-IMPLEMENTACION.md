# 🌍 SmartSearch - Implementación Técnica Detallada

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Implementación de Multilingualidad](#implementación-de-multilingualidad)
3. [Conexión a DBpedia](#conexión-a-dbpedia)
4. [Redireccionamiento de Links](#redireccionamiento-de-links)

---

## 📐 Arquitectura General

```
┌─────────────────┐    HTTP     ┌──────────────────┐    SPARQL    ┌─────────────┐
│   Frontend      │◄───────────►│     Backend      │◄────────────►│   DBpedia   │
│   (React +      │             │   (Node.js +     │              │   (SPARQL   │
│   TypeScript)   │             │   Express)       │              │   Endpoint) │
└─────────────────┘             └──────────────────┘              └─────────────┘
                                          │
                                          │ RDF/XML
                                          ▼
                                ┌──────────────────┐
                                │  Ontología Local │
                                │     (.rdf)       │
                                └──────────────────┘
```

---

## 🌐 Implementación de Multilingualidad

### 1. **Frontend - Selector de Idiomas**

**Archivo:** `front/src/paginas/PaginaInicio.tsx`

```typescript
// Tipo para idiomas soportados
type IdiomaSeleccionado = "all" | "es" | "en" | "fr";

// Estado del componente
const [idioma, setIdioma] = useState<IdiomaSeleccionado>("all");

// Selector en la UI
<select
  value={idioma}
  onChange={(e) => setIdioma(e.target.value as IdiomaSeleccionado)}
  className={styles.selector}
>
  <option value="all">Todos los idiomas</option>
  <option value="es">Solo Español</option>
  <option value="en">Solo Inglés</option>
  <option value="fr">Solo Francés</option>
</select>;
```

### 2. **Backend - Expansión de Términos Multilingües**

**Archivo:** `backend/src/services/ontologiaService.js`

```javascript
// Diccionario de términos equivalentes
const terminosEquivalentes = {
  // Español -> Inglés + Francés
  producto: ["product", "produit"],
  productos: ["products", "produits"],
  disponible: ["available", "disponible"],
  categoria: ["category", "catégorie"],
  precio: ["price", "prix"],
  pago: ["payment", "paiement"],

  // Inglés -> Español + Francés
  product: ["producto", "produit"],
  available: ["disponible", "disponibles", "disponible"],
  category: ["categoria", "categoría", "catégorie"],

  // Francés -> Español + Inglés
  produit: ["producto", "product"],
  disponible: ["disponible", "available"],
  catégorie: ["categoria", "categoría", "category"],
};

// Función de expansión automática
const expandirTerminoBusqueda = (termino) => {
  const terminoLower = termino.trim().toLowerCase();

  // Casos especiales multilingües
  if (
    terminoLower === "productos disponibles" ||
    terminoLower === "available products" ||
    terminoLower === "produits disponibles"
  ) {
    return [
      "productos disponibles",
      "available products",
      "produits disponibles",
    ];
  }

  // Expansión de palabra individual
  const equivalentes = terminosEquivalentes[terminoLower] || [];
  return [terminoLower, ...equivalentes];
};
```

### 3. **Consultas SPARQL Multilingües**

```sparql
-- Para ontología local (búsqueda expandida)
SELECT ?s ?p ?o WHERE {
  ?s ?p ?o .
  FILTER (
    (${propiedadesMostrar.map(p => `?p = <${p}>`).join(" || ")}) &&
    (${terminosExpandidos.map(term =>
      propiedadesMostrar.map(p =>
        `(?p = <${p}> && contains(lcase(str(?o)), lcase("${term}")))`
      ).join(" || ")
    ).join(" || ")}) &&
    isLiteral(?o)
  )
}

-- Para DBpedia (filtro por idioma específico)
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?s ?label WHERE {
  ?s rdfs:label ?label .
  FILTER (
    lang(?label) = "${idioma}" &&
    STRSTARTS(LCASE(STR(?label)), "${termino.toLowerCase()}")
  )
}
```

---

## 🔗 Conexión a DBpedia

### 1. **Configuración del Endpoint**

**Archivo:** `backend/src/controllers/buscadorController.js`

```javascript
const endpointUrl = "https://dbpedia.org/sparql";

// Función de búsqueda en DBpedia
const buscarEnDBpedia = async (termino, idioma) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    // Construcción de consulta SPARQL
    const sparqlQuery = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT ?s ?label WHERE {
        ?s rdfs:label ?label .
        FILTER (
          lang(?label) = "${idioma === "all" ? "es" : idioma}" &&
          STRSTARTS(LCASE(STR(?label)), "${termino.toLowerCase()}")
        )
      }
      LIMIT 10
    `;

    // Petición HTTP al endpoint SPARQL
    const url = `${endpointUrl}?query=${encodeURIComponent(
      sparqlQuery
    )}&format=json`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "SemanticSearchApp/1.0",
      },
      signal: controller.signal,
    });

    // Procesamiento de respuesta
    const dbData = await response.json();
    return (dbData.results?.bindings || []).map((b) => ({
      sujeto: b.s.value,
      predicado: b.label.value || "",
      objeto: idioma,
    }));
  } catch (error) {
    // Manejo de errores y timeouts
    if (error.name === "AbortError") {
      console.warn("⚠️ [DBpedia] Búsqueda cancelada por timeout");
    }
    return [];
  }
};
```

### 2. **Integración con Búsqueda Local**

```javascript
// Búsquedas en paralelo
const [resultadosOntologia, resultadosDBpedia] = await Promise.allSettled([
  ontologiaService.buscarEnOntologia(termino),
  buscarEnDBpedia(termino, idioma),
]);

// Combinación de resultados
const resultadosFinales = [
  ...resultadosOntologiaConFuente.slice(0, 10), // Max 10 de ontología local
  ...resultadosDBpediaConFuente.slice(0, 15), // Max 15 de DBpedia
];
```

### 3. **Protocolo SPARQL Detallado**

```
1. Cliente envía petición HTTP GET a: https://dbpedia.org/sparql
2. Parámetros de consulta:
   - query: [consulta SPARQL codificada en URL]
   - format: json
3. Headers obligatorios:
   - Accept: application/sparql-results+json
   - User-Agent: SemanticSearchApp/1.0
4. DBpedia responde con JSON en formato SPARQL Results
5. Parsing de resultados y transformación a formato unificado
```

---

## 🔗 Redireccionamiento de Links

### 1. **Detección de URLs Válidas**

**Archivo:** `front/src/paginas/PaginaInicio.tsx`

```typescript
// Función para validar URLs
const esUrlValida = (url: string): boolean => {
  try {
    new URL(url); // Si no lanza excepción, es URL válida
    return true;
  } catch {
    return false; // No es una URL válida
  }
};
```

### 2. **Implementación del Click Handler**

```typescript
// Manejador específico para clicks en URLs
const manejarClickUrl = useCallback(
  (e: React.MouseEvent, url: string, titulo: string) => {
    e.preventDefault(); // Prevenir comportamiento por defecto
    e.stopPropagation(); // Evitar propagación del evento

    if (esUrlValida(url)) {
      // CASO 1: URL válida -> Abrir en nueva pestaña
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // CASO 2: Información local -> Copiar al portapapeles
      navigator.clipboard
        .writeText(`${titulo}: ${url}`)
        .then(() => {
          alert("Información copiada al portapapeles");
        })
        .catch(() => {
          alert(`Información: ${titulo}\n${url}`);
        });
    }
  },
  []
);
```

### 3. **Renderizado Clickeable**

```typescript
// Solo la URL es clickeable, no todo el resultado
<div key={i} className={styles.itemResultado}>
  <div
    className={styles.url}
    onClick={(e) => manejarClickUrl(e, r.url, r.titulo)}
    style={{ cursor: "pointer" }}
  >
    {r.url} {/* Solo este elemento es clickeable */}
  </div>
  <div className={styles.titulo}>
    {etiquetasPredicado[r.titulo] || r.titulo}
  </div>
  <div className={styles.descripcion}>{r.descripcion}</div>
  {/* Resto del contenido NO es clickeable */}
</div>
```

### 4. **Estilos CSS para Indicación Visual**

**Archivo:** `front/src/styles/buscador.module.css`

```css
.url {
  font-size: 0.9rem;
  color: #006621; /* Verde como enlaces tradicionales */
  margin-bottom: 0.25rem;
  text-decoration: underline; /* Subrayado para indicar link */
}

.url:hover {
  color: #004d1a; /* Color más oscuro en hover */
}

/* El resto del resultado NO tiene cursor pointer */
.itemResultado {
  /* ... otros estilos ... */
  /* SIN cursor: pointer */
}
```

---

## 🔄 Flujo de Datos Completo

### 1. **Flujo de Búsqueda Multilingüe**

```
Usuario escribe "producto" en español
         ↓
Frontend detecta idioma seleccionado
         ↓
Backend recibe: { q: "producto", lang: "es" }
         ↓
Ontología Local:
- Expande: ["producto", "product", "produit"]
- Busca en todas las propiedades con términos expandidos
         ↓
DBpedia (si está activo):
- Consulta SPARQL filtrada por idioma español
- FILTER: lang(?label) = "es"
         ↓
Combinación de resultados:
- Ontología: Datos específicos del dominio
- DBpedia: Información general enciclopédica
         ↓
Frontend recibe resultados unificados
```

### 2. **Flujo de Redireccionamiento**

```
Usuario hace click en URL verde
         ↓
JavaScript captura evento onClick
         ↓
esUrlValida() verifica formato de URL
         ↓
┌─────────────────┬─────────────────┐
│   URL VÁLIDA    │  DATOS LOCALES  │
│                 │                 │
│ Ejemplo:        │ Ejemplo:        │
│ http://dbpedia  │ http://ejemplo  │
│ .org/resource   │ .org/ontologia  │
│ /Computer       │ #Electronico2   │
│        ↓        │        ↓        │
│ window.open()   │ clipboard.write │
│ Nueva pestaña   │ Portapapeles    │
└─────────────────┴─────────────────┘
```
