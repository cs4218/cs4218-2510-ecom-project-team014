// server.js
import app from "./app.js";
import dotenv from "dotenv";
import colors from "colors"; // if needed

dotenv.config();

const PORT = process.env.PORT || 6060;

app.listen(PORT, () => {
    console.log(`Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white);
});
