const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const net = require('net');
const bodyParser = require('body-parser');
const cors = require('cors');

const HOST = '127.0.0.1'; // Reemplaza con la dirección IP del servidor
const PORT = 5000; // Reemplaza con el puerto del servidor

// Middleware para parsear el cuerpo de las solicitudes HTTP
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Habilitar CORS
app.use(cors());

// Endpoint para recibir la trama de React.js
app.post('/trama', (req, res) => {
  const trama = req.body.trama;

  // Establece una conexión con el servidor Java
  const socket = new net.Socket();

  socket.connect(PORT, HOST, () => {
    console.log('Conexión establecida con el servidor Java');
    console.log(trama);

    // Envía la nueva trama al servidor Java
    const mensajeBytes = Buffer.from(trama, 'utf-8');
    const mensajeLength = Buffer.alloc(4);
    mensajeLength.writeInt32BE(mensajeBytes.length, 0);
    const mensajeCompleto = Buffer.concat([mensajeLength, mensajeBytes]);

    socket.write(mensajeCompleto);
  });

  socket.on('data', (data) => {
    // Obtiene la respuesta del servidor Java
    const respuestaLength = data.readInt32BE(0);
    const respuestaBytes = data.slice(4, respuestaLength + 4);
    const respuesta = respuestaBytes.toString('utf-8');

    console.log('Respuesta del servidor Java:', respuesta);

    // Envía la respuesta de vuelta a React.js
    res.header('Access-Control-Allow-Origin', '*');
    res.send(respuesta);

    // Cierra la conexión con el servidor Java
    socket.end();
  });

  socket.on('close', () => {
    console.log('Conexión con el servidor Java cerrada');
  });

  socket.on('error', (error) => {
    console.error('Error de conexión con el servidor Java:', error);
    res.status(500).send('Error de conexión con el servidor Java');
  });
});

// Inicia el servidor HTTP
const server = http.listen(3000, () => {
  console.log('Servidor Node.js iniciado en el puerto 3000');
});
