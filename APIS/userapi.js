import exp from "express";
import { register, authenticate } from "../services/authService.js";
import { verifyToken } from "../middlewares/verifyToken.js";

export const userRoute = exp.Router();


//  Register user
userRoute.post("/users", async (req, res) => {
  try {
    let userObj = req.body;

    const newUserObj = await register({ ...userObj, role: "USER" });

    res.status(201).json({
      message: "User created",
      payload: newUserObj
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


//  Login user
userRoute.post("/login", async (req, res) => {
  try {
    let credentials = req.body;

    const token = await authenticate(credentials);

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});


// Read all articles (Protected)
userRoute.get("/articles", verifyToken, async (req, res) => {
  try {
    const articles = await req.app.get("articlesCollection").find().toArray();

    res.status(200).json({
      message: "Articles fetched",
      payload: articles
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Add comment to an article (Protected)
userRoute.post("/articles/:articleId/comments", verifyToken, async (req, res) => {
  try {
    const articleId = req.params.articleId;
    const commentObj = req.body;

    const articlesCollection = req.app.get("articlesCollection");

    await articlesCollection.updateOne(
      { articleId: articleId },
      {
        $push: {
          comments: {
            ...commentObj,
            username: req.user.username
          }
        }
      }
    );

    res.status(200).json({
      message: "Comment added successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
