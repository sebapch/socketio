import io from 'socket.io-client';

export const initSocket = async () => {
  await fetch('/api/socketio');
  return io();
};