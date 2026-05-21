import { UserModel } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// ================= REGISTER =================
export const register = async (userObj) => {

  try {

    // check existing user
    const existingUser = await UserModel.findOne({
      email: userObj.email
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // hash password
    const hashedPassword = await bcrypt.hash(
      userObj.password,
      10
    );

    // create user
    const newUser = new UserModel({
      ...userObj,
      password: hashedPassword
    });

    // save user
    const savedUser = await newUser.save();

    // remove password from response
    const { password, ...userWithoutPassword } =
      savedUser.toObject();

    return userWithoutPassword;

  } catch (err) {

    console.log("REGISTER ERROR:", err);

    throw err;
  }
};


// ================= AUTHENTICATE =================
export const authenticate = async (userCred) => {

  try {

    const { email, password } = userCred;

    console.log("LOGIN EMAIL:", email);

    // find user
    const user = await UserModel.findOne({ email });

    console.log("USER FOUND:", user);

    // user not found
    if (!user) {
      throw new Error("User not found");
    }

    // compare passwords
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    console.log("PASSWORD MATCH:", isPasswordValid);

    // invalid password
    if (!isPasswordValid) {
      throw new Error("Wrong password");
    }

    // generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || "your_secret_key",
      {
        expiresIn: "1h"
      }
    );

    // remove password before sending
    const { password: _, ...userWithoutPassword } =
      user.toObject();

    return {
      token,
      user: userWithoutPassword
    };

  } catch (err) {

    console.log("AUTHENTICATION ERROR:", err);

    throw err;
  }
};