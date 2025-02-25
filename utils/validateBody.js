const newHttpError = require("../helpers/HttpError.js");

const validateBody = (schema) => {
  const func = async (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      next(newHttpError(400, `missing fields`));
    }
    next();
  };
  return func;
};

module.exports = validateBody;
