const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: "Sender is required!",
    ref: "User",
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: "Receiver is required!",
    ref: "User",
  },
  isSent:{
    type: Boolean,
    default: false,
  },
  isRecieved:{
    type: Boolean,
    default: false,
  },
  isSeen:{
    type: Boolean,
    default: false,
  },
  unread:{
    type: Boolean,
    default: true,
  },
  message: {
    type: String,
    required: "Message is required!",
  },
  isDeleted:{
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Message", messageSchema);