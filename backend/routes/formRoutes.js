const express = require("express");
const multer = require("multer");
const {
  handleFormSubmission,
  searchRecords,
  updateRecord,
} = require("../controllers/formController");

const router = express.Router();

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/submit", upload.single("image"), handleFormSubmission);

// router.get("/search", async (req, res) => {
//   const { query } = req.query;
//   try {
//     const response = await sheetsClient.spreadsheets.values.get({
//       spreadsheetId: SPREADSHEET_ID,
//       range: "Sheet1!A2:H",
//     });

//     const rows = response.data.values || [];
//     const records = rows.filter(
//       (row) =>
//         row[0]?.toLowerCase().includes(query.toLowerCase()) || // Match SAP Code
//         row[1]?.toLowerCase().includes(query.toLowerCase()) // Match SAP Description
//     );

//     res.json({ records });
//   } catch (error) {
//     console.error("Error fetching records:", error);
//     res.status(500).json({ error: "Failed to fetch records." });
//   }
// });

// router.put("/update", async (req, res) => {
//   const { sapCode, updatedData } = req.body;

//   try {
//     const response = await sheetsClient.spreadsheets.values.get({
//       spreadsheetId: SPREADSHEET_ID,
//       range: "Sheet1!A2:H",
//     });

//     const rows = response.data.values || [];
//     const rowIndex = rows.findIndex((row) => row[0] === sapCode);

//     if (rowIndex === -1) {
//       return res.status(404).json({ error: "Record not found." });
//     }

//     const range = `Sheet1!A${rowIndex + 2}:H${rowIndex + 2}`;
//     await sheetsClient.spreadsheets.values.update({
//       spreadsheetId: SPREADSHEET_ID,
//       range,
//       valueInputOption: "USER_ENTERED",
//       resource: { values: [updatedData] },
//     });

//     res.json({ message: "Record updated successfully." });
//   } catch (error) {
//     console.error("Error updating record:", error);
//     res.status(500).json({ error: "Failed to update record." });
//   }
// });

// Route to search records
//router.get("/search", searchRecords);

// Route to update a record
//router.put("/update", updateRecord);

// Route to search records (by sapCode or sapDescription)
router.get("/search", searchRecords);

// Route to update a record (by sapCode or sapDescription)
router.put("/update", upload.single("image"), updateRecord);


module.exports = router;
