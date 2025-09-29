import mongoose from "mongoose";

// Import des modèles pour les enregistrer
import "@/models/Comment"; // Modèle Comment
import "@/models/Revision";  // Modèle Revision
import "@/models/User";      // Modèle User
import "@/models/Section";
import "@/models/Course";
import "@/models/Quiz";
import "@/models/QuizCompletion"; // Modèle QuizCompletion
import "@/models/Lesson";
import "@/models/Question";
import "@/models/Exercise";

const connectDB = async (): Promise<void> => {
    const { MONGODB_URI, NODE_ENV } = process.env;

    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined. Please check your environment variables.");
    }

    // Vérifier l'état actuel de la connexion
    const connectionState = mongoose.connection.readyState;

    switch (connectionState) {
        case 1: // Connected
            if (NODE_ENV === "development") {
                console.log("MongoDB is already connected.");
            }
            return;
        case 2: // Connecting
            if (NODE_ENV === "development") {
                console.log("MongoDB connection is currently in progress...");
            }
            return;
    }

    try {
        // Options de connexion
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
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

// Initialisation unique pour éviter des connexions multiples
let initialized = false;

const defaultExport = async (): Promise<void> => {
    if (!initialized) {
        await connectDB();
        initialized = true; // Marquer comme initialisé
    }
};

export { connectDB };
export default defaultExport;
