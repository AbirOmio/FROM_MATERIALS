const { google } = require("googleapis");
// const fs = require("fs");
const { Readable } = require("stream");

// Load credentials from environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

exports.uploadToDrive = async (fileBuffer, fileName, mimeType) => {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [DRIVE_FOLDER_ID], // Google Drive folder ID from .env
    };

    // Convert buffer to a readable stream
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null); // End the stream

    const media = {
      mimeType, // Use the correct MIME type
      body: bufferStream, // Pass the readable stream
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id",
    });

    console.log(`File uploaded successfully: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    throw error;
  }
};

/**
 * Search for a file in Google Drive by its name or ID
 */
 exports.searchFileInDrive = async (fileId) => {
  try {
    const response = await drive.files.get({
      fileId,
      fields: "id, name, webViewLink",
    });

    console.log(`Found file: ${response.data.name}, ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error("Error searching for file by ID:", error);
    throw error;
  }
};

/**
 * Delete a file in Google Drive by its ID
 */
exports.deleteFileInDrive = async (fileId) => {
  try {
    await drive.files.delete({ fileId });
    console.log(`File deleted successfully: ${fileId}`);
    return { success: true, message: `File with ID ${fileId} deleted.` };
  } catch (error) {
    console.error("Error deleting file from Google Drive:", error);
    throw error;
  }
};