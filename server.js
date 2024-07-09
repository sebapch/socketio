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
    players.set(socket.id, { position, health: 10, mana: 15, poisoned: false });
    
    // Envía la posición inicial al jugador
    socket.emit('init', { id: socket.id, position, health: 10, mana: 15 });
    
    // Envía la lista actualizada de jugadores a todos
    io.emit('players', Array.from(players).map(([id, data]) => [id, data.position, data.health, data.mana, data.poisoned]));
  
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

    socket.on('castSpell', (spellName, targetId) => {
      const caster = players.get(socket.id);
      const target = players.get(targetId);
      
      if (!caster || !target) return;

      const spellCosts = {
        'CURAR': 5,
        'MAGIA': 2,
        'FUEGO': 3,
        'ESCUDO': 4,
        'RAYO': 5,
        'VENENO': 4,
        'CURAR_VENENO': 3
      };
  
      if (caster.mana < spellCosts[spellName]) {
        socket.emit('message', 'No tienes suficiente mana');
        return;
      }
  
      caster.mana -= spellCosts[spellName];
  
      switch(spellName) {
        case 'CURAR':
          if (socket.id === targetId) {
            caster.health = Math.min(10, caster.health + 5);
            socket.emit('message', 'Te has curado');
          }
          break;
        case 'MAGIA':
          if (socket.id !== targetId) {
            target.health = Math.max(0, target.health - 1);
            socket.emit('message', 'Has lanzado Magia');
            io.to(targetId).emit('message', 'Te han atacado con Magia');
          }
          break;
        case 'FUEGO':
          if (socket.id !== targetId) {
            target.health = Math.max(0, target.health - 2);
            socket.emit('message', 'Has lanzado Fuego');
            io.to(targetId).emit('message', 'Te han atacado con Fuego');
          }
          break;
        case 'ESCUDO':
          if (socket.id === targetId) {
            caster.health = Math.min(10, caster.health + 2);
            socket.emit('message', 'Has activado el Escudo');
          }
          break;
        case 'RAYO':
          if (socket.id !== targetId) {
            target.health = Math.max(0, target.health - 3);
            socket.emit('message', 'Has lanzado Rayo');
            io.to(targetId).emit('message', 'Te han atacado con Rayo');
          }
          break;
        case 'VENENO':
          if (socket.id !== targetId) {
            if (!target.poisoned) {
              target.poisoned = true;
              socket.emit('message', 'Has envenenado al objetivo');
              io.to(targetId).emit('message', 'Has sido envenenado');
              
              // Efecto de veneno
              const poisonInterval = setInterval(() => {
                if (target.poisoned && target.health > 0) {
                  target.health = Math.max(0, target.health - 1);
                  io.to(targetId).emit('message', 'Sufres daño por veneno');
                  io.emit('players', Array.from(players).map(([id, data]) => [id, data.position, data.health, data.poisoned]));
                } else {
                  clearInterval(poisonInterval);
                }
              }, 1000);
            }
          }
          break;
        case 'CURAR_VENENO':
          if (socket.id === targetId) {
            caster.poisoned = false;
            socket.emit('message', 'Te has curado del veneno');
          }
          break;
      }
  
    io.emit('players', Array.from(players).map(([id, data]) => [id, data.position, data.health, data.mana, data.poisoned]));
  
    });


  socket.on('usePotion', (potionType) => {
    const player = players.get(socket.id);
    if (!player) return;

    switch(potionType) {
      case 'HEALTH':
        player.health = Math.min(10, player.health + 5);
        socket.emit('message', 'Has usado una poción de vida');
        break;
      case 'MANA':
        player.mana = Math.min(15, player.mana + 7);
        socket.emit('message', 'Has usado una poción de mana');
        break;
    }

    io.emit('players', Array.from(players).map(([id, data]) => [id, data.position, data.health, data.mana, data.poisoned]));
  });

});

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
