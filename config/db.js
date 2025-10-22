import mongoose from "mongoose";
import colors from "colors";
const connectDB = async () => {
    try {
        // Use MONGO_URL from environment
        const mongoUri = process.env.MONGO_URL;
        console.log(`Attempting to connect to MongoDB at: ${mongoUri}`);
        const conn = await mongoose.connect(mongoUri);
        console.log(`Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white);
    } catch (error) {
        console.log(`Error in Mongodb ${error}`.bgRed.white);
    }
};

export default connectDB;