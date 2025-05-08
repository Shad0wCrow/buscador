import express from "express";
import cors from "cors";
import buscadorRoutes from "./routes/buscadorRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/buscar", buscadorRoutes);

const puerto = 3001;
app.listen(puerto, () => {
  console.log(`Servidor en http://localhost:${puerto}`);
});
