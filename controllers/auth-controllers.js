const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const jwt = require("jsonwebtoken");
const path = require("path");
const { nanoid } = require("nanoid");

const resizeAvatar = require("../middlwares/resizeAvatar");

const { SECRET_KEY } = process.env;

const { ctrlWrapper } = require("../utils");

const User = require("../models/user");

const { newHttpError, sendEmail } = require("../helpers");

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const registerUser = async (req, res, next) => {
  const { email, password } = req.body;
  const avatarUrl = gravatar.url(email);
  const verificationToken = nanoid();
  const user = await User.findOne({ email });
  if (user) {
    throw newHttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const result = await User.create({
    ...req.body,
    password: hashPassword,
    avatarUrl,
    verificationToken,
  });

  console.log(email);

  const verifyEmail = {
    to: email,
    subject: "Sending with SendGrid is Fun",
    text: "and easy to do anywhere, even with Node.js",
    html: `<a href="http://localhost:3000/api/users/verify/${verificationToken}">Please confirm your email</a>`,
  };

  await sendEmail(verifyEmail);

  res
    .status(201)
    .json({ email: result.email, subscription: result.subscription });
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw newHttpError(401, "Email or password is wrong");
  }

  if (!user.verify) {
    throw newHttpError(401, "Email not verified");
  }

  const userCompare = await bcrypt.compare(password, user.password);
  if (!userCompare) {
    throw newHttpError(401, "Email or password is wrong");
  }

  const payload = { id: user._id };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
  });
};

const logoutUser = async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: " " });
  res.json({ message: "Logout success" });
};

const getCurrent = async (req, res, next) => {
  try {
    const { email, subscription } = req.user;

    res.json({
      email,
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  const { _id } = req.user;
  const { path: tempUpload, filename } = req.file;
  const avatarName = `${_id}_${filename}`;
  const resultUpload = path.join(avatarsDir, filename);
  await resizeAvatar(tempUpload);
  await fs.rename(tempUpload, resultUpload);
  const avatarUrl = path.join("avatar", avatarName);
  await User.findByIdAndUpdate(_id, { avatarUrl });

  res.json({ avatarUrl });
};

const verifyEmail = async (req, res, next) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw newHttpError(404, "Email not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });

  res.json({
    message: "Email verify success",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw newHttpError(404, "Email not found");
  }
  if (user.verify) {
    throw newHttpError(400, "Email already verify");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a href="http://localhost:3000/api/users/verify/${user.verificationToken}">Please confirm your email</a>`,
  };

  await sendEmail(verifyEmail);

  res.json({
    message: "Email resend success",
  });
};

module.exports = {
  registerUser: ctrlWrapper(registerUser),
  loginUser: ctrlWrapper(loginUser),
  logoutUser: ctrlWrapper(logoutUser),
  getCurrent: ctrlWrapper(getCurrent),
  updateAvatar: ctrlWrapper(updateAvatar),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
};
