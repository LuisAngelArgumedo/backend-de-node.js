const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');


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

// Crear el transporter para enviar correos
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'argumedogutierrezluisangel@gmail.com',
    pass: 'sstn otkk rgqv giqs'
  }
});

// Ruta para solicitar reset de contraseña
app.post('/solicitar-reset', (req, res) => {
  const { destinatario } = req.body;

  if (!destinatario || !destinatario.includes('@')) {
    return res.status(400).json({ mensaje: 'Correo inválido' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const enlace = `http://localhost:5173/resetPassword`;

  const query = 'UPDATE usuario SET reset_token = ?, token_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?';
  db.query(query, [token, destinatario], (err, result) => {
    if (err) {
      console.error('Error al guardar token:', err);
      return res.status(500).json({ mensaje: 'Error al generar el token' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado con ese correo' });
    }

    const mailOptions = {
      from: 'argumedogutierrezluisangel@gmail.com',
      to: destinatario,
      subject: 'Restablece tu contraseña',
      html: `<p>Haz clic <a href="${enlace}">aquí</a> para restablecer tu contraseña.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar:', error.message || error);
        return res.status(500).json({ mensaje: 'Error al enviar el correo', error: error.message });
      }
      console.log('Correo enviado:', info.response);
      return res.status(200).json({ mensaje: 'Correo enviado correctamente' });
    });
  });
});


// Ruta para resetear la contraseña
app.post('/resetear', (req, res) => {
  const { token, nuevaContrasena } = req.body;

  if (!token || !nuevaContrasena) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  db.query(
    'SELECT * FROM usuario WHERE reset_token = ? AND token_expira > NOW()',
    [token],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      db.query(
        'UPDATE usuario SET contrasena = ?, reset_token = NULL, token_expira = NULL WHERE reset_token = ?',
        [nuevaContrasena, token],
        (err2) => {
          if (err2) {
            return res.status(500).json({ error: 'Error al actualizar contraseña' });
          }
          res.json({ message: 'Contraseña actualizada correctamente' });
        }
      );
    }
  );
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

