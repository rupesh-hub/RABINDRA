import { User } from "../model/user.model.js";
import { profileUpload } from "../../multer/multer.configuration.js";
import path from "path";
import { deleteFile } from "../../multer/file-management.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profiles");

export const profile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user." });
    }

    const profile = await User.findOne({ email: user.email });

    if (!profile) {
      res
        .status(404)
        .success(false)
        .message("User not exists database.")
        .timestamp(new Date());
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: profile.userId,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        name: profile.firstName + " " + profile.lastName,
        profile: `${process.env.API_URL}/uploads/profiles/${profile.profile}`,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const { email } = req.user;

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName.",
      });
    }

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { firstName, lastName, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Profile update success.",
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: updatedUser.firstName + " " + updatedUser.lastName,
        email: updatedUser.email,
        profile: updatedUser.profile
          ? `${process.env.API_URL}/uploads/profiles/${updatedUser.profile}`
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile.",
    });
  }
};

export const changeProfilePicture = async (req, res) => {
  profileUpload(req, res, async (error) => {
    try {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        if (req.file) deleteFile(path.join(UPLOAD_DIR, req.file.filename));
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Delete old profile picture if it exists
      if (user.profile) {
        const oldFilePath = path.join(UPLOAD_DIR, user.profile);
        deleteFile(oldFilePath);
      }

      // Save the new profile picture path
      user.profile = req.file.filename;
      user.updatedAt = new Date();
      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile picture updated successfully.",
        profile: user.profile ? `${process.env.API_URL}/uploads/profiles/${user.profile}` : null,
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({
        success: false,
        message: "Server error while changing profile picture.",
      });
    }
  });
};
