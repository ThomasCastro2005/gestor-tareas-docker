# Gestor de tareas

Aplicación de la asignatura Integración continua (Politécnico Grancolombiano). La semana 3 dejó dos contenedores comunicados: `app` (Node.js) y `db` (PostgreSQL). La semana 5 agrega Jenkins como gestor de operaciones.

La clave de PostgreSQL no va en el repositorio. Se copia `.env.ejemplo` a `.env` y se cambia `POSTGRES_PASSWORD` y `DATABASE_URL` con el mismo valor.

```bash
docker compose up -d --build
```

La interfaz queda en http://localhost:3000. PostgreSQL no publica puerto hacia el equipo: solo lo alcanza el contenedor `app`, por el nombre `db`.

Jenkins se levanta aparte, en el puerto 8888, con su propio motor Docker:

```bash
cd operaciones/jenkins
docker compose --env-file .env up -d --build
```
