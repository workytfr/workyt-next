import { Metadata } from "next";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    let username = "Utilisateur";
    let bio = "Consultez les informations utilisateur, y compris leurs fiches de revision, leurs badges et leur biographie.";

    try {
        await connectDB();
        const user = await User.findById(id).select("username bio").lean();
        if (user) {
            username = (user as any).username || "Utilisateur";
            if ((user as any).bio) bio = (user as any).bio;
        }
    } catch {
        // fallback to defaults
    }

    const title = `Profil de ${username}`;
    const description = bio.length > 160 ? bio.slice(0, 157) + "..." : bio;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: "/avatars/default.png",
                    width: 800,
                    height: 600,
                    alt: `Profil de ${username}`,
                },
            ],
            type: "profile",
        },
        twitter: {
            card: "summary_large_image",
            site: "@workyt",
            title,
            description,
            images: ["https://www.workyt.fr/avatars/default.png"],
        },
    };
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
