import mongoose from "mongoose";

// Import des modèles pour les enregistrer
import "@/models/Comment"; // Modèle Comment
import "@/models/Revision";  // Modèle Revision
import "@/models/User";      // Modèle User
import "@/models/Section";
import "@/models/Course";
import "@/models/Quiz";
import "@/models/QuizCompletion"; // Modèle QuizCompletion
import "@/models/CourseProgress";
import "@/models/Lesson";
import "@/models/Question";
import "@/models/Exercise";
import "@/models/Notification";

const connectDB = async (): Promise<void> => {
    const { MONGODB_URI, NODE_ENV } = process.env;

    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined. Please check your environment variables.");
    }

    // Vérifier l'état actuel de la connexion
    const connectionState = mongoose.connection.readyState;

    switch (connectionState) {
        case 1: // Connected
            // Vérifier que la connexion est vraiment active en faisant un ping
            try {
                if (mongoose.connection.db) {
                    await mongoose.connection.db.admin().ping();
                    if (NODE_ENV === "development") {
                        console.log("MongoDB is already connected and active.");
                    }
                    return;
                } else {
                    // La base de données n'est pas disponible, on va se reconnecter
                    console.warn("MongoDB connection appears inactive, reconnecting...");
                    await mongoose.connection.close();
                }
            } catch (error) {
                // La connexion semble inactive, on va se reconnecter
                console.warn("MongoDB connection appears inactive, reconnecting...");
                // Fermer la connexion existante avant de se reconnecter
                try {
                    await mongoose.connection.close();
                } catch (closeError) {
                    // Ignorer les erreurs de fermeture
                }
            }
            break;
        case 2: // Connecting
            if (NODE_ENV === "development") {
                console.log("MongoDB connection is currently in progress...");
            }
            // Attendre un peu pour voir si la connexion se termine
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Vérifier à nouveau l'état
            if (mongoose.connection.readyState === 1) {
                return;
            }
            break;
        case 3: // Disconnecting
            // Attendre que la déconnexion se termine
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
    }

    try {
        // Options de connexion améliorées
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000, // Timeout pour les opérations socket
            maxPoolSize: 10, // Maintenir jusqu'à 10 connexions socket
            minPoolSize: 1, // Maintenir au moins 1 connexion socket
            maxIdleTimeMS: 30000, // Fermer les connexions après 30s d'inactivité
            heartbeatFrequencyMS: 10000, // Ping toutes les 10s pour maintenir la connexion
        });

        console.log("MongoDB connected successfully.");

        // Gérer les événements de connexion
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Will attempt to reconnect on next request.');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected successfully.');
        });

    } catch (error: any) {
        console.error("Error connecting to MongoDB:", error.message);

        if (error.message.includes("ETIMEOUT") || error.message.includes("ENOTFOUND")) {
            console.error("The connection attempt timed out or host not found. Please check your network or the MongoDB URI.");
        } else if (error.message.includes("authentication")) {
            console.error("Authentication failed. Please check your MongoDB credentials.");
        }

        throw new Error("MongoDB connection failed");
    }
};

// Initialisation unique pour éviter des connexions multiples
let initialized = false;
let connectionPromise: Promise<void> | null = null;

const defaultExport = async (): Promise<void> => {
    if (!initialized) {
        if (!connectionPromise) {
            connectionPromise = connectDB();
        }
        await connectionPromise;
        initialized = true; // Marquer comme initialisé
    } else {
        // Vérifier que la connexion est toujours active
        if (mongoose.connection.readyState !== 1) {
            connectionPromise = connectDB();
            await connectionPromise;
        }
    }
};

export { connectDB };
export default defaultExport;
