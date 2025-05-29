export interface RawSearchResult {
  sujeto:    string;
  predicado: string;
  objeto:    string;
  fuente?:   string;  // "DBpedia" o "Ontología Local"
}

export interface Resultado {
  url:         string;
  titulo:      string;
  descripcion: string;
  idioma?:     string;  // "es", "en", "fr" u otro código de idioma
  fuente?:     string;  // Origen del resultado
}

export type IdiomaSeleccionado = "es" | "en" | "fr" | "all";