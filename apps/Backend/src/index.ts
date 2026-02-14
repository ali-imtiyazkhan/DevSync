import { createServer } from "./server";
import { Server } from "socket.io";

const PORT = 5000;

const { server } = createServer();

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms: Record<string, Set<string>> = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = new Set();
    }

    rooms[roomId].add(socket.id);

    console.log(`Socket ${socket.id} joined room ${roomId}`);

    io.to(roomId).emit("room-users", Array.from(rooms[roomId]));
  });

  // WebRTC Offer
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", {
      offer,
      from: socket.id,
    });
  });

  // WebRTC Answer
  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", {
      answer,
      from: socket.id,
    });
  });

  // ICE Candidates
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const roomId in rooms) {
      const room = rooms[roomId];

      if (!room) continue;

      if (room.has(socket.id)) {
        room.delete(socket.id);
        io.to(roomId).emit("room-users", Array.from(room));
      }
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(` DevSync backend running on http://localhost:${PORT}`);
});
