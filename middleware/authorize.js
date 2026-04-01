const ROLE_PERMISSIONS = {
  VIEWER: ["dashboard:read"],

  ANALYST: [
    "record:read",
    "dashboard:read",
  ],

  ADMIN: [
    "record:create",
    "record:read",
    "record:update",
    "record:delete",
    "user:manage",
    "dashboard:read",
  ],
};

export const authorize = (permission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.status === "INACTIVE") {
      return res.status(403).json({ error: "Inactive user" });
    }

    const allowed = ROLE_PERMISSIONS[user.role] || [];

    if (!allowed.includes(permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};