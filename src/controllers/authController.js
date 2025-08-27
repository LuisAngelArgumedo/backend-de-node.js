const db = require('../config/db'); // conexión con pg (Pool)
const transporter = require('../utils/mailer');
const crypto = require('crypto');

// LOGIN
exports.login = (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  const query = `
    SELECT idusuario, usuario, email, contrasena
    FROM usuario 
    WHERE usuario = $1 AND contrasena = $2
  `;

  db.query(query, [usuario, contrasena], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });

    if (result.rows.length > 0) {
      res.json({ message: 'Login exitoso', usuario: result.rows[0] });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  });
};

// REGISTRAR
exports.registrar = (req, res) => {
  const { usuario, email, contrasena } = req.body;

  if (!usuario || !email || !contrasena) {
    return res.status(400).json({ error: 'Usuario, correo y contraseña son requeridos' });
  }

  db.query(
    'SELECT * FROM usuario WHERE usuario = $1 OR email = $2',
    [usuario, email],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error en el servidor' });

      if (result.rows.length > 0) {
        return res.status(409).json({ error: 'El usuario o el correo ya existen' });
      }

      db.query(
        'INSERT INTO usuario (usuario, email, contrasena) VALUES ($1, $2, $3)',
        [usuario, email, contrasena],
        (err2) => {
          if (err2) return res.status(500).json({ error: 'Error al registrar usuario' });
          res.status(201).json({ message: 'Usuario registrado con éxito' });
        }
      );
    }
  );
};

// SOLICITAR RESET
exports.solicitarReset = (req, res) => {
  const { destinatario } = req.body;

  if (!destinatario || !destinatario.includes('@')) {
    return res.status(400).json({ mensaje: 'Correo inválido' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const enlace = `http://localhost:5173/resetPassword/${token}`;
  const query = `
    UPDATE usuario 
    SET reset_token = $1, token_expira = NOW() + INTERVAL '1 hour'
    WHERE email = $2
  `;

  db.query(query, [token, destinatario], (err, result) => {
    if (err) return res.status(500).json({ mensaje: 'Error al generar el token' });

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado con ese correo' });
    }

    const mailOptions = {
      from: 'argumedogutierrezluisangel@gmail.com',
      to: destinatario,
      subject: 'Restablece tu contraseña',
      html: `<p>Haz clic <a href="${enlace}">aquí</a> para restablecer tu contraseña.</p>`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return res.status(500).json({ mensaje: 'Error al enviar el correo', error: error.message });
      }
      return res.status(200).json({ mensaje: 'Correo enviado correctamente' });
    });
  });
};

// RESETEAR
exports.resetear = (req, res) => {
  const { token, nuevaContrasena } = req.body;

  if (!token || !nuevaContrasena) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const selectQuery = `
    SELECT * FROM usuario 
    WHERE reset_token = $1 AND token_expira > NOW()
  `;

  db.query(selectQuery, [token], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al buscar token' });

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const updateQuery = `
      UPDATE usuario 
      SET contrasena = $1, reset_token = NULL, token_expira = NULL 
      WHERE reset_token = $2
    `;

    db.query(updateQuery, [nuevaContrasena, token], (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al actualizar contraseña' });
      res.json({ message: 'Contraseña actualizada correctamente' });
    });
  });
};
