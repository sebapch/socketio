const express = require('express');
const next = require('next');
const { createServer } = require('http');
const { Server } = require('socket.io');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new Server(httpServer);
  const players = new Map();

  io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    
    // Genera una posición aleatoria para el nuevo jugador
    const position = {
      x: Math.floor(Math.random() * 50),
      y: Math.floor(Math.random() * 48)
    };
    
    // Guarda el jugador con el socket.id como clave
    players.set(socket.id, { position, health: 10 });
    
    // Envía la posición inicial al jugador
    socket.emit('init', { id: socket.id, position, health: 10 });
    
    // Envía la lista actualizada de jugadores a todos
    io.emit('players', Array.from(players).map(([id, data]) => [id, data.position, data.health]));
  
    socket.on('disconnect', () => {
      console.log('user disconnected', socket.id);
      players.delete(socket.id);
      io.emit('players', Array.from(players).map(([id, data]) => [id, data.position, data.health]));
    });
  
    socket.on('move', (newPosition) => {
      const player = players.get(socket.id);
      if (player) {
        player.position = newPosition;
        players.set(socket.id, player);
        io.emit('players', Array.from(players).map(([id, data]) => [id, data.position, data.health]));
      }
    });
  
    socket.on('attack', (targetId) => {
      const targetPlayer = players.get(targetId);
      if (targetPlayer) {
        targetPlayer.health = Math.max(0, targetPlayer.health - 1);
        players.set(targetId, targetPlayer);
        io.emit('players', Array.from(players).map(([id, data]) => [id, data.position, data.health]));
        socket.emit('message', 'Le has dado');
        io.to(targetId).emit('message', 'Te han atacado');
      } else {
        socket.emit('message', 'Le has errado');
      }
    });
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
