import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  login,
} from "../controllers/user.controller.js";

import { authorize } from "../middleware/authorize.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", optionalAuthenticate, login);

router.use(authenticate);
router.post("/", authorize("user:manage"), createUser);
router.get("/", authorize("user:manage"), getUsers);
router.get("/:id", authorize("user:manage"), getUserById);
router.patch("/:id", authorize("user:manage"), updateUser);
router.delete("/:id", authorize("user:manage"), deactivateUser);

export default router;