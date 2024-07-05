const Message = require('../models/Message');
const constants = require('../service/constants');
const mongoose = require('mongoose');
const { cloneDeep } = require('lodash');

exports.addMessage = async (req, res) => {
  try {
    const { message, senderId, receiverId, isRecieved } = req.body;
    if(!message || !senderId || !receiverId) {
      res && res.status(constants.responseStatusCode.badRequest).json({
        info: constants.failureCode,
        message: err,
      });
      return {error: 'Mandatory fields are missing'};
    }
    const msg = { 
      message, 
      senderId, 
      receiverId,
      isSent: true,
      isRecieved: isRecieved ? isRecieved : false,
    };
    const msgDetails = await Message.create(msg);
    if(msgDetails) {
      res && res.status(constants.responseStatusCode.created).json({info: constants.successCode, message: `The Message is created`, msgDetails});
      return JSON.parse(JSON.stringify(msgDetails));
    } else {
      res && res.status(constants.responseStatusCode.badRequest).json({
        info: constants.failureCode,
        message: 'Message not created',
      });
      return {error: 'Message not created'};
    }
  } catch (error) {
    res && res.status(constants.responseStatusCode.internalServerError).json({
      info: constants.failureCode,
      message: error.message,
    });
    return {error: error.message};
  }
};
  
exports.getSideBarMessagesById = async (req, res) => {
  try {
    const userId = req.query.id;
    if(!userId) {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("User Id is mandatory!");
    }
    const senderMessages = await Message.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $match: {
          receiverId: mongoose.Types.ObjectId(userId),  // Convert userId to ObjectId
          isDeleted: false
        }
      },
      {
        $sort: { createdAt: -1 }  // Sort messages by createdAt in descending order
      }
    ]);
  
    const receiverMessages = await Message.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "receiverId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $match: {
          senderId: mongoose.Types.ObjectId(userId),  // Convert userId to ObjectId
          isDeleted: false
        }
      },
      {
        $sort: { createdAt: -1 }  // Sort messages by createdAt in descending order
      }
    ]);
    let messages = [...senderMessages, ...receiverMessages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if(messages) {
      messages = JSON.parse(JSON.stringify(messages));
      const slideMsg = new Set();
      messages.map((msg) => {
        const id = msg.receiverId !== userId ? msg.receiverId : msg.senderId;
        slideMsg.add(id);
      });
      // const unseenMsgCount = 0;
      // if(msg.receiverId === userId && !msg.isSeen) {
      //   unseenMsgCount++;
      // }
      const msgList = [];
      messages.map((message) => {
        const id = slideMsg.has(message.senderId) ? message.senderId : slideMsg.has(message.receiverId) ? message.receiverId : null;
        if(id) {
          msgList.push(message);
          slideMsg.delete(id);  
        }
      })
      res.status(constants.responseStatusCode.success).json({info: constants.successCode, message: `The Message List`, messages: msgList});
    } else {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("Message not found");
    }
  } catch (error) {
    res.status(constants.responseStatusCode.internalServerError);
    throw new Error("Internal Server Error");
  }
  
};

exports.updateMsgStatus = async ({messageId, isSeen, isRecieved}) => {
  try {
    if(!messageId) {
      return false;
    }
    const message = await Message.findOneAndUpdate(
      { _id: messageId },  // Query to find the document by its ID
      { $set: { isSeen, isRecieved } },  // Update operation to set `isSeen` to true
      { new: true }  // Options: return the updated document
    );
    if(message) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    if(!messageId) {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("Message Id is mandatory!");
    }
    const message = await Message.findOneAndUpdate(
      { _id: messageId },  // Query to find the document by its ID
      { $set: { isDeleted: true } },  // Update operation to set `isDeleted` to true
      { new: true }  // Options: return the updated document
    );
    if(message) {
      res.status(constants.responseStatusCode.success).json({info: constants.successCode, message: `The Message is deleted`, message});
    } else {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("Message not found");
    }
  } catch (error) {
    res.status(constants.responseStatusCode.internalServerError);
    throw new Error("Internal Server Error");
  }
};

exports.getMessagesByUsers = async (req, res) => {
  try {
    const { userId, receiverId } = req.query;
    if(!userId || !receiverId) {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("User Id and Participant Id are mandatory!");
    }
    let messages = await Message.find(
      {
        $or: [
          { senderId: mongoose.Types.ObjectId(userId), receiverId: mongoose.Types.ObjectId(receiverId), isDeleted: false },
          { senderId: mongoose.Types.ObjectId(receiverId), receiverId: mongoose.Types.ObjectId(userId), isDeleted: false }
        ]
      }
    ).sort({ createdAt: 1 });  // Sort messages by createdAt in ascending order
    // .sort({ createdAt: -1 }) // Fetch last 50 messages in descending order
    // .limit(50);
    // Reverse the order for displaying in ascending order
    // const sortedMessages = messages.reverse();
    if(messages && messages.length > 0) {
      const unseenMsgIds = [];
      messages = JSON.parse(JSON.stringify(messages));
      messages = messages.map((msg) => {
        if(msg.receiverId === userId && !msg.isSeen) {
          unseenMsgIds.push(msg._id);
          msg.isRecieved = true;
          msg.isSeen = true;
          return {...msg}; 
        }
        return {...msg};
      });
      if (unseenMsgIds.length) {
        await Message.updateMany(
            { _id: { $in: unseenMsgIds } },
            { $set: { isReceived: true, isSeen: true } }
        );
      }
      res.status(constants.responseStatusCode.success).json({info: constants.successCode, message: `The Message List`, messages});
    } else {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("Message not found");
    }
  } catch (error) {
    res.status(constants.responseStatusCode.internalServerError);
    throw new Error("Internal Server Error");
  }
};