import express from "express";
import { noteImagesUploadMiddleware } from "../../multer/multer.configuration.js";
import * as noteController from "../controller/note.controller.js";
import { authenticationMiddleware } from "../../middleware/authentication.middleware.js";

const router = express.Router();

router.post("/",authenticationMiddleware, noteImagesUploadMiddleware, noteController.createNote);
router.put("/:noteId",authenticationMiddleware, noteImagesUploadMiddleware, noteController.updateNoteContent);
router.get("/:noteId",authenticationMiddleware, noteController.fetchNoteById);
router.delete("/:noteId",authenticationMiddleware, noteController.removeNote);
router.get("/",authenticationMiddleware, noteController.listUserNotes);

export default router;
 