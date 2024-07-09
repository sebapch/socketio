'use client';

export default function HealthBar({ health, maxHealth, poisoned }) {
  const healthPercentage = (health / maxHealth) * 100;

  return (
    <div className="relative w-full h-4 bg-stone-700 rounded-full overflow-hidden">
      <div 
        className={`absolute top-0 left-0 h-full ${poisoned ? 'bg-green-600' : 'bg-red-600'} transition-all duration-300 ease-in-out`}
        style={{ width: `${healthPercentage}%` }}
      ></div>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs text-white font-bold">
        {health}/{maxHealth}
      </div>
    </div>
  );
}