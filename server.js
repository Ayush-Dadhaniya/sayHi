const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 5000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer);

  let users = {};

  const addUser = (userId, socketId) => {
    !users[userId] && (users[userId] = socketId);
  };

  const removeUser = (socketId) => {
    users = Object.fromEntries(
      Object.entries(users).filter(([, sId]) => sId !== socketId)
    );
  };

  const getUser = (userId) => {
    return users[userId];
  };

  io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // take userId and socketId from user
    socket.on("add-user", (userId) => {
      addUser(userId, socket.id);
      io.emit("get-users", Object.keys(users));
    });

    // send and get message
    socket.on("send-message", (data) => {
      const user = getUser(data.toUserId);
      if (user) {
        io.to(user).emit("new-message", data);
      }
    });

    // exchange keys
    socket.on("exchange-key", (data) => {
      const user = getUser(data.to);
      if (user) {
        io.to(user).emit("exchange-key", { from: data.from, key: data.key });
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id);
      removeUser(socket.id);
      io.emit("get-users", Object.keys(users));
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
