const estado = document.querySelector("#estado");
const lista = document.querySelector("#lista");
const formulario = document.querySelector("#formulario");
const aviso = document.querySelector("#aviso");

function mostrarAviso(texto) {
  aviso.hidden = !texto;
  aviso.textContent = texto || "";
}

async function revisarConexion() {
  try {
    const respuesta = await fetch("/health");
    const cuerpo = await respuesta.json();
    const conectada = respuesta.ok && cuerpo.baseDeDatos === "conectada";
    estado.textContent = conectada ? "Base de datos conectada" : "Base de datos no disponible";
    estado.className = conectada ? "estado ok" : "estado error";
  } catch (_error) {
    estado.textContent = "No responde la aplicación";
    estado.className = "estado error";
  }
}

function pintar(tareas) {
  lista.replaceChildren();
  if (tareas.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "Todavía no hay tareas guardadas.";
    lista.append(vacio);
    return;
  }
  for (const tarea of tareas) {
    const item = document.createElement("li");
    if (tarea.completada) item.className = "hecha";
    const texto = document.createElement("div");
    const titulo = document.createElement("strong");
    titulo.className = "titulo";
    titulo.textContent = tarea.titulo;
    texto.append(titulo);
    if (tarea.descripcion) {
      const detalle = document.createElement("div");
      detalle.textContent = tarea.descripcion;
      texto.append(detalle);
    }
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    const completar = document.createElement("button");
    completar.type = "button";
    completar.textContent = tarea.completada ? "Reabrir" : "Completar";
    completar.addEventListener("click", () => cambiar(tarea));
    const borrar = document.createElement("button");
    borrar.type = "button";
    borrar.textContent = "Eliminar";
    borrar.addEventListener("click", () => eliminar(tarea.id));
    acciones.append(completar, borrar);
    item.append(texto, acciones);
    lista.append(item);
  }
}

async function cargar() {
  const respuesta = await fetch("/api/tareas");
  if (!respuesta.ok) throw new Error("No se pudo leer la lista.");
  pintar(await respuesta.json());
}

async function cambiar(tarea) {
  const respuesta = await fetch(`/api/tareas/${tarea.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completada: !tarea.completada }),
  });
  if (!respuesta.ok) throw new Error("No se pudo actualizar la tarea.");
  await cargar();
}

async function eliminar(id) {
  const respuesta = await fetch(`/api/tareas/${id}`, { method: "DELETE" });
  if (!respuesta.ok && respuesta.status !== 204) throw new Error("No se pudo eliminar la tarea.");
  await cargar();
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mostrarAviso("");
  const respuesta = await fetch("/api/tareas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titulo: formulario.titulo.value,
      descripcion: formulario.descripcion.value,
    }),
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    mostrarAviso(cuerpo.error || "No se pudo guardar.");
    return;
  }
  formulario.reset();
  await cargar();
});

revisarConexion();
cargar().catch(() => mostrarAviso("No se pudo cargar la lista."));
