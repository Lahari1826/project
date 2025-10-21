import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import Message from "./models/Message.js";
import uploadRoute from "./routes/upload.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use("/upload", uploadRoute);

const PORT = process.env.PORT || 3000;
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("login", (username) => {
    onlineUsers[username] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  Message.find().sort({ timestamp: 1 }).then((msgs) => {
    socket.emit("previousMessages", msgs);
  });

  socket.on("sendMessage", async ({ sender, receiver, message, file }) => {
    try {
      const msg = new Message({ sender, receiver, message, file });
      await msg.save();

      if (receiver) {
        const receiverSocket = onlineUsers[receiver];
        if (receiverSocket) io.to(receiverSocket).emit("receiveMessage", msg);
        socket.emit("receiveMessage", msg);
      } else {
        io.emit("receiveMessage", msg);
      }
    } catch (err) {
      console.error("Message save error:", err);
    }
  });

  socket.on("typing", ({ sender, receiver }) => {
    if (receiver && onlineUsers[receiver])
      io.to(onlineUsers[receiver]).emit("typing", sender);
    else socket.broadcast.emit("typing", sender);
  });

  socket.on("disconnect", () => {
    for (const [user, id] of Object.entries(onlineUsers)) {
      if (id === socket.id) delete onlineUsers[user];
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("❌ User disconnected:", socket.id);
  });
});

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
