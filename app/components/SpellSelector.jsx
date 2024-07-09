'use client';
import { useState, useEffect } from 'react';

const spells = [
  { nombre: "CURAR", descripcion: "Restaura toda la salud del jugador.", efecto: "curar" },
  { nombre: "MAGIA", descripcion: "Quita 1 punto de vida al enemigo.", efecto: "atacar" },
  { nombre: "FUEGO", descripcion: "Quita 2 puntos de vida al enemigo.", efecto: "atacar" },
  { nombre: "ESCUDO", descripcion: "Aumenta en 2 puntos la salud del jugador.", efecto: "curar" },
  { nombre: "RAYO", descripcion: "Quita 3 puntos de vida al enemigo.", efecto: "atacar" },
  { nombre: "VENENO", descripcion: "Causa 1 punto de daño por segundo al enemigo.", efecto: "envenenar" },
  { nombre: "CURAR_VENENO", descripcion: "Cura el efecto de veneno.", efecto: "curar_veneno" }
];

export default function SpellSelector({ onSelectSpell }) {
  const [selectedSpell, setSelectedSpell] = useState(null);

  const handleSpellClick = (spell) => {
    setSelectedSpell(spell);
    onSelectSpell(spell);
  };

  return (
    <div className="bg-stone-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-2 text-amber-500">Hechizos:</h3>
      <div className="grid grid-cols-2 gap-2">
        {spells.map((spell) => (
          <button 
            key={spell.nombre}
            className={`px-3 py-2 rounded text-xs ${
              selectedSpell === spell.nombre 
                ? 'bg-amber-600 text-white' 
                : 'bg-stone-700 text-amber-400 hover:bg-stone-600'
            } transition duration-200 ease-in-out`}
            onClick={() => handleSpellClick(spell.nombre)}
          >
            {spell.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}