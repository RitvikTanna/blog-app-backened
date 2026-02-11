import jwt from "jsonwebtoken";
import { config } from "dotenv";
config();

export const verifyToken = async (req, res, next) => {
  //read token from req
  let token = req.cookies.token; //{ token :""}
  console.log("token :", token);
  if (token === undefined) {
    return res.status(400).json({ message: "Unauthorized req. PLz login" });
  }
  //verify the validity of the token( decoding the token)
  let decodedToken = jwt.verify(token, process.env.JWT_SECRET);

  //forward req to next middleware/route
  next();
};