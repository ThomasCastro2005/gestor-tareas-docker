const { Pool } = require("pg");
const { crearAplicacion } = require("./aplicacion");
const { crearRepositorio } = require("./repositorio");

const puerto = Number(process.env.PORT || 3000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = crearAplicacion(crearRepositorio(pool));

const servidor = app.listen(puerto, () => {
  console.log(`Gestor de tareas escuchando en el puerto ${puerto}`);
});

async function cerrar() {
  servidor.close();
  await pool.end();
}

process.on("SIGTERM", cerrar);
process.on("SIGINT", cerrar);
