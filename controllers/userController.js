const User = require("../models/Users");
const sha256 = require("js-sha256");
const jwt = require("jwt-then");
const constants = require("../service/constants");

exports.register = async (req, res) => {
  try {
    const { emailId, password, firstName, role, lastName, phone, profilePic } =
      req.body;
    if (!emailId || !password || !firstName || !role) {
      throw new Error("All fields are mandatory!");
    }
    const checkUser = await User.findOne({ emailId });
    if (checkUser) {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("User already exists!");
    } else {
      // Hashed Password
      const hashedPassword = sha256(password + process.env.SALT);
      const userData = {
        emailId,
        password: hashedPassword,
        firstName,
        lastName: lastName ? lastName : "",
        role,
        phone: phone ? phone.replace(/[- ]/g, "") : "",
        profilePic: profilePic ? profilePic : "",
      };
      const createUser = await User.create(userData);
      if (createUser) {
        res
          .status(constants.responseStatusCode.created)
          .json({
            info: constants.successCode,
            message: `The User ${createUser.firstName} is created`,
            userId: createUser._id,
            emailId: createUser.emailId,
          });
      } else {
        res.status(400);
        throw new Error("User not created");
      }
    }
  } catch (error) {
    res.status(constants.responseStatusCode.internalServerError);
    throw new Error("Internal Server Error");
  }
};

exports.login = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({
      emailId,
      password: sha256(password + process.env.SALT),
    });

    if (!user) {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("Invalid email or password");
    }
    const token = await jwt.sign(
      { id: user.id, name: user.firstName },
      process.env.ACCESS_TOKEN_SECRET_KEY
    );

    res
      .status(constants.responseStatusCode.created)
      .json({
        info: constants.successCode,
        message: `The User ${user.firstName} Logged In...`,
        token,
        userId: user.id,
      });
  } catch (error) {
    res.status(constants.responseStatusCode.internalServerError);
    throw new Error("Internal Server Error");
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const user = await User.find();
    if (user) {
      res
        .status(constants.responseStatusCode.success)
        .json({ info: constants.successCode, message: `The User List`, user });
    } else {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(constants.responseStatusCode.internalServerError);
    throw new Error("Internal Server Error");
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.query.id);
    if (user) {
      res
        .status(constants.responseStatusCode.success)
        .json({ info: constants.successCode, message: `The User`, user });
    } else {
      res.status(constants.responseStatusCode.badRequest);
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(constants.responseStatusCode.internalServerError);
    throw new Error("Internal Server Error");
  }
};

// module.exports   = { register, login };
