const { Pool } = require('pg');

const db = new Pool({
  host: 'localhost',   // o la IP/hostname de tu servidor
  user: 'postgres',    // tu usuario de postgres
  password: '123456789', // tu clave
  database: 'Tienda',   // tu base de datos
  port: 5000,           // puerto default de Postgres
});

db.connect()
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error de conexión', err));

module.exports = db;


