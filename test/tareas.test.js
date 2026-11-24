const test = require("node:test");
const assert = require("node:assert/strict");
const { crearAplicacion } = require("../src/aplicacion");

function repositorioEnMemoria() {
  const tareas = [];
  let siguiente = 1;
  return {
    async verificar() {},
    async listar() {
      return [...tareas].reverse();
    },
    async crear({ titulo, descripcion }) {
      const tarea = { id: siguiente++, titulo, descripcion, completada: false, creadaEn: "2026-11-23T00:00:00.000Z" };
      tareas.push(tarea);
      return tarea;
    },
    async actualizar(id, { completada }) {
      const tarea = tareas.find((item) => item.id === id);
      if (!tarea) return null;
      tarea.completada = completada;
      return tarea;
    },
    async eliminar(id) {
      const indice = tareas.findIndex((item) => item.id === id);
      if (indice < 0) return false;
      tareas.splice(indice, 1);
      return true;
    },
  };
}

async function conServidor(prueba) {
  const app = crearAplicacion(repositorioEnMemoria());
  const servidor = app.listen(0);
  const { port } = servidor.address();
  try {
    await prueba(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolver) => servidor.close(resolver));
  }
}

test("crea, lista, completa y elimina una tarea", async () => {
  await conServidor(async (base) => {
    const creada = await fetch(`${base}/api/tareas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: "Revisar el pipeline", descripcion: "Semana 5" }),
    });
    assert.equal(creada.status, 201);
    const tarea = await creada.json();
    assert.equal(tarea.titulo, "Revisar el pipeline");

    const listado = await fetch(`${base}/api/tareas`);
    assert.equal((await listado.json()).length, 1);

    const actualizada = await fetch(`${base}/api/tareas/${tarea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completada: true }),
    });
    assert.equal((await actualizada.json()).completada, true);

    const borrada = await fetch(`${base}/api/tareas/${tarea.id}`, { method: "DELETE" });
    assert.equal(borrada.status, 204);
    assert.equal((await (await fetch(`${base}/api/tareas`)).json()).length, 0);
  });
});

test("rechaza una tarea sin título", async () => {
  await conServidor(async (base) => {
    const respuesta = await fetch(`${base}/api/tareas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: "   ", descripcion: "" }),
    });
    assert.equal(respuesta.status, 400);
  });
});

test("el healthcheck informa que la base responde", async () => {
  await conServidor(async (base) => {
    const respuesta = await fetch(`${base}/health`);
    assert.deepEqual(await respuesta.json(), { estado: "ok", baseDeDatos: "conectada" });
  });
});

test("si la base falla, el healthcheck queda degradado", async () => {
  const app = crearAplicacion({
    async verificar() {
      throw new Error("caída");
    },
  });
  const servidor = app.listen(0);
  const { port } = servidor.address();
  try {
    const respuesta = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(respuesta.status, 503);
  } finally {
    await new Promise((resolver) => servidor.close(resolver));
  }
});
