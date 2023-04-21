const gravatar = require("gravatar");
const fs = require("fs/promises");
const path = require("path");

const resizeAvatar = require("../middlwares/resizeAvatar");

const { ctrlWrapper } = require("../utils");
const Contact = require("../models/contact");
const { newHttpError } = require("../helpers");

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const listContacts = async (req, res, next) => {
  const { _id: owner } = req.user;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  const result = await Contact.find({ owner }, "-createdAt -updatedAt", {
    skip,
    limit,
  }).populate("owner", "name email");
  res.json(result);
};

const getContactById = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findById(contactId);
  if (!result) {
    throw newHttpError(404, "Not found");
  }
  res.json(result);
};

const addContact = async (req, res, next) => {
  const { _id: owner } = req.user;
  const { email } = req.body;
  const avatarUrl = gravatar.url(email);
  const contact = await Contact.findOne({ email });

  if (contact) {
    throw newHttpError(409, "Email already in use");
  }

  const result = await Contact.create({
    ...req.body,
    owner,
    avatarUrl,
  });

  res.status(201).json(result);
};

const removeContact = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.deleteOne({
    _id: contactId,
  });
  if (!result) {
    throw newHttpError(404, `Not found`);
  }
  return res.json({ message: "contact deleted" });
};

const updateContact = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findByIdAndUpdate(contactId, req.body, {
    new: true,
  });
  res.json(result);
};

const updateStatusContact = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findByIdAndUpdate(contactId, req.body, {
    new: true,
  });
  res.json(result);
};

const updateAvatar = async (req, res, next) => {
  const { _id } = req.body;
  const { path: tempUpload, filename } = req.file;
  console.log(tempUpload);
  const avatarName = `${_id}_${filename}`;
  const resultUpload = path.join(avatarsDir, filename);
  await resizeAvatar(tempUpload);
  await fs.rename(tempUpload, resultUpload);
  const avatarUrl = path.join("avatar", avatarName);
  await Contact.findByIdAndUpdate(_id, { avatarUrl });

  res.json({ avatarUrl });
};

module.exports = {
  listContacts: ctrlWrapper(listContacts),
  getContactById: ctrlWrapper(getContactById),
  addContact: ctrlWrapper(addContact),
  removeContact: ctrlWrapper(removeContact),
  updateContact: ctrlWrapper(updateContact),
  updateStatusContact: ctrlWrapper(updateStatusContact),
  updateAvatar: ctrlWrapper(updateAvatar),
};
