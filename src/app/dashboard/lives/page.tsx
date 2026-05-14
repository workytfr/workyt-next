import { Metadata } from "next";
import LivesAdminClient from "./LivesAdminClient";

export const metadata: Metadata = {
    title: "Gestion des Lives - Dashboard Workyt",
    robots: "noindex, nofollow",
};

export default function LivesAdminPage() {
    return <LivesAdminClient />;
}
