const { google } = require("googleapis");
// const path = require('path');
const { uploadToDrive, searchFileInDrive, deleteFileInDrive} = require("../utils/googleDriveHelper");
const {
  getAllRows,
  appendRow,
  updateRow,
} = require("../utils/googleSheetService");
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

exports.handleFormSubmission = async (req, res) => {
  console.log(req.file);
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

exports.searchRecords = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res
        .status(400)
        .json({ error: "Query parameter is required for search." });
    }

    const rows = await getAllRows(SPREADSHEET_ID, "Sheet1!A2:H");
    const filteredRecords = rows
      .map((row, index) => ({
        rowIndex: index + 2, // Add 2 to account for the header row and 0-based index
        data: row,
      }))
      .filter(
        (record) =>
          record.data[0]?.toLowerCase().includes(query.toLowerCase()) ||
          record.data[1]?.toLowerCase().includes(query.toLowerCase())
      );

    res.status(200).json({ records: filteredRecords });
  } catch (error) {
    console.error("Error searching records:", error);
    res.status(500).json({ error: "Failed to fetch records." });
  }
};




exports.updateRecord = async (req, res) => {
  console.log(req.file);
  try {
    const formData = {
      originalSAPCode: req.body.originalSAPCode,
      originalSAPDescription: req.body.originalSAPDescription,
      sapCode: req.body.sapCode,
      sapDescription: req.body.sapDescription,
      URL: req.body.URL,
      hsCode: req.body.hsCode,
      customDutyPercentage: req.body.customDutyPercentage,
      remarks: req.body.remarks,
    };



    // Fetch all rows to validate uniqueness
    const rows = await getAllRows(SPREADSHEET_ID, "Sheet1!A2:H");

    //Check if sacCode is Alphanumeric
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(formData.sapCode)) {
      return res.status(400).json({ error: "SAP Code must be alphanumeric." });
    }

    // Check if the SAP Code is unique
    const issapCodeDuplicate = rows.some(
      (row, index) => row[0] === formData.sapCode && row[0] !== formData.originalSAPCode // Exclude the current record being updated
    );

    // Check if the SAP Description is unique
    const issapDescriptionDuplicate = rows.some(
      (row, index) =>
        row[1].toLowerCase() === formData.sapDescription && row[1].toLowerCase() !== formData.originalSAPDescription // Exclude the current record being updated
    );

    if (issapCodeDuplicate) {
      return res.status(400).json({
        error: "SAP Code must be unique.",
      });
    }

    if (issapDescriptionDuplicate) {
      return res.status(400).json({
        error: "SAP Description must be unique.",
      });
    }

    // Find the row index to update
    const rowIndex = rows.findIndex((row) => row[0] === formData.originalSAPCode);

    if (rowIndex === -1) {
      return res.status(404).json({ error: "Record not found." });
    }


    


    // Extract file ID from the Google Drive Image URL
    const extractFileIdFromUrl = (url) => {
    const match = url.match(/\/d\/(.+?)\//);
    return match ? match[1] : null;
    };

    fileId = extractFileIdFromUrl(formData.URL);

    if(req.file)
    {

      // Rename uploaded file to SAP Code
      const uniqueFileName = `${formData.sapCode}.${req.file.originalname
      .split(".")
      .pop()}`;

      const deleteResponse = await deleteFileInDrive(fileId);

      // Upload the file to Google Drive
      const driveResult = await uploadToDrive(
      req.file.buffer,
      uniqueFileName,
      req.file.mimetype
    );

    fileId = driveResult.id;

    }

    const driveFileUrl = `https://drive.google.com/file/d/${fileId}/view`;

    // Prepare the data for Google Sheets
    const values = [
      [
        formData.sapCode || "",
        formData.sapDescription || "",
        driveFileUrl,
        formData.hsCode || "",
        formData.customDutyPercentage || "",
        formData.remarks || "",
      ],
    ];
    console.log("Prepared Values for Update:", values);

    // Update row in Google Sheets
    const range = `Sheet1!A${rowIndex + 2}:H${rowIndex + 2}`;
    await updateRow(SPREADSHEET_ID, range, values);

    res.status(200).json({ message: "Record updated successfully." });
  } catch (error) {
    console.error("Error updating record:", error.message);
    res.status(500).json({ error: "Failed to update record." });
  }
};


