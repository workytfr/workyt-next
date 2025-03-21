import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,
    config: {
        isDev: process.env.NODE_ENV === "development",
        callbackUrl: process.env.UPLOADTHING_CALLBACK_URL,
        logLevel: "Debug",
    },
});
