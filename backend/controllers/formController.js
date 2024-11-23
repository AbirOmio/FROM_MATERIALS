const { google } = require("googleapis");
// const path = require('path');
const { uploadToDrive } = require("../utils/googleDriveHelper");
const { v4: uuidv4 } = require("uuid"); // Add this at the top for unique ID generation

// Load spreadsheet configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const KEY_FILE = process.env.GOOGLE_KEY_FILE;

const sheetsAuth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE, // Use key file from .env
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

const sheetsClient = google.sheets({ version: "v4", auth: sheetsAuth });

// exports.handleFormSubmission = async (req, res) => {
//     try {
//         const formData = {
//             serialNo: req.body.serialNo,
//             sapCode: req.body.sapCode,
//             sapDescription: req.body.sapDescription,
//             hsCode: req.body.hsCode,
//             remarks: req.body.remarks,
//             phoneNumber: req.body.phoneNumber,
//         };

//         // Upload to Drive
//         const imagePath = path.join(__dirname, '../uploads/', req.file.filename);
//         const driveResult = await uploadToDrive(imagePath, req.file.filename);

//         // Write data to Google Sheets
//         const range = 'Sheet1!A2:F'; // Adjust based on your sheet structure

//         await sheetsClient.spreadsheets.values.append({
//             spreadsheetId: SPREADSHEET_ID, // From .env
//             range,
//             valueInputOption: 'USER_ENTERED',
//             resource: {
//                 values: [
//                     [
//                         formData.serialNo,
//                         formData.sapCode,
//                         formData.sapDescription,
//                         formData.hsCode,
//                         formData.remarks,
//                         formData.phoneNumber,
//                     ],
//                 ],
//             },
//         });

//         res.status(200).json({ message: 'Form submitted successfully!' });
//     } catch (error) {
//         console.error('Error submitting form:', error);
//         res.status(500).json({ error: 'Form submission failed.' });
//     }
// };

exports.handleFormSubmission = async (req, res) => {
  try {
    const formData = {
      sapCode: req.body.sapCode,
      sapDescription: req.body.sapDescription,
      hsCode: req.body.hsCode,
      customDutyPercentage: req.body.customDutyPercentage,
      remarks: req.body.remarks,
      field_1: req.body.field_1, // Dummy field for future
      field_2: req.body.field_2, // Dummy field for future
    };

    // Validation: Ensure required fields are present
    if (!formData.sapCode || !formData.sapDescription || !req.file) {
      return res
        .status(400)
        .json({ error: "SAP Code, SAP Description, and Image are required." });
    }

    // Validation: Ensure SAP Code is alphanumeric
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(formData.sapCode)) {
      return res.status(400).json({ error: "SAP Code must be alphanumeric." });
    }

    // Fetch existing data from Google Sheets
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A2:H", // Adjust based on your sheet structure
    });
    const rows = response.data.values || [];

    // Validation: Ensure SAP Code and SAP Description are unique (case-insensitive for Description)
    const isDuplicateSAPCode = rows.some((row) => row[0] === formData.sapCode);
    const isDuplicateSAPDescription = rows.some(
      (row) => row[1]?.toLowerCase() === formData.sapDescription.toLowerCase()
    );

    if (isDuplicateSAPCode) {
      return res.status(400).json({ error: "SAP Code must be unique." });
    }

    if (isDuplicateSAPDescription) {
      return res
        .status(400)
        .json({ error: "SAP Description must be unique (case-insensitive)." });
    }

    // Rename uploaded file to SAP Code
    const uniqueFileName = `${formData.sapCode}.${req.file.originalname
      .split(".")
      .pop()}`;

    // Upload the file to Google Drive
    const driveResult = await uploadToDrive(
      req.file.buffer,
      uniqueFileName,
      req.file.mimetype
    );

    const fileId = driveResult.id;
    const driveFileUrl = `https://drive.google.com/file/d/${fileId}/view`;

    // Append data to Google Sheets
    const range = "Sheet1!A2:I"; // Adjust range to include the Google Drive URL
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [
          [
            formData.sapCode, // SAP Code
            formData.sapDescription, // SAP Description
            driveFileUrl, // Google Drive URL
            formData.hsCode || "", // HS Code (Optional)
            formData.customDutyPercentage || "", // Custom Duty Percentage (Optional)
            formData.remarks || "", // Remarks (Optional)
            formData.field_1 || "", // Field_1 (Dummy)
            formData.field_2 || "", // Field_2 (Dummy)
          ],
        ],
      },
    });

    res.status(200).json({
      message: "Form submitted successfully!",
      fileId,
      fileUrl: driveFileUrl,
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({ error: "Form submission failed." });
  }
};
