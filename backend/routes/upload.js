const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary (import env vars from process.env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "chat_files", allowed_formats: ["jpg","png","gif","mp4","pdf"] },
});

const parser = multer({ storage });

router.post("/upload", parser.single("file"), (req, res) => {
  res.json({ url: req.file.path });
});

module.exports = router;
