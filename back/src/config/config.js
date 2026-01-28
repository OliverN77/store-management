// db/config.js
const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Conectado a la base de datos');
    return pool;
  })
  .catch(err => console.log('Error de conexión a la base de datos', err));

module.exports = {
  sql, poolPromise
};
