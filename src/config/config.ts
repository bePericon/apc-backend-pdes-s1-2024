import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT,
  db_connection_string: process.env.DB_CONNECTION_STRING,
  secret_token: process.env.SECRET_TOKEN,
  base_path: process.env.BASE_PATH,
  load_data: process.env.LOAD_DATA === "true"
};

export default config;
