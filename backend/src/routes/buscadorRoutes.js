import express from "express";
import buscadorController from "../controllers/buscadorController.js";

const router = express.Router();
router.get("/", buscadorController.buscar);
export default router;
