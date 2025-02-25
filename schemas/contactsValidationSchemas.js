const Joi = require("joi");

const contactsValidationSchemas = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
  favorite: Joi.boolean(),
  avatarUrl: Joi.string(),
});

module.exports = contactsValidationSchemas;
