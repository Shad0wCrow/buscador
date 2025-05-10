import express from "express";
import cors from "cors";
import buscadorRoutes from "./routes/buscadorRoutes.js";
import ontologiaService from "./services/ontologiaService.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/buscar", buscadorRoutes);

// Cargar la ontología antes de iniciar el servidor
ontologiaService.cargarOntologia().then(() => {
  const puerto = 3001;
  app.listen(puerto, () => {
    console.log(`Servidor en http://localhost:${puerto}`);
  });
});
