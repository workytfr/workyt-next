import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    const { MONGODB_URI } = process.env;

    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined. Please check your environment variables.");
    }

    const connectionState = mongoose.connection.readyState;

    switch (connectionState) {
        case 1:
            console.log("MongoDB is already connected.");
            return;
        case 2:
            console.log("MongoDB connection is currently in progress...");
            return;
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // Timeout après 10 secondes
            connectTimeoutMS: 10000, // Timeout de la connexion après 10 secondes
        });
        console.log("MongoDB connected successfully.");
    } catch (error: any) {
        console.error("Error connecting to MongoDB:", error.message);

        if (error.message.includes("ETIMEOUT")) {
            console.error("The connection attempt timed out. Please check your network or the MongoDB URI.");
        } else if (error.message.includes("authentication")) {
            console.error("Authentication failed. Please check your MongoDB credentials.");
        }

        throw new Error("MongoDB connection failed");
    }
};

// Éviter les connexions multiples dans le même processus
if (!mongoose.connection.readyState) {
    connectDB()
        .then(() => console.log("MongoDB initialization complete."))
        .catch((err) => console.error("MongoDB initialization error:", err));
}

export default connectDB;
