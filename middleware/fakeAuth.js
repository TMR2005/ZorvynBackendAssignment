export const fakeAuth = (req, res, next) => {
  const role = req.headers["x-role"] || "VIEWER";
  const userId = req.headers["x-user-id"] || "default-user";
  const status = req.headers["x-user-status"] || "ACTIVE";

  req.user = {
    id: userId,
    role,
    status,
  };

  next();
};