import { User } from "../model/user.model.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../../util/generate-token-and-set-cookie.js";
import { profileUpload } from "../../multer/multer.configuration.js";
import fs from "fs";
import multer from "multer";

export const register = async (req, res) => {
  profileUpload(req, res, async (error) => {
    try {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: "File upload error: " + error.message,
        });
      } else if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword
      } = req.body;

      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "All fields are required.",
        });
      }

      if(password != confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match.",
        });
      }

      const isEmailAlreadyUsed = await User.findOne({ email });
      if (isEmailAlreadyUsed) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Email already in use.",
        });
      }

      // Hash the password
      const hashPassword = await bcryptjs.hash(password, 10);

      const user = new User({
        firstName,
        lastName,
        email,
        password: hashPassword,
        profile: req.file ? req.file.filename : null,
      });

      await user.save();
      res.status(201).json({
        success: true,
        message: "User registered successfully.",
        user: {
          ...user._doc,
          profile: user.profile ? `/uploads/profiles/${user.profile}` : null,
          password: undefined,
        },
      });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message,
      });
    }
  });
};

export const authenticate = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }
    const token = generateTokenAndSetCookie(res, user);

    await user.save();

    const response = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.firstName + " " + user.lastName,
      email: user.email,
      profile: `${process.env.API_URL}/uploads/profiles/${user.profile}`,
    };

    res.json({
      success: true,
      message: "Login successful",
      access_token: token,
      user: response,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const logout = (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

