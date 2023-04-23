const express = require("express");
const router = express.Router();

const ctrl = require("../../controllers/contacts-controllers.js");
const { validateBody } = require("../../utils");
const schemas = require("../../schemas");
const { authenticate, upload } = require("../../middlwares/");

router.get("/", authenticate, ctrl.listContacts);

router.get("/:contactId", authenticate, ctrl.getContactById);

router.post(
  "/",
  authenticate,
  validateBody(schemas.contactsValidationSchemas),
  ctrl.addContact
);

router.delete("/:contactId", authenticate, ctrl.removeContact);

router.put(
  "/:contactId",
  authenticate,
  validateBody(schemas.contactsValidationSchemas),
  ctrl.updateContact
);

router.patch(
  "/:contactId/favorite",
  authenticate,
  validateBody(schemas.favoriteUpdateSchemas),
  ctrl.updateStatusContact
);

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  ctrl.updateAvatar
);

module.exports = router;
