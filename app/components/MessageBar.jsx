import React from "react";

const MessageBar = ({ messages }) => {
  return (
    <div className="h-32 bg-stone-800 rounded-lg p-2 overflow-hidden">
      <h3 className="text-amber-500 font-bold mb-1">Mensajes:</h3>
      <ul className="h-24 overflow-y-auto list-none p-0 text-sm">
        {messages.map((msg, index) => (
          <li key={index} className="text-amber-100">{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default MessageBar;