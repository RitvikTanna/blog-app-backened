import { UserModel } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register new user
export const register = async (userObj) => {
  // Check if user already exists
  const existingUser = await UserModel.findOne({ email: userObj.email });
  
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userObj.password, 10);

  // Create new user
  const newUser = new UserModel({
    ...userObj,
    password: hashedPassword
  });

  // Save to database
  const savedUser = await newUser.save();

  // Return user without password
  const { password, ...userWithoutPassword } = savedUser.toObject();
  return userWithoutPassword;
};

// Authenticate user (login)
export const authenticate = async (userCred) => {
  const { email, password } = userCred;

  // Find user by email
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "your_secret_key",
    { expiresIn: "1h" }
  );

  // Return token and user data (without password)
  const { password: _, ...userWithoutPassword } = user.toObject();
  
  return {
    token,
    user: userWithoutPassword
  };
};
