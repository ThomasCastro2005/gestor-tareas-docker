pipeline {
    agent any
    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 25, unit: 'MINUTES')
    }
    triggers {
        githubPush()
    }
    environment {
        COMPOSE_PROJECT_NAME = "ensayo${BUILD_NUMBER}"
        IMAGEN = "gestor-tareas-app:ensayo-${BUILD_NUMBER}"
    }
    stages {
        stage('Descargar cambios') {
            steps {
                checkout scm
            }
        }
        stage('Rechazar secretos versionados') {
            steps {
                sh '''
                    set -eu
                    if git ls-files | grep -E '(^|/)\\.env$'; then
                        echo "El archivo .env no puede estar en Git."
                        exit 1
                    fi
                    test -f .env.ejemplo
                    test -f docker-compose.yml
                '''
            }
        }
        stage('Pruebas unitarias') {
            steps {
                sh 'docker build --target pruebas .'
            }
        }
        stage('Construir imagen') {
            steps {
                sh 'docker build -t "$IMAGEN" .'
            }
        }
        stage('Ensayo de comunicacion') {
            steps {
                sh '''
                    set -eu
                    CLAVE=$(od -An -tx1 -N16 /dev/urandom | tr -d '[:space:]')
                    umask 077
                    cat > .env.ensayo <<EOF
POSTGRES_USER=pendientes
POSTGRES_PASSWORD=$CLAVE
POSTGRES_DB=pendientes
DATABASE_URL=postgres://pendientes:$CLAVE@db:5432/pendientes
PORT=3000
EOF
                    docker compose --env-file .env.ensayo -p "$COMPOSE_PROJECT_NAME" up -d --no-build --wait
                    RED=$(docker network ls --format '{{.Name}}' | grep "^${COMPOSE_PROJECT_NAME}_" | head -n 1)
                    test -n "$RED"
                    docker network inspect "$RED" | tee inspeccion-red.txt
                    docker compose --env-file .env.ensayo -p "$COMPOSE_PROJECT_NAME" exec -T app \
                        node -e "fetch('http://127.0.0.1:3000/health').then(async (r)=>{const t=await r.text(); console.log(t); if(!r.ok || !t.includes('conectada')) process.exit(1);}).catch((e)=>{console.error(e); process.exit(1);})"
                    docker compose --env-file .env.ensayo -p "$COMPOSE_PROJECT_NAME" exec -T app \
                        node -e "fetch('http://127.0.0.1:3000/api/tareas',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({titulo:'Ensayo del pipeline',descripcion:'La aplicacion escribio en PostgreSQL'})}).then(async (r)=>{const t=await r.text(); console.log(r.status, t); if(r.status!==201) process.exit(1);}).catch((e)=>{console.error(e); process.exit(1);})"
                    docker compose --env-file .env.ensayo -p "$COMPOSE_PROJECT_NAME" exec -T app \
                        node -e "fetch('http://127.0.0.1:3000/api/tareas').then(async (r)=>{const t=await r.text(); console.log(t); if(!t.includes('Ensayo del pipeline')) process.exit(1);}).catch((e)=>{console.error(e); process.exit(1);})"
                '''
            }
        }
    }
    post {
        always {
            sh '''
                if [ -f .env.ensayo ]; then
                    docker compose --env-file .env.ensayo -p "$COMPOSE_PROJECT_NAME" down -v || true
                    rm -f .env.ensayo
                fi
            '''
            archiveArtifacts artifacts: 'inspeccion-red.txt', allowEmptyArchive: true
        }
    }
}
