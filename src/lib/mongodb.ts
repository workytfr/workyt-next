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
import "@/models/CurriculumNode";
import "@/models/StudentAcademicProfile";
import "@/models/CompetencyProgress";
import "@/models/Evaluation";
import "@/models/EvaluationDraw";
import "@/models/EvaluationSubmission";
import "@/models/EvaluationGrade";
import "@/models/Role";

// Les écouteurs ne sont posés qu'une fois : chaque reconnexion en ajoutait
// une nouvelle série (fuite + logs en double).
let listenersAttached = false;

function attachListeners() {
    if (listenersAttached) return;
    listenersAttached = true;

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
    });
    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Le driver retente la connexion tout seul.');
    });
    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully.');
    });
}

// Connexion en cours ou établie, partagée par toutes les requêtes de cette copie
// du site : jamais deux mongoose.connect() en parallèle.
let connectionPromise: Promise<void> | null = null;

async function openConnection(uri: string): Promise<void> {
    attachListeners();
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1,
            // Pas de maxIdleTimeMS : fermer les sockets inactives au bout de 30 s
            // obligeait à refaire une poignée de main TLS à presque chaque
            // requête, justement ce qui expire quand la base est chargée.
            heartbeatFrequencyMS: 10000,
        });
        console.log("MongoDB connected successfully.");
    } catch (error: any) {
        console.error("Error connecting to MongoDB:", error.message);

        if (error.message.includes("ETIMEOUT") || error.message.includes("ENOTFOUND")) {
            console.error("The connection attempt timed out or host not found. Please check your network or the MongoDB URI.");
        } else if (error.message.includes("authentication")) {
            console.error("Authentication failed. Please check your MongoDB credentials.");
        }

        throw new Error("MongoDB connection failed");
    }
}

/**
 * Garantit une connexion à MongoDB.
 *
 * Une fois connecté, le driver gère seul les coupures (pool + heartbeat) : on ne
 * ferme jamais la connexion nous-mêmes, sinon toutes les requêtes en vol
 * échouent et chaque copie du site refait des poignées de main TLS en rafale.
 */
const connectDB = async (): Promise<void> => {
    const { MONGODB_URI } = process.env;

    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined. Please check your environment variables.");
    }

    // Déjà connecté (ou en cours) : même si le lien tombe ensuite, le driver
    // reconnecte et mongoose met les requêtes en attente d'ici là.
    if (!connectionPromise) {
        connectionPromise = openConnection(MONGODB_URI).catch((error) => {
            // Un échec ne doit pas rester en cache : la requête suivante retente.
            connectionPromise = null;
            throw error;
        });
    }
    return connectionPromise;
};

export { connectDB };
export default connectDB;
