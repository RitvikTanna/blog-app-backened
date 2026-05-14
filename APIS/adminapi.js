import exp from "express";
import { UserModel } from "../models/userModel.js";
import { ArticleModel } from "../models/articleModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkAdmin } from "../middlewares/checkAdmin.js";

export const adminRoute = exp.Router();

// ==================== USERS MANAGEMENT ====================

// Get all users
adminRoute.get("/users", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const users = await UserModel.find().select("-password");
    res.status(200).json({
      message: "Users fetched successfully",
      payload: users,
    });
  } catch (err) {
    next(err);
  }
});

// Get user by ID
adminRoute.get("/users/:id", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User fetched successfully",
      payload: user,
    });
  } catch (err) {
    next(err);
  }
});

// Delete user
adminRoute.delete("/users/:id", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User deleted successfully",
      payload: user,
    });
  } catch (err) {
    next(err);
  }
});

// Ban/Unban user
adminRoute.patch("/users/:id/status", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      payload: user,
    });
  } catch (err) {
    next(err);
  }
});

// ==================== ARTICLES MANAGEMENT ====================

// Get all articles (including inactive)
adminRoute.get("/articles", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const articles = await ArticleModel.find()
      .populate("author", "firstName lastName email profileImageUrl")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      message: "Articles fetched successfully",
      payload: articles,
    });
  } catch (err) {
    next(err);
  }
});

// Get article by ID
adminRoute.get("/articles/:id", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const article = await ArticleModel.findById(req.params.id)
      .populate("author", "firstName lastName email profileImageUrl")
      .populate("comments.userId", "firstName lastName profileImageUrl");
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    res.status(200).json({
      message: "Article fetched successfully",
      payload: article,
    });
  } catch (err) {
    next(err);
  }
});

// Approve/Reject article
adminRoute.patch("/articles/:id/status", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const { isArticleActive } = req.body;
    const article = await ArticleModel.findByIdAndUpdate(
      req.params.id,
      { isArticleActive },
      { new: true }
    ).populate("author", "firstName lastName email");
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    res.status(200).json({
      message: `Article ${isArticleActive ? "approved" : "rejected"} successfully`,
      payload: article,
    });
  } catch (err) {
    next(err);
  }
});

// Delete article
adminRoute.delete("/articles/:id", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const article = await ArticleModel.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.status(200).json({
      message: "Article deleted successfully",
      payload: article,
    });
  } catch (err) {
    next(err);
  }
});

// ==================== COMMENTS MANAGEMENT ====================

// Get all comments
adminRoute.get("/comments", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const articles = await ArticleModel.find()
      .populate("comments.userId", "firstName lastName email profileImageUrl");
    
    const allComments = [];
    articles.forEach(article => {
      article.comments.forEach(comment => {
        allComments.push({
          _id: comment._id,
          articleId: article._id,
          articleTitle: article.title,
          userId: comment.userId,
          comment: comment.comment,
        });
      });
    });
    
    res.status(200).json({
      message: "Comments fetched successfully",
      payload: allComments,
    });
  } catch (err) {
    next(err);
  }
});

// Delete comment
adminRoute.delete("/comments/:articleId/:commentId", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const { articleId, commentId } = req.params;
    
    const article = await ArticleModel.findByIdAndUpdate(
      articleId,
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    );
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    res.status(200).json({
      message: "Comment deleted successfully",
      payload: article,
    });
  } catch (err) {
    next(err);
  }
});

// ==================== ANALYTICS & STATISTICS ====================

// Get dashboard statistics
adminRoute.get("/stats/dashboard", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const activeUsers = await UserModel.countDocuments({ isActive: true });
    const authors = await UserModel.countDocuments({ role: "AUTHOR" });
    
    const totalArticles = await ArticleModel.countDocuments();
    const activeArticles = await ArticleModel.countDocuments({ isArticleActive: true });
    
    let totalComments = 0;
    const articles = await ArticleModel.find();
    articles.forEach(article => {
      totalComments += article.comments.length;
    });
    
    res.status(200).json({
      message: "Statistics fetched successfully",
      payload: {
        users: {
          total: totalUsers,
          active: activeUsers,
          authors: authors,
        },
        articles: {
          total: totalArticles,
          active: activeArticles,
        },
        comments: {
          total: totalComments,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get user statistics
adminRoute.get("/stats/users", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const users = await UserModel.find().select("firstName lastName email role isActive createdAt");
    
    res.status(200).json({
      message: "User statistics fetched successfully",
      payload: users,
    });
  } catch (err) {
    next(err);
  }
});

// Get article statistics
adminRoute.get("/stats/articles", verifyToken("ADMIN"), checkAdmin, async (req, res, next) => {
  try {
    const articles = await ArticleModel.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    
    res.status(200).json({
      message: "Article statistics fetched successfully",
      payload: articles,
    });
  } catch (err) {
    next(err);
  }
});