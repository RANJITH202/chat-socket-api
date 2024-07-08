require("dotenv").config();
const app = require("./app");
const { Server } = require("socket.io");
const jwt = require("jwt-then");

// Mongoose DB Connection
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("error", (err) => {
  console.error(`Mongoose Connection Error → ${err.message}`);
});

mongoose.connection.once("open", () => {
  console.log("MongoDB connected");
});
// MongoDB Models
const User = require("./models/Users");
const Message = require("./models/Message");
const { addMessage } = require("./controllers/msgController");

// Start the server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}!`);
});

// Socket Connection
const io = new Server(server, {
  allowEIO3: true,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token;
    const payload = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET_KEY
    );
    socket.userId = payload.id;
    socket.username = payload.name;
    next();
  } catch (err) {}
});

const connectedUsers = new Set();
const userSockets = {};
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.username} SocketID: ${socket.id}`);
  connectedUsers.add(socket.userId);
  userSockets[socket.userId] = socket.id;

  socket.on("message", (data) => {
    console.log(data.message);
  });

  socket.on("send_message", async ({ message, senderId, receiverId }) => {
    if (connectedUsers.has(receiverId)) {
      const msg = await addMessage(
        { body: { message, senderId, receiverId, isRecieved: true } },
        ""
      );
      io.emit("receive_message", msg);
    } else {
      const msg = await addMessage(
        { body: { message, senderId, receiverId } },
        ""
      );
      io.emit("receive_message", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log(`${socket.username} Disconnected!!`);
    connectedUsers.delete(socket.userId);
    delete userSockets[socket.id];
  });

  // To check outgoing emitting events
  socket.onAnyOutgoing((eventName, ...args) => {
    console.log("onAnyOutgoing", eventName);
  });

  // To check incoming events
  socket.onAny((eventName, ...args) => {
    console.log("incoming", eventName);
  });
});

// const jwt = require("jwt-then");

// io.use(async (socket, next) => {
//   try {
//     const token = socket.handshake.data.token;
//     const payload = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
//     socket.userId = payload.id;
//     socket.username = payload.name;
//     next();
//   } catch (err) {}
// });

// io.on("connection", (socket) => {
//   console.log(`${socket.username} Connected!!`);

//   socket.on("disconnect", () => {
//     console.log(`${socket.username} Disconnected!!`);
//   });

//   socket.on("joinRoom", ({ chatroomId }) => {
//     socket.join(chatroomId);
//     console.log("A user joined chatroom: " + chatroomId);
//   });

//   socket.on("leaveRoom", ({ chatroomId }) => {
//     socket.leave(chatroomId);
//     console.log("A user left chatroom: " + chatroomId);
//   });

//   socket.on("chatroomMessage", async ({ chatroomId, message }) => {
//     if (message.trim().length > 0) {
//       const user = await User.findOne({ _id: socket.userId });
//       const newMessage = new Message({
//         chatroom: chatroomId,
//         user: socket.userId,
//         message,
//       });
//       io.to(chatroomId).emit("newMessage", {
//         message,
//         name: user.name,
//         userId: socket.userId,
//       });
//       await newMessage.save();
//     }
//   });
// });
