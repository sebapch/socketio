'use client';

import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

let socket;

const Chat = () => {
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [messages, setMessages] = useState([]);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!socket) {
      socketInitializer();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      drawGrid();
    }
  }, [players]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [myId, players]);

  const socketInitializer = async () => {
    await fetch('/api/socketio');
    socket = io();

    socket.on('init', (data) => {
      setMyId(data.id);
    });

    socket.on('players', (playerData) => {
      setPlayers(playerData);
    });

    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  };

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const cellSize = 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ddd';
    for (let i = 0; i <= 50; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, 500);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(500, i * cellSize);
      ctx.stroke();
    }

    players.forEach(([id, position, health]) => {
      ctx.fillStyle = id === myId ? 'red' : 'black';
      ctx.fillRect(position.x * cellSize, position.y * cellSize, cellSize, cellSize * 2);

      ctx.fillStyle = 'green';
      ctx.fillRect(position.x * cellSize, (position.y * cellSize) - 5, (health / 10) * cellSize, 3);
    });
  };

  const handleKeyPress = (e) => {
    if (!myId) return;

    const currentPlayer = players.find(([id]) => id === myId);
    if (!currentPlayer) return;

    const [, currentPosition] = currentPlayer;
    let newPosition = { ...currentPosition };

    switch (e.key) {
      case 'ArrowUp':
        newPosition.y = Math.max(0, newPosition.y - 1);
        break;
      case 'ArrowDown':
        newPosition.y = Math.min(47, newPosition.y + 1);
        break;
      case 'ArrowLeft':
        newPosition.x = Math.max(0, newPosition.x - 1);
        break;
      case 'ArrowRight':
        newPosition.x = Math.min(49, newPosition.x + 1);
        break;
      default:
        return;
    }

    if (newPosition.x !== currentPosition.x || newPosition.y !== currentPosition.y) {
      socket.emit('move', newPosition);
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 10);
    const y = Math.floor((e.clientY - rect.top) / 10);

    const clickedPlayer = players.find(([, data]) => 
      data.position.x === x && (data.position.y === y || data.position.y + 1 === y)
    );

    if (clickedPlayer && clickedPlayer[0] !== myId) {
      setMessages((prev) => [...prev, `Atacaste al jugador en X=${x}, Y=${y}`]);
      socket.emit('attack', clickedPlayer[0]);
    } else {
      setMessages((prev) => [...prev, `Click en X=${x}, Y=${y}. No hay enemigos.`]);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <canvas 
        ref={canvasRef} 
        width={500} 
        height={500} 
        style={{ border: '1px solid black' }}
        onClick={handleCanvasClick}
      />
      <div style={{ marginLeft: '20px', width: '200px' }}>
        <h3>Mensajes:</h3>
        <ul style={{ height: '400px', overflowY: 'auto', listStyle: 'none', padding: 0 }}>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
        <h3>Jugadores:</h3>
        <ul>
          {players.map(([id, position, health]) => (
            <li key={id}>
              {id === myId ? 'Tú' : `Jugador ${id}`}:
              {` Posición: (${position.x}, ${position.y}) HP: ${health}`}
            </li>
          ))}
        </ul>
        <h3>Tu posición:</h3>
        {myId && (
          <div>
            Posición: ({players.find(([id]) => id === myId)?.[1]?.x ?? 0}, {players.find(([id]) => id === myId)?.[1]?.y ?? 0})
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
