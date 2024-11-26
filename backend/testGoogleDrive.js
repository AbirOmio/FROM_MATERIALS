require("dotenv").config(); // Load environment variables
const { searchFileInDrive, deleteFileInDrive } = require("./utils/googleDriveHelper");


async function testGoogleDriveFunctions() {
  try {
    console.log("\n=== Starting Tests ===\n");

    // **Test with an existing ImageURL**
    const imageURL = "https://drive.google.com/file/d/1nLS6zbSc2EdlX3l2AyP5TT5NqitRhAMk/view";
    const fileId = extractFileIdFromUrl(imageURL);

    if (!fileId) {
      throw new Error("Could not extract file ID from the provided URL.");
    }

    console.log(`Extracted File ID: ${fileId}`);

    // **Test 1: Search for the File by ID**
    console.log("\n**Searching File...**");
    const searchResponse = await searchFileInDrive(fileId);
    if (searchResponse) {
      console.log("Search Response:", searchResponse);
    } else {
      console.log("File not found.");
    }

    // **Test 2: Delete the File**
    console.log("\n**Deleting File...**");
    const deleteResponse = await deleteFileInDrive(fileId);
    console.log("Delete Response:", deleteResponse);

    console.log("\n=== All Tests Completed ===");
  } catch (error) {
    console.error("Error during testing:", error);
  }
}

testGoogleDriveFunctions();
