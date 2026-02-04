require("dotenv").config();
const express = require("express");
const { google } = require("googleapis");
const path = require("path");

const app = express();
app.use(express.static("public"));

const API_KEY = process.env.GOOGLE_API_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const PORT = process.env.PORT || 3000;

// API Route
app.get("/api/sheet", async (req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: API_KEY });

    // Get first sheet name automatically
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetTitle = meta.data.sheets[0].properties.title;

    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetTitle}!A2:F`,
    });

    res.json(data.data.values || []);
  } catch (err) {
    console.error("Sheets API error:", err.message);
    res.status(500).json({ error: "Failed to fetch sheet" });
  }
});

// For Netlify / frontend routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
