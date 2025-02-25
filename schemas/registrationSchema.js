const Joi = require("joi");

const registrationSchema = Joi.object({
  password: Joi.string().required(),
  email: Joi.string().email().required(),
  avatarUrl: Joi.string(),
});

module.exports = registrationSchema;
