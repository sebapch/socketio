import React from 'react';

const Character = ({ position, isCurrentPlayer }) => {
  return (
    <div 
      className={`absolute ${isCurrentPlayer ? 'bg-red-500' : 'bg-black'}`}
      style={{
        left: `${position.x * 20}px`,
        top: `${position.y * 20}px`,
        width: '20px',
        height: '40px',
        transition: 'all 0.3s ease-out',
      }}
    >
      <div className="w-full h-1/2 animate-bounce">
        {/* Cabeza */}
      </div>
      <div className="w-full h-1/2">
        {/* Cuerpo */}
      </div>
    </div>
  );
};

export default Character;