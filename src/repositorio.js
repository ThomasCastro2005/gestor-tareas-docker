function fila(registro) {
  return {
    id: registro.id,
    titulo: registro.titulo,
    descripcion: registro.descripcion,
    completada: registro.completada,
    creadaEn: registro.creada_en,
  };
}

function crearRepositorio(pool) {
  return {
    async verificar() {
      const resultado = await pool.query("SELECT 1 AS ok");
      if (resultado.rows[0].ok !== 1) {
        throw new Error("La base de datos no respondió.");
      }
    },

    async listar() {
      const resultado = await pool.query(
        "SELECT id, titulo, descripcion, completada, creada_en FROM tareas ORDER BY id DESC"
      );
      return resultado.rows.map(fila);
    },

    async crear({ titulo, descripcion }) {
      const resultado = await pool.query(
        "INSERT INTO tareas (titulo, descripcion) VALUES ($1, $2) RETURNING id, titulo, descripcion, completada, creada_en",
        [titulo, descripcion]
      );
      return fila(resultado.rows[0]);
    },

    async actualizar(id, { completada }) {
      const resultado = await pool.query(
        "UPDATE tareas SET completada = $2 WHERE id = $1 RETURNING id, titulo, descripcion, completada, creada_en",
        [id, completada]
      );
      return resultado.rows[0] ? fila(resultado.rows[0]) : null;
    },

    async eliminar(id) {
      const resultado = await pool.query("DELETE FROM tareas WHERE id = $1", [id]);
      return resultado.rowCount > 0;
    },
  };
}

module.exports = { crearRepositorio };
