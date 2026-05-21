import exp from "express";
import { connect } from "mongoose";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { userRoute } from "./APIS/userapi.js";
import { adminRoute } from "./APIS/adminapi.js";
import { authorRoute } from "./APIS/authorapi.js";
import { commonRouter } from "./APIS/commonapi.js";

// ================= LOAD ENV =================
config();

// ================= CREATE APP =================
const app = exp();

// ================= CORS =================
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ================= MIDDLEWARE =================
app.use(exp.json());
app.use(cookieParser());

// ================= ROUTES =================
app.use("/user-api", userRoute);
app.use("/author-api", authorRoute);
app.use("/admin-api", adminRoute);
app.use("/common-api", commonRouter);

// ================= HOME ROUTE =================
app.get("/", (req, res) => {
  res.send("Server running successfully");
});

// ================= DATABASE CONNECTION =================
const connectDB = async () => {
  try {
    await connect(process.env.DB_URL);

    console.log("DB connection success");
  } catch (err) {
    console.log("Err in DB connection", err);
  }
  console.log(process.env.DB_URL);
};

connectDB();

// ================= INVALID ROUTE =================
app.use((req, res) => {
  res.status(404).json({
    message: `${req.url} is invalid path`,
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  const isProduction = process.env.NODE_ENV === "production";

  let message = err.message || "Unexpected error";
  let details;

  // Validation Error
  if (err.name === "ValidationError") {
    message = "Validation error";

    details = Object.values(err.errors || {}).map(
      (e) => e.message
    );
  }

  // Cast Error
  if (err.name === "CastError") {
    message = "Invalid value for field";

    details = [`${err.path} is invalid`];
  }

  // Duplicate Key Error
  if (err.code === 11000) {
    message = "Duplicate value";

    const fields = Object.keys(err.keyValue || {});

    details = fields.map(
      (f) => `${f} already exists`
    );
  }

  // Strict Mode Error
  if (err.name === "StrictModeError") {
    message = "Invalid fields provided";

    details = err.path
      ? [`${err.path} is not allowed`]
      : undefined;
  }

  const finalStatus =
    status === 500 && (err.name || err.code)
      ? 400
      : status;

  const response = {
    message,
    status: finalStatus,
  };

  if (details) response.details = details;

  if (!isProduction) {
    response.stack = err.stack;
  }

  console.log("ERROR :", err);

  res.status(finalStatus).json(response);
});

// ================= EXPORT APP =================
export default app;