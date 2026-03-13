import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "";

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
      const token = req.headers.authorization?.split(" ")[1]; // Authorization: Bearer <token>
      
    if (!token) {
      return res.status(401).json({
        msg: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    req.userId = decoded.userId;
    req.email = decoded.email;

    next();
  } catch (error) {
    return res.status(401).json({
      msg: "Invalid token",
    });
  }
};