const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'argumedogutierrezluisangel@gmail.com',
    pass: 'sstn otkk rgqv giqs' // contraseña de aplicación
  }
});

module.exports = transporter;

