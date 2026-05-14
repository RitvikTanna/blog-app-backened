import { Schema, model } from "mongoose";

//create user schema
const userSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"]
  },

  lastName: {
    type: String
  },

  email: {
    type: String,
    required: [true, "Email is required"]
  },

  password: {
    type: String,
    required: [true, "Password is required"]
  },

  profileImageUrl: {
    type: String
  },

  role: {
    type: String,
    enum: ["AUTHOR", "USER", "ADMIN"],
    required: [true, "{VALUE} is an Invalid Role"]
  },

  isActive: {
    type: Boolean,
    default: true
  }
},
{
  timestamps: true,
  strict: true,
  versionKey: false
});

//create user model
export const UserModel = model("user", userSchema);