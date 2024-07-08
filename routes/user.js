const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandler");
const userController = require("../controllers/userController");

router.post("/login", catchErrors(userController.login));
router.post("/register", catchErrors(userController.register));
router.get("/", catchErrors(userController.getAllUser));
router.get("/getUserById", catchErrors(userController.getUserById));

module.exports = router;
