const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandler");
const messageController = require("../controllers/msgController");

router.post("/sendMessages", catchErrors(messageController.sendMessage));
router.post("/addMessage", catchErrors(messageController.addMessage));
router.get("/getSideBarMessagesById", catchErrors(messageController.getSideBarMessagesById));
router.get("/getMessagesByUsers", catchErrors(messageController.getMessagesByUsers));
router.get("/deleteMessage", catchErrors(messageController.deleteMessage));

module.exports = router;