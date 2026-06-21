export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
}

export function errorHandler(
  err,
  req,
  res,
  next
) {
  console.error(err);

  if (
    err.message &&
    err.message.includes("Origin not allowed")
  ) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(
    err.statusCode || 500
  ).json({
    success: false,
    message:
      err.message ||
      "Internal server error",
  });
}