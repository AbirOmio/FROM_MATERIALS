const express = require("express");
const multer = require("multer");
const { handleFormSubmission } = require("../controllers/formController");

const router = express.Router();

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/submit", upload.single("image"), handleFormSubmission);

module.exports = router;
