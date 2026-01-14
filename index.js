const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);

app.use(express.static('public'));

const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e7 // Supports high-res screen frames
});

const PORT = process.env.PORT || 3000;

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("identify", (type) => {
    if(type === "phone") socket.join("phones");
    if(type === "controller") socket.join("controllers");
    console.log(`Device identified as: ${type}`);
  });

  // Relay screen from phone to dashboard
  socket.on("screen_frame", (data) => {
    socket.to("controllers").emit("display_frame", data);
  });

  // Relay mouse click from dashboard to phone
  socket.on("send_command", (data) => {
    socket.to("phones").emit("execute_command", data);
  });
});

server.listen(PORT, () => {
  console.log(`Server is live on port ${PORT}`);
});
