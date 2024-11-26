const { google } = require("googleapis");

const sheetsAuth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheetsClient = google.sheets({ version: "v4", auth: sheetsAuth });

// Fetch all rows
const getAllRows = async (spreadsheetId, range) => {
    try {
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.data.values || [];
    } catch (error) {
        throw new Error(`Failed to fetch rows: ${error.message}`);
    }
};

// Search for a row by keyword
const searchRows = async (spreadsheetId, range, keyword) => {
    try {
        const rows = await getAllRows(spreadsheetId, range);
        const matchingRows = rows.filter((row) => row.some((cell) => cell.includes(keyword)));

        if (matchingRows.length === 0) {
            throw new Error(`No rows found containing keyword: ${keyword}`);
        }

        return matchingRows;
    } catch (error) {
        throw new Error(`Failed to search rows: ${error.message}`);
    }
};

// Update a specific row
const updateRow = async (spreadsheetId, range, values) => {
    try {
        console.log("Values sent to Google Sheets:", values);
        await sheetsClient.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            resource: { values }, // Ensure 'values' is an array of arrays
        });
    } catch (error) {
        console.error("Error in updateRow:", error.message);
        throw new Error(`Failed to update row: ${error.message}`);
    }
};

module.exports = { getAllRows, searchRows, updateRow };