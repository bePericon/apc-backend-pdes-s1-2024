import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT,
  db_connection_string: process.env.DB_CONNECTION_STRING
};

export default config;
