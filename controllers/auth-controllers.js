const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const jwt = require("jsonwebtoken");
const path = require("path");

const resizeAvatar = require("../middlwares/resizeAvatar");

const { SECRET_KEY } = process.env;

const { ctrlWrapper } = require("../utils");

const User = require("../models/user");

const { newHttpError } = require("../helpers");

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const registerUser = async (req, res, next) => {
  const { email, password } = req.body;
  const avatarUrl = gravatar.url(email);
  const user = await User.findOne({ email });
  if (user) {
    throw newHttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const result = await User.create({
    ...req.body,
    password: hashPassword,
    avatarUrl,
  });
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

module.exports = {
  registerUser: ctrlWrapper(registerUser),
  loginUser: ctrlWrapper(loginUser),
  logoutUser: ctrlWrapper(logoutUser),
  getCurrent: ctrlWrapper(getCurrent),
  updateAvatar: ctrlWrapper(updateAvatar),
};
