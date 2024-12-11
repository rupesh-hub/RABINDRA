import express from "express";

import {
  authenticate,
  logout,
  register,
} from "../controller/auth.controller.js";

import { authenticationMiddleware } from "../../middleware/authentication.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", authenticate);
router.post("/logout", authenticationMiddleware, logout);

export default router;
