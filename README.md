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

### SonarQube

#### Steps to run locally

1. In folder **docker/sonar** then run ```docker compose up -d --force-recreate``` to up docker container.

2. Run ```sh run-sonar-scanner.sh``` to start scanner code in root folder  .


#### Enter SonarQube locally

- Access in browser: localhost:9000
  - User: admin 
  - Password: pass (first time, after you need change it)


#### Solved to possible problems on Windows system

- Change on **run-sonar-scanner.sh** file line:
```-v ".:/usr/src" \```

- to line:
```-v "/$(pwd).:/usr/src" \```

### Grafana

- Go to folder **docker/sonar** then run ```docker compose up -d grafana --force-recreate``` to up docker container

### K6 (stress testing)

> ⚠️ Important!   
> First to run k6 you need Grafana container up 🚀

- Go to folder **docker/k6** then run ```sh run-load-test```


## Production environment

Using [RailWay](https://railway.app/) to deploy backend (Nodejs server and Mongo data base)

- Swagger docs: https://apc-backend-pdes-s1-2024-production.up.railway.app/api-docs

- Connection string: ```mongodb://mongo:IwotSfTyNRRhfguiYlHcJfqEVcvejNif@roundhouse.proxy.rlwy.net:33994```

Enjoy , thanks!
