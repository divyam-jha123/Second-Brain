import { Router, Request, Response } from "express";
import { genSaltSync, hashSync, compareSync } from "bcrypt-ts";
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { authMiddleware , AuthRequest } from '../middlewares/auth.js';

dotenv.config();

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || '';
const salt = genSaltSync(10);

// Signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        msg: "Please provide username, email and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        msg: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = hashSync(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      msg: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      msg: "Error creating user",
      error,
    });
  }
});

// Signin
router.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Please provide email and password",
      });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      msg: "Signin successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      msg: "Error signing in",
      error,
    });
  }
});

// Get current user (protected route)
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {  // ✅ Use AuthRequest
  try {
    const userId = req.userId;  // ✅ Get from req.userId (set by middleware)

    if (!userId) {
      return res.status(401).json({
        msg: "User not authenticated",
      });
    }

    const user = await User.findById(userId).select("-password");  // ✅ Added await, fixed query, exclude password

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    return res.json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error fetching user",
      error,
    });
  }
});

export default router;