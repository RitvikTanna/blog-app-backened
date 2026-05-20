import exp from "express";
import { register, authenticate } from "../services/authService.js";
import { ArticleModel } from "../models/articleModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../config/multer.js";
import { v2 } from "cloudinary";
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";

export const userRoute = exp.Router();


// Register user
userRoute.post(
        "/users",
        upload.single("profileImageUrl"),
        async (req, res, next) => {
        let cloudinaryResult;

            try {
                let userObj = req.body;

                //  Step 1: upload image to cloudinary from memoryStorage (if exists)
                if (req.file) {
                cloudinaryResult = await uploadToCloudinary(req.file.buffer);
                }

                // Step 2: call existing register()
                const newUserObj = await register({
                ...userObj,
                role: "USER",
                profileImageUrl: cloudinaryResult?.secure_url,
                });

                res.status(201).json({
                message: "user created",
                payload: newUserObj,
                });

            } catch (err) {

                // Step 3: rollback 
                if (cloudinaryResult?.public_id) {
                await cloudinary.uploader.destroy(cloudinaryResult.public_id);
                }

                next(err); // send to your error middleware
            }

        }
        );


//  LOGIN ROUTE
userRoute.post("/login", async (req, res, next) => {
  try {

    const { token, user } = await authenticate(req.body);

    // store JWT in cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000
    });

    res.status(200).json({
      message: "Login successful",
      user
    });

  } catch (err) {
    next(err);
  }
});


// Get all articles
userRoute.get("/articles", verifyToken("USER"), async (req, res) => {

  let articles = await ArticleModel.find({ isArticleActive: true })
    .populate("author", "firstName lastName email")
    .populate("comments.user", "firstName lastName email");

  //  If DB empty, send demo data
  if (articles.length === 0) {
    articles = [
      {
        _id: "1",
        title: "Getting Started with React",
        category: "Tech",
        content: "React makes it painless to build interactive UIs..."
      },
      {
        _id: "2",
        title: "Node.js Basics",
        category: "Backend",
        content: "Node.js allows JavaScript to run on the server..."
      },
      {
        _id: "3",
        title: "MongoDB Guide",
        category: "Database",
        content: "MongoDB is a NoSQL database used widely..."
      }
    ];
  }

  res.status(200).json({
    message: "all articles",
    payload: articles
  });
});

// Get specific article
userRoute.get("/article/:articleId", verifyToken("USER", "AUTHOR", "ADMIN"), async (req, res) => {
  const { articleId } = req.params;
  const article = await ArticleModel.findOne({ _id: articleId, isArticleActive: true })
    .populate("author", "firstName lastName email")
    .populate("comments.user", "firstName lastName email");
  if (!article) {
    return res.status(404).json({ message: "Article not found" });
  }
  res.status(200).json({ message: "article found", payload: article });
});

// Add comment
userRoute.put("/articles", verifyToken("USER"), async (req, res) => {

  const { user, articleId, comment } = req.body;

  if (user !== req.user.userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const articleWithComment = await ArticleModel.findOneAndUpdate(
    { _id: articleId, isArticleActive: true },
    { $push: { comments: { user, comment } } },
    { new: true, runValidators: true }
  ).populate("author", "firstName lastName email").populate("comments.user", "firstName lastName email");

  if (!articleWithComment) {
    return res.status(404).json({ message: "Article not found" });
  }

  res.status(200).json({
    message: "comment added successfully",
    payload: articleWithComment
  });
});

// Delete comment
userRoute.delete("/articles/:articleId/comments/:commentId", verifyToken("USER", "AUTHOR"), async (req, res) => {
  const { articleId, commentId } = req.params;

  try {
    const updatedArticle = await ArticleModel.findOneAndUpdate(
      { _id: articleId },
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    ).populate("author", "firstName lastName email").populate("comments.user", "firstName lastName email");

    if (!updatedArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json({
      message: "Comment deleted successfully",
      payload: updatedArticle
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});