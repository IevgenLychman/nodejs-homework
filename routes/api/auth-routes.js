const express = require("express");
const router = express.Router();

const ctrl = require("../../controllers/auth-controllers");
const { validateBody } = require("../../utils/index.js");
const schemas = require("../../schemas/index.js");
const { authenticate, upload } = require("../../middlwares");

router.post(
  "/register",
  validateBody(schemas.registrationSchema),
  ctrl.registerUser
);

router.post("/login", validateBody(schemas.loginSchema), ctrl.loginUser);

router.post("/logout", authenticate, ctrl.logoutUser);

router.get("/current", authenticate, ctrl.getCurrent);

router.get("/verify/:verificationToken", ctrl.verifyEmail);

router.post(
  "/resend-verify-email",
  validateBody(schemas.emailSchema),
  ctrl.resendVerifyEmail
);

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  ctrl.updateAvatar
);

module.exports = router;
