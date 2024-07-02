docker run \
    --network=host \
    --rm \
    -e SONAR_HOST_URL="http://127.0.0.1:9000" \
    -e SONAR_SCANNER_OPTS="-Dsonar.projectKey=apc-backend -Dproject.settings=./sonar-project.properties" \
    -v ".:/usr/src" \
    sonarsource/sonar-scanner-cli:10.0.3.1430_5.0.1