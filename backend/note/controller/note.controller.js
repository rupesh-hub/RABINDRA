import { Note } from "../model/note.model.js";
import {
  deleteFile,
  fullFilePath,
  noteImagePath,
} from "../../multer/file-management.js";

export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const createdBy = req.user.userId;

    // Enhanced Validation
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (title.length > 100) {
      return res
        .status(400)
        .json({ message: "Title must be under 100 characters" });
    }

    // Optional image handling with validation
    const images = req.files
      ? req.files.map((file) => {
          // Validate file types and sizes
          const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
          const maxFileSize = 5 * 1024 * 1024; // 5MB

          if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Invalid file type: ${file.originalname}`);
          }

          if (file.size > maxFileSize) {
            throw new Error(`File too large: ${file.originalname}`);
          }

          return noteImagePath(file.filename);
        })
      : [];

    const newNote = new Note({
      title: title.trim(),
      content: content ? content.trim() : "",
      images,
      createdBy,
      modifiedBy: createdBy,
      status: "active",
    });

    const savedNote = await newNote.save();

    res.status(201).json({
      message: "Note created successfully",
      data: savedNote,
    });
  } catch (error) {
    console.error("Error creating note:", error);

    // Clean up uploaded files in case of error
    if (req.files) {
      req.files.forEach((file) => {
        const fullPath = fullFilePath("notes", file.filename);
        deleteFile(fullPath);
      });
    }

    res.status(500).json({
      message: "Error creating note",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateNoteContent = async (req, res) => {
  const { title, content, images: existingImages } = req.body;
  const { noteId } = req.params;
  const modifiedBy = req.user.userId;

  try {
    const note = await Note.findOne({ _id: noteId, createdBy: modifiedBy });
    if (!note)
      return res
        .status(404)
        .json({ message: "Note not found or unauthorized" });

    // Validate input
    if (title && (title.trim() === "" || title.length > 100)) {
      return res.status(400).json({ message: "Invalid title" });
    }

    const uploadedFiles = req.files
      ? req.files.map((file) => {
          // Validate file types and sizes
          const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
          const maxFileSize = 5 * 1024 * 1024; // 5MB

          if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Invalid file type: ${file.originalname}`);
          }

          if (file.size > maxFileSize) {
            throw new Error(`File too large: ${file.originalname}`);
          }

          return noteImagePath(file.filename);
        })
      : [];

    // Ensure existingImages is an array
    const allImages = Array.isArray(existingImages)
      ? existingImages
      : existingImages
      ? [existingImages]
      : [];

    // Determine images to delete
    const imagesToDelete = note.images.filter(
      (img) => !allImages.includes(img)
    );

    // Delete obsolete images
    imagesToDelete.forEach((imagePath) => {
      const fullPath = fullFilePath("notes", imagePath.split("/").pop());
      deleteFile(fullPath);
    });

    // Merge images
    const updatedImages = [
      ...allImages.filter((img) => !uploadedFiles.includes(img)),
      ...uploadedFiles,
    ];

    // Update note fields
    note.title = title?.trim() || note.title;
    note.content = content?.trim() || note.content;
    note.images = updatedImages;
    note.modifiedBy = modifiedBy;

    const updatedNote = await note.save();

    res.status(200).json({
      message: "Note updated successfully",
      data: updatedNote,
    });
  } catch (error) {
    console.error("Error updating note:", error);

    // Clean up uploaded files in case of error
    if (req.files) {
      req.files.forEach((file) => {
        const fullPath = fullFilePath("notes", file.filename);
        deleteFile(fullPath);
      });
    }

    res.status(500).json({
      message: "Error updating note",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const fetchNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.userId;

    const note = await Note.findOne({
      _id: noteId,
      $or: [
        { createdBy: userId },
      ],
    })
      .populate({
        path: "createdBy",
        select: "firstName lastName email profile",
      })
      .populate({
        path: "modifiedBy",
        select: "firstName lastName email profile",
      });

    if (!note)
      return res
        .status(404)
        .json({ message: "Note not found or unauthorized" });

    // Safely handle profile image paths
    const processUserProfile = (user) => {
      if (user && user.profile) {
        return {
          ...user.toObject(),
          profile: `${process.env.API_URL}/uploads/profiles/${user.profile}`,
        };
      }
      return user;
    };

    const processedNote = {
      ...note.toObject(),
      createdBy: processUserProfile(note.createdBy),
      modifiedBy: processUserProfile(note.modifiedBy),
    };

    if (processedNote.images && Array.isArray(processedNote.images)) {
      processedNote.images = processedNote.images.map(image => `${process.env.API_URL}${image}`);
    }

    res.status(200).json({
      success: true,
      data: processedNote,
    });
  } catch (error) {
    console.error("Error fetching note details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching note details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const removeNote = async (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.user;

  try {
    const note = await Note.findOne({
      _id: noteId,
      createdBy: userId,
    });

    if (!note)
      return res
        .status(404)
        .json({ message: "Note not found or unauthorized" });

    // Delete associated images
    note.images.forEach((imagePath) => {
      const fullPath = fullFilePath("notes", imagePath.split("/").pop());
      deleteFile(fullPath);
    });

    // Hard delete
    await Note.findByIdAndDelete(noteId);

    res.status(200).json({
      message: "Note deleted successfully",
      data: {
        _id: noteId,
      },
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({
      message: "Error deleting note",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const listUserNotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const userId = req.user.userId;

    // Build comprehensive filter
    const filter = {
      $or: [{ createdBy: userId }],
      status: status || "active",
    };

    // Advanced search across title and content
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Fetch notes from the database
    const notes = await Note.find(filter)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort(sortOptions)
      .select("title content createdAt updatedAt status images")
      .lean();

    // Append the base URL to each image in the notes
    notes.forEach(note => {
      if (note.images && Array.isArray(note.images)) {
        note.images = note.images.map(image => `${process.env.API_URL}${image}`);
      }
    });

    // Get total number of notes matching the filter
    const totalNotes = await Note.countDocuments(filter);
    const totalPages = Math.ceil(totalNotes / Number(limit));

    res.status(200).json({
      data: notes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages,
        totalNotes,
      },
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({
      message: "Error fetching notes",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
