const { google } = require('googleapis');
// const path = require('path');
const { uploadToDrive } = require('../utils/googleDriveHelper');
const { v4: uuidv4 } = require('uuid'); // Add this at the top for unique ID generation

// Load spreadsheet configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const KEY_FILE = process.env.GOOGLE_KEY_FILE;

const sheetsAuth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE, // Use key file from .env
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
    ],
});

const sheetsClient = google.sheets({ version: 'v4', auth: sheetsAuth });

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
            serialNo: req.body.serialNo,
            sapCode: req.body.sapCode,
            sapDescription: req.body.sapDescription,
            hsCode: req.body.hsCode,
            remarks: req.body.remarks,
            phoneNumber: req.body.phoneNumber,
        };

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Generate a unique file name based on serialNo or UUID
        const uniqueFileName = `${formData.serialNo || uuidv4()}.${req.file.originalname.split('.').pop()}`;

        // Upload the file to Google Drive with the unique file name
        const driveResult = await uploadToDrive(
            req.file.buffer, // Pass file buffer
            uniqueFileName, // Use the unique file name
            req.file.mimetype // Pass MIME type
        );

        // Generate the public Google Drive file URL
        const fileId = driveResult.id;
        const driveFileUrl = `https://drive.google.com/file/d/${fileId}/view`;

        // Add the file URL and name to the form data
        formData.imageUrl = driveFileUrl;
        formData.fileName = uniqueFileName;

        // Write data to Google Sheets
        const range = 'Sheet1!A2:H'; // Adjust range to include the file name in the last column
        await sheetsClient.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID, // From .env
            range,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    [
                        formData.serialNo,
                        formData.sapCode,
                        formData.sapDescription,
                        driveFileUrl, // Add the file URL
                        formData.hsCode,
                        formData.remarks,
                        formData.phoneNumber,
                        formData.fileName, // Store the unique file name in the last column
                    ],
                ],
            },
        });

        res.status(200).json({
            message: 'Form submitted successfully!',
            fileId: driveResult.id,
            fileUrl: driveFileUrl,
            fileName: uniqueFileName,
        });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'Form submission failed.' });
    }
};

