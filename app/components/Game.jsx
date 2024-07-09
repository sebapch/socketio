"use client";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SpellSelector from "./SpellSelector";
import PotionSelector from "./PotionSelector"

let socket;

export default function Game() {
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [shootingMode, setShootingMode] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState(null);

  const canvasRef = useRef(null);

  useEffect(() => {
    socketInitializer();

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
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [myId, players]);

  const socketInitializer = async () => {
    await fetch("/api/socketio");
    socket = io();

    socket.on("init", (data) => {
      setMyId(data.id);
    });

    socket.on("players", (playerData) => {
      setPlayers(playerData);
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  };

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const cellSize = 10; // Tamaño de cada celda en píxeles

    // Limpia el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibuja la grilla
    ctx.strokeStyle = "#ddd";
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

    // Dibuja los jugadores
    players.forEach(([id, position, health]) => {
      ctx.fillStyle = id === myId ? "red" : "black";
      ctx.fillRect(
        position.x * cellSize,
        position.y * cellSize,
        cellSize,
        cellSize * 2
      );

      // Dibuja la barra de vida
      ctx.fillStyle = "green";
      ctx.fillRect(
        position.x * cellSize,
        position.y * cellSize - 5,
        (health / 10) * cellSize,
        3
      );
    });
  };

  const handleKeyPress = (e) => {
    if (!myId) return;

    const currentPlayer = players.find(([id]) => id === myId);
    if (!currentPlayer) return;

    const [, currentPosition] = currentPlayer;
    let newPosition = { ...currentPosition };

    switch (e.key) {
      case "ArrowUp":
        newPosition.y = Math.max(0, newPosition.y - 1);
        break;
      case "ArrowDown":
        newPosition.y = Math.min(47, newPosition.y + 1); // 47 porque el jugador ocupa 2 celdas de altura
        break;
      case "ArrowLeft":
        newPosition.x = Math.max(0, newPosition.x - 1);
        break;
      case "ArrowRight":
        newPosition.x = Math.min(49, newPosition.x + 1);
        break;
      default:
        return;
    }

    if (
      newPosition.x !== currentPosition.x ||
      newPosition.y !== currentPosition.y
    ) {
      socket.emit("move", newPosition);
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 10);
    const y = Math.floor((e.clientY - rect.top) / 10);

    console.log(`Click en posición: X=${x}, Y=${y}`);

    const clickedPlayer = players.find(
      ([, position]) =>
        position.x === x && (position.y === y || position.y + 1 === y)
    );

    if (shootingMode) {
      if (clickedPlayer && clickedPlayer[0] !== myId) {
        console.log(`Enemigo encontrado: ${clickedPlayer[0]}`);
        setMessages((prev) => [
          ...prev,
          `Atacaste al jugador en X=${x}, Y=${y}`,
        ]);
        socket.emit("attack", clickedPlayer[0]);
      } else {
        setMessages((prev) => [
          ...prev,
          `Click en X=${x}, Y=${y}. No hay enemigos.`,
        ]);
      }
      setShootingMode(false);
    }
  };

  const handleShootButtonClick = () => {
    if (!selectedSpell) {
      setMessages((prev) => [...prev, "Selecciona un hechizo primero."]);
      return;
    }
    if (selectedSpell === "CURAR") {
      socket.emit("heal");
    } else {
      setShootingMode(true);
    }
  };

  const handleSelectSpell = (spell) => {
    setSelectedSpell(spell);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex">
        <div>
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className={`border border-black ${
              shootingMode ? "cursor-crosshair" : ""
            }`}
            onClick={handleCanvasClick}
          />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex w-full">
            <div className="flex-1">
              <h3>Mensajes:</h3>
              <ul className="h-1/2 overflow-y-auto list-none p-0">
                {messages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            </div>
            <div className="flex-1">
              <h3>Jugadores:</h3>
              <ul>
                {players.map(([id, position, health]) => (
                  <li key={id}>
                    {id === myId ? "Tú" : `Jugador ${id}`}:
                    {` Posición: (${position.x}, ${position.y}) HP: ${health}`}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1">
              <h3>Tu posición:</h3>
              {/* Añade aquí el contenido de tu posición */}
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              onClick={handleShootButtonClick}
            >
              Activar modo de disparo
            </button>
          </div>
          <SpellSelector onSelectSpell={handleSelectSpell} />
        </div>
      </div>
    </div>
  );
}
