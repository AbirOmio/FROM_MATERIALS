const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

// Fetch file metadata
const getFileMetadata = async (fileId) => {
    try {
        const response = await drive.files.get({
            fileId,
            fields: "id, name, mimeType, webViewLink",
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch file metadata: ${error.message}`);
    }
};

// Update file metadata (e.g., rename)
const updateFileMetadata = async (fileId, newMetadata) => {
    try {
        const response = await drive.files.update({
            fileId,
            resource: newMetadata,
        });
        console.log(`File metadata updated: ${response.data}`);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to update file metadata: ${error.message}`);
    }
};

module.exports = { getFileMetadata, updateFileMetadata };
