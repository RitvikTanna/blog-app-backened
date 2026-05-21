import exp from "express";
import bcrypt from "bcryptjs";

import { authenticate } from "../services/authService.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { UserModel } from "../models/userModel.js";

export const commonRouter = exp.Router();


// ================= LOGIN =================
commonRouter.post("/login", async (req, res) => {

  try {

    // get user credentials
    let userCred = req.body;

    console.log("LOGIN DATA:", userCred);

    // authenticate user
    let { token, user } = await authenticate(userCred);

    // save token as httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    // send response
    res.status(200).json({
      message: "login success",
      payload: user
    });

  } catch (err) {

    console.log("LOGIN ERROR:", err);

    res.status(400).json({
      message: err.message || "Login failed"
    });
  }
});


// ================= LOGOUT =================
commonRouter.get("/logout", (req, res) => {

  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.status(200).json({
    message: "Logged out successfully"
  });
});


// ================= CHANGE PASSWORD =================
commonRouter.put(
  "/change-password",
  verifyToken("USER", "AUTHOR", "ADMIN"),
  async (req, res) => {

    try {

      // get request data
      const {
        email,
        currentPassword,
        newPassword
      } = req.body;

      // prevent same password
      if (currentPassword === newPassword) {
        return res.status(400).json({
          message:
            "newPassword must be different from currentPassword"
        });
      }

      // find account
      const account = await UserModel.findOne({ email });

      if (!account) {
        return res.status(404).json({
          message: "Account not found"
        });
      }

      // verify current password
      const isMatch = await bcrypt.compare(
        currentPassword,
        account.password
      );

      if (!isMatch) {
        return res.status(401).json({
          message: "Current password is incorrect"
        });
      }

      // hash new password
      account.password = await bcrypt.hash(
        newPassword,
        10
      );

      await account.save();

      res.status(200).json({
        message: "Password changed successfully"
      });

    } catch (err) {

      console.log("CHANGE PASSWORD ERROR:", err);

      res.status(500).json({
        message: err.message || "Something went wrong"
      });
    }
  }
);


// ================= CHECK AUTH =================
commonRouter.get(
  "/check-auth",
  verifyToken("USER", "AUTHOR", "ADMIN"),
  async (req, res) => {

    try {

      res.status(200).json({
        message: "is authorized",
        payload: req.user
      });

    } catch (err) {

      console.log("CHECK AUTH ERROR:", err);

      res.status(500).json({
        message: err.message || "Something went wrong"
      });
    }
  }
);