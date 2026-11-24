const express = require("express");
const helmet = require("helmet");
const path = require("path");

function leerTarea(cuerpo) {
  const titulo = String(cuerpo?.titulo ?? "").trim();
  const descripcion = String(cuerpo?.descripcion ?? "").trim();
  if (!titulo || titulo.length > 120) {
    return { error: "El título es obligatorio y admite hasta 120 caracteres." };
  }
  if (descripcion.length > 500) {
    return { error: "La descripción admite hasta 500 caracteres." };
  }
  return { titulo, descripcion };
}

function crearAplicacion(repositorio) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "32kb" }));
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("/health", async (_req, res) => {
    try {
      await repositorio.verificar();
      res.json({ estado: "ok", baseDeDatos: "conectada" });
    } catch (_error) {
      res.status(503).json({ estado: "degradado", baseDeDatos: "no disponible" });
    }
  });

  app.get("/api/tareas", async (_req, res, next) => {
    try {
      res.json(await repositorio.listar());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tareas", async (req, res, next) => {
    const datos = leerTarea(req.body);
    if (datos.error) {
      res.status(400).json({ error: datos.error });
      return;
    }
    try {
      res.status(201).json(await repositorio.crear(datos));
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tareas/:id", async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1 || typeof req.body?.completada !== "boolean") {
      res.status(400).json({ error: "Indica el identificador y si la tarea quedó completada." });
      return;
    }
    try {
      const actualizada = await repositorio.actualizar(id, { completada: req.body.completada });
      if (!actualizada) {
        res.status(404).json({ error: "No existe esa tarea." });
        return;
      }
      res.json(actualizada);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/tareas/:id", async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "El identificador no es válido." });
      return;
    }
    try {
      const borrada = await repositorio.eliminar(id);
      if (!borrada) {
        res.status(404).json({ error: "No existe esa tarea." });
        return;
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error(error.message);
    res.status(500).json({ error: "No se pudo completar la operación." });
  });

  return app;
}

module.exports = { crearAplicacion };
