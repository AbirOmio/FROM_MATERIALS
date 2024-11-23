const express = require("express");
const multer = require("multer");
const { handleFormSubmission } = require("../controllers/formController");

const router = express.Router();

// Multer setup for image upload
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, 'uploads/'),
//     filename: (req, file, cb) => {
//         const serialNo = req.body.serialNo || 'default';
//         cb(null, `${serialNo}-${file.originalname}`);
//     }
// });

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/submit", upload.single("image"), handleFormSubmission);

module.exports = router;
