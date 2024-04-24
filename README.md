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

- Change name file `.env.example` to `.env`

- Run `npm install` to get the dependencies installed.

- Run `docker compose -p apc-backend up -d --force-recreate` to get images and create containers.

### Let's go!

- Backend: 
    - Server: `localhost:8080/api`
    - API documentation: `http://localhost:8080/api-docs/`
- Mongo client web: `localhost:8081` _(user: admin, password: pass)_
