import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "../styles/buscador.module.css";
import { buscar } from "../api/buscar";
import type { RawSearchResult, Resultado } from "../types";


// Diccionario para mostrar etiquetas legibles en vez de URLs de predicados
const etiquetasPredicado: Record<string, string> = {
  "http://www.ejemplo.org/ontologia#nombre": "Nombre",
  "http://www.ejemplo.org/ontologia#descripcion": "Descripción",
  "http://www.ejemplo.org/ontologia#categoria": "Categoría",
  "http://www.ejemplo.org/ontologia#precio": "Precio",
  "http://www.ejemplo.org/ontologia#formato": "Formato",
  "http://www.ejemplo.org/ontologia#tipoPago": "Tipo de Pago",
  "http://www.ejemplo.org/ontologia#nombreUsuarios": "Usuario",
  "http://www.ejemplo.org/ontologia#comentario": "Comentario",
  "http://www.ejemplo.org/ontologia#estadoPedido": "Estado del Pedido",
  "http://www.ejemplo.org/ontologia#estadoPago": "Estado del Pago",
  "http://www.ejemplo.org/ontologia#email": "Email"
};

function PaginaInicio() {
  const [busqueda, setBusqueda] = useState("");
  // mantén el tipo any[] si no quieres definir ahora una interfaz
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [, setParametros] = useSearchParams(); // ya no hay '_' sin usar

  const manejarEnvio = async (e: React.FormEvent) => {
     e.preventDefault();
    if (!busqueda.trim()) return;

    try {
      //const respuesta = await buscar(busqueda);
      // Le decimos a TS que respuesta.ontologia es un array de RawSearchResult
      const crudos = (await buscar(busqueda)) as RawSearchResult[];
      
      // Lo transformamos a tu tipo limpio
      const transformados: Resultado[] = crudos.map(r => ({
        url:         r.sujeto,
        titulo:      r.predicado,
        descripcion: r.objeto,
      }));

      setResultados(transformados);
      setMostrarResultados(true);
      setParametros({ q: busqueda });
    } catch (err: unknown) {
      console.error("Error en la búsqueda:", err);
    }
  };


  return (
    <div className={ mostrarResultados ? styles.contenedorResultados : styles.contenedorInicio }>
      <div className={styles.superior}>
        <h1 className={styles.logo}>SmartSearch</h1>
        <form onSubmit={manejarEnvio} className={styles.formulario}>
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
      </div>
      {mostrarResultados && (
        <div className={styles.listaResultados}>
          {resultados.map((r, i) => (
            <div key={i} className={styles.itemResultado}>
              <div className={styles.url}>{r.url}</div>
              <div className={styles.titulo}>
                {etiquetasPredicado[r.titulo] || r.titulo}
              </div>
              <div className={styles.descripcion}>{r.descripcion}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PaginaInicio;
