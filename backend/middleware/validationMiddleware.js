const validatePositiveIntegerParam = (
  paramName = "id",
  label = "ID"
) => {
  return (req, res, next) => {
    const value = Number(req.params[paramName]);

    if (!Number.isInteger(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: `A valid ${label} is required`,
      });
    }

    next();
  };
};

module.exports = {
  validatePositiveIntegerParam,
};