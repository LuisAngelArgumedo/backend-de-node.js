const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'prueba',
  port: 3307
});

// Ruta para login
app.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body;

  db.query(
    'SELECT * FROM usuario WHERE usuario = ? AND contrasena = ?',
    [usuario, contrasena],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (results.length > 0) {
        res.json({ message: 'Login exitoso' });
      } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
      }
    }
  );
});

// Ruta para registrar usuario
app.post('/registrar', (req, res) => {
  const { usuario, contrasena } = req.body;

  // Validar campos
  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  // Verificar si ya existe el usuario
  db.query(
    'SELECT * FROM usuario WHERE usuario = ?',
    [usuario],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: 'El usuario ya existe' });
      }

      // Insertar nuevo usuario
      db.query(
        'INSERT INTO usuario (usuario, contrasena) VALUES (?, ?)',
        [usuario, contrasena],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Error al registrar usuario' });
          }

          res.status(201).json({ message: 'Usuario registrado con éxito' });
        }
      );
    }
  );
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

