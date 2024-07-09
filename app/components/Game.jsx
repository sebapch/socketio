"use client";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SpellSelector from "./SpellSelector";
import PotionSelector from "./PotionSelector";
import MessageBar from "./MessageBar";
import HealthBar from "./HealthBar";
import ManaBar from "./ManaBar";

let socket;

export default function Game() {
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [shootingMode, setShootingMode] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [targetMode, setTargetMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("spells");
  const [terrain, setTerrain] = useState([]);
  const [connectedPlayers, setConnectedPlayers] = useState(0);
  const viewSize = 20;
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

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
      drawGame();
    }
  }, [players]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [myId, players]);

  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const aspectRatio = 1.5; // Ajusta este valor para cambiar la proporción ancho/alto

        canvasRef.current.width = containerWidth * 1.9;
        canvasRef.current.height = containerWidth * aspectRatio;
        drawGame();
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [players, terrain]);

  const socketInitializer = async () => {
    await fetch("/api/socketio");
    socket = io();

    socket.on("init", (data) => {
      setMyId(data.id);
      setTerrain(data.terrain);
    });

    socket.on("players", (playerData) => {
      setPlayers(playerData);
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const cellSize = Math.min(canvas.width, canvas.height) / viewSize;
    // Limpia el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const player = players.find(([id]) => id === myId);
    if (!player) return;

    const [, playerPos] = player;
    const cameraX = playerPos.x - viewSize / 2;
    const cameraY = playerPos.y - viewSize / 2;

    // Dibuja el terreno
    for (let y = 0; y < viewSize; y++) {
      for (let x = 0; x < viewSize; x++) {
        const terrainX = Math.floor(cameraX + x);
        const terrainY = Math.floor(cameraY + y);
        if (terrainX >= 0 && terrainX < 50 && terrainY >= 0 && terrainY < 50) {
          ctx.fillStyle =
            terrain[terrainY][terrainX] === 1 ? "#228B22" : "#808080";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Dibuja los jugadores
    players.forEach(([id, position, health, mana, poisoned]) => {
      const x = position.x - cameraX;
      const y = position.y - cameraY;
      if (x >= 0 && x < viewSize && y >= 0 && y < viewSize) {
        ctx.fillStyle = id === myId ? "red" : "black";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize * 2);
      }
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
        newPosition.y = Math.min(48, newPosition.y + 1); // 47 porque el jugador ocupa 2 celdas de altura
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

    if (targetMode && selectedSpell) {
      const clickedPlayer = players.find(
        ([, position]) =>
          position.x === x && (position.y === y || position.y + 1 === y)
      );

      if (clickedPlayer) {
        socket.emit("castSpell", selectedSpell, clickedPlayer[0]);
        setMessages((prev) => [
          ...prev,
          `Lanzaste ${selectedSpell} en X=${x}, Y=${y}`,
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          `Click en X=${x}, Y=${y}. No hay objetivo válido.`,
        ]);
      }
      setTargetMode(false);
    }
  };

  const handleSpellButtonClick = () => {
    if (!selectedSpell) {
      setMessages((prev) => [...prev, "Selecciona un hechizo primero."]);
      return;
    }
    setTargetMode(true);
  };

  const handleSelectSpell = (spell) => {
    setSelectedSpell(spell);
  };

  const handlePotionUse = (potionType) => {
    socket.emit("usePotion", potionType);
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

  return (
    <div className="flex h-screen w-full bg-stone-900 text-amber-100 overflow-hidden">
      {/* First column (3/4 width) */}
      <div className="w-3/4 flex flex-col p-4">
        <MessageBar messages={messages} />
        <div ref={containerRef} className="flex-grow mt-4 relative w-full">
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full min-w-full"
            onClick={handleCanvasClick}
          />
        </div>
      </div>

      {/* Second column (1/4 width) */}
      <div className="w-1/4 flex flex-col p-4 bg-stone-800">
        {/* Player ID and Health */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-amber-500">Tu estado:</h3>
          {players.map(
            ([id, position, health, mana, poisoned]) =>
              id === myId && (
                <div key={id} className="mt-2">
                  <p>
                    Posición: ({position.x}, {position.y})
                  </p>
                  <HealthBar
                    health={health}
                    maxHealth={10}
                    poisoned={poisoned}
                  />
                  <ManaBar mana={mana} maxMana={15} />
                </div>
              )
          )}
        </div>

        {/* Spell and Potion Selector */}
        <div className="mb-4">
          <div className="flex mb-2">
            <button
              className={`flex-1 py-2 ${
                selectedTab === "spells" ? "bg-amber-600" : "bg-stone-700"
              } text-white rounded-tl rounded-tr`}
              onClick={() => setSelectedTab("spells")}
            >
              Hechizos
            </button>
            <button
              className={`flex-1 py-2 ${
                selectedTab === "potions" ? "bg-amber-600" : "bg-stone-700"
              } text-white rounded-tl rounded-tr`}
              onClick={() => setSelectedTab("potions")}
            >
              Pociones
            </button>
          </div>
          {selectedTab === "spells" ? (
            <>
              <SpellSelector onSelectSpell={handleSelectSpell} />
              <button
                className="mt-2 w-full px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition duration-200 ease-in-out"
                onClick={handleSpellButtonClick}
              >
                Lanzar hechizo
              </button>
            </>
          ) : (
            <PotionSelector onUsePotion={handlePotionUse} />
          )}
        </div>

        {/* Player List */}
        <div>
          <div className="mb-4">
            <p className="text-amber-500">
              Jugadores conectados: {connectedPlayers}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
