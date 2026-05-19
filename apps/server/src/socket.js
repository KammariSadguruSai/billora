const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const connectedUsers = new Map(); // userId -> socketId

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    connectedUsers.set(userId, socket.id);
    console.log(`✅ User ${userId} connected (${socket.id})`);

    // Broadcast online status
    io.emit('user:online', { userId });

    // Join personal room
    socket.join(`user:${userId}`);

    // ─── Project rooms ───────────────────────────────────────
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`User ${userId} joined project room ${projectId}`);
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // ─── Chat rooms ───────────────────────────────────────────
    socket.on('join:room', (roomId) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('leave:room', (roomId) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on('chat:message', (data) => {
      io.to(`room:${data.roomId}`).emit('chat:message', data);
    });

    socket.on('chat:typing', (data) => {
      socket.to(`room:${data.roomId}`).emit('chat:typing', {
        userId,
        roomId: data.roomId,
        isTyping: data.isTyping,
      });
    });

    // ─── Task updates ─────────────────────────────────────────
    socket.on('task:update', (data) => {
      io.to(`project:${data.projectId}`).emit('task:updated', data);
    });

    socket.on('task:move', (data) => {
      io.to(`project:${data.projectId}`).emit('task:moved', data);
    });

    // ─── Disconnect ───────────────────────────────────────────
    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      io.emit('user:offline', { userId });
      console.log(`❌ User ${userId} disconnected`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

function emitToUser(userId, event, data) {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

function emitToProject(projectId, event, data) {
  if (io) io.to(`project:${projectId}`).emit(event, data);
}

function broadcastNotification(userIds, notification) {
  if (!io) return;
  userIds.forEach(userId => {
    io.to(`user:${userId}`).emit('notification:new', notification);
  });
}

module.exports = { initSocket, getIO, emitToUser, emitToProject, broadcastNotification };
