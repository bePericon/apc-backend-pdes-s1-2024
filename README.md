# apc-backend-pdes-s1-2024

App backend for 'Practicas de desarrollo de software' signature S12024

## Stack

Using latest versions for all technologies (March 2024)

- Nodejs 18.17.0
- Typescript 5.4
- Express 4.19
- Jest 29.7
- OvernightJS 1.7
- MongoDB (Mongoose 8.2)
- Swagger 2 (OpenAPI 3)

## Develop environment

- Change name file **.env.example** to **.env**

- Run `npm install` to get the dependencies installed.

- Run `docker compose -p apc-backend up -d --force-recreate` to get images and create containers.

### Let's go!

- Backend:
  - Server: http://localhost:8080/api
  - API documentation: http://localhost:8080/api-docs/
- Mongo client web: http://localhost:8081 
  - User: admin
  - Password: pass

### Sonarqube

#### Steps to run locally

1. In folder **docker/sonar** then run ```docker compose up -d sonarqube --force-recreate ``` to up docker container.

2. You can to access on: http://localhost:9000
  - User: admin 
  - Password: pass 

The first time you should to change password and write it on sonar-project.properties before run scanner.

3. Create a new project, take the token and write it on sonar-project.properties before run scanner

4. Run ```sh run-sonar-scanner.sh``` to start scanner in root folder.


#### Solved to possible problems on Windows system

- Change on **run-sonar-scanner.sh** file line:
```-v ".:/usr/src" \```

- to line:
```-v "/$(pwd).:/usr/src" \```

### Grafana

- Go to folder **docker/grafana** then run ```docker compose up -d grafana --force-recreate``` to up docker container

- You can to access on: http://localhost:3001

### K6 (stress testing)

> ⚠️ Important!   
> First to run k6 you need Grafana container up 🚀

- Go to folder **docker/k6** then run ```sh run-load-test```

### Prometheus

- Go to folder **docker/prometheus** then run ```docker compose up -d prometheus --force-recreate``` to up docker container

- You can to access on: http://localhost:9090


## Production environment

Using [RailWay](https://railway.app/) to deploy backend (Nodejs server and Mongo data base)

- Swagger docs: https://apc-backend-pdes-s1-2024-production.up.railway.app/api-docs

- Connection string: ```mongodb://mongo:nfiDRmDvAJOtUBDGvgPaimaXGsnDUuJJ@viaduct.proxy.rlwy.net:12140```

Enjoy , thanks!
