import hudson.security.FullControlOnceLoggedInAuthorizationStrategy
import hudson.security.HudsonPrivateSecurityRealm
import jenkins.model.Jenkins

def jenkins = Jenkins.instance
if (jenkins.securityRealm instanceof HudsonPrivateSecurityRealm) {
    println "La seguridad local ya estaba configurada."
    return
}

def usuario = System.getenv("JENKINS_ADMIN_ID")
def clave = System.getenv("JENKINS_ADMIN_PASSWORD")
if (!usuario || !clave) {
    throw new IllegalStateException("Faltan JENKINS_ADMIN_ID y JENKINS_ADMIN_PASSWORD.")
}

def realm = new HudsonPrivateSecurityRealm(false)
realm.createAccount(usuario, clave)
jenkins.securityRealm = realm

def estrategia = new FullControlOnceLoggedInAuthorizationStrategy()
estrategia.setAllowAnonymousRead(false)
jenkins.authorizationStrategy = estrategia
jenkins.save()
println "Quedó creado el usuario local ${usuario}."
