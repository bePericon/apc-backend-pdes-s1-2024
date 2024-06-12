docker compose up -d influxdb
echo "--------------------------------------------------------------------------------------"
echo "Load testing with Grafana dashboard http://localhost:3001/d/k6/k6-load-testing-results"
echo "--------------------------------------------------------------------------------------"
docker compose run --rm k6 run /scripts/testing-api.js
