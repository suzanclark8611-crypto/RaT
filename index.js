const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Serve the Slate Blur UI
app.use(express.static('public'));

const io = new Server(server, {
  cors: { origin: "*" },
  // Increase buffer to 10MB to prevent crashes with large images
  maxHttpBufferSize: 1e7 
});

io.on("connection", (socket) => {
  console.log("New Connection:", socket.id);

  socket.on("identify", (type) => {
    if (type === "phone") {
      socket.join("phones");
      console.log("-> Phone Connected");
    } else if (type === "controller") {
      socket.join("controllers");
      console.log("-> Dashboard Connected");
    }
  });

  // Relay Screen: Phone -> Server -> Dashboard
  socket.on("screen_frame", (data) => {
    socket.to("controllers").emit("display_frame", data);
  });

  // Relay Commands: Dashboard -> Server -> Phone
  socket.on("send_command", (data) => {
    io.to("phones").emit("execute_command", data);
  });

  socket.on("disconnect", () => console.log("Disconnected:", socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
