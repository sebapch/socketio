'use client';
import { useState } from 'react';

export default function SpellSelector({ onSelectSpell }) {
  const [selectedSpell, setSelectedSpell] = useState(null);

  const handleSpellClick = (spell) => {
    setSelectedSpell(spell);
    onSelectSpell(spell);
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <h3 className="text-lg font-bold mb-2">Selecciona un hechizo:</h3>
      <div className="flex space-x-4">
        <button 
          className={`px-4 py-2 rounded ${selectedSpell === 'CURAR' ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
          onClick={() => handleSpellClick('CURAR')}
        >
          CURAR
        </button>
        <button 
          className={`px-4 py-2 rounded ${selectedSpell === 'MAGIA' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          onClick={() => handleSpellClick('MAGIA')}
        >
          MAGIA
        </button>
      </div>
    </div>
  );
}
