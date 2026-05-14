import { UserModel } from "../models/userModel.js";

export const checkAdmin = async (req, res, next) => {
  try {
    // Get user ID from token (set by verifyToken middleware)
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Verify admin user
    const admin = await UserModel.findById(userId);
    
    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    
    // Check if user role is ADMIN
    if (admin.role !== "ADMIN") {
      return res.status(403).json({ message: "User is not an Admin" });
    }
    
    // Check if admin account is active
    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin account is not active" });
    }
    
    // Forward request to next middleware/route
    next();
  } catch (err) {
    next(err);
  }
};
