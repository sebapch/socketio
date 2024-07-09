'use client';

export default function PotionSelector({ onUsePotion }) {
  const potions = [
    { name: 'HEALTH', label: 'Poción de Vida', color: 'bg-red-600' },
    { name: 'MANA', label: 'Poción de Mana', color: 'bg-blue-600' }
  ];

  return (
    <div className="bg-stone-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-2 text-amber-500">Pociones:</h3>
      <div className="grid grid-cols-2 gap-2">
        {potions.map((potion) => (
          <button 
            key={potion.name}
            className={`px-3 py-2 rounded text-xs ${potion.color} text-white hover:opacity-80 transition duration-200 ease-in-out`}
            onClick={() => onUsePotion(potion.name)}
          >
            {potion.label}
          </button>
        ))}
      </div>
    </div>
  );
}