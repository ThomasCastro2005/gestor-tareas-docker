FROM jenkins/jenkins:lts-jdk21

USER root
COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker
RUN docker --version && chown root:jenkins /usr/local/bin/docker && chmod 755 /usr/local/bin/docker
USER jenkins

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
COPY init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/
