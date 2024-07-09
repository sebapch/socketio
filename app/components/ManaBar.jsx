'use client';

export default function ManaBar({ mana, maxMana }) {
  const manaPercentage = (mana / maxMana) * 100;

  return (
    <div className="relative w-full h-4 bg-stone-700 rounded-full overflow-hidden mt-1">
      <div 
        className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 ease-in-out"
        style={{ width: `${manaPercentage}%` }}
      ></div>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs text-white font-bold">
        {mana}/{maxMana}
      </div>
    </div>
  );
}