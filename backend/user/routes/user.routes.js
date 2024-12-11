import express from "express";
const router = express.Router();
import { authenticationMiddleware } from "../../middleware/authentication.middleware.js";
import {
  profile,
  changeProfilePicture,
  updateProfile,
} from "../controller/user.controller.js";

router.get("/profile", authenticationMiddleware, profile);
router.put(
  "/change-profile-picture",
  authenticationMiddleware,
  changeProfilePicture
);
router.put("/update-profile", authenticationMiddleware, updateProfile);

export default router;
