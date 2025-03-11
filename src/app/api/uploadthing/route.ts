import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,
    config: {
        // Passez explicitement votre token (si nécessaire) :
        token: process.env.UPLOADTHING_TOKEN,
        // Indique si on est en dev ou pas :
        isDev: process.env.NODE_ENV === "development",
        // URL complète si la détection automatique échoue :
        callbackUrl: "https://www.workyt.fr/api/uploadthing",
        // Niveau de logs (Error, Warning, Info, Debug, Trace) :
        logLevel: "Debug",
        // Format de logs (json, logFmt, structured, pretty)
        logFormat: "json",
    },
});
