import { Plus } from "lucide-react";

/* Source unique : ces mêmes questions/réponses alimentent l'accordéon ET
   le JSON-LD FAQPage. Le texte balisé doit être visible à l'identique,
   sinon Google considère le balisage comme trompeur. */
const FAQ = [
    {
        q: "Est-ce vraiment gratuit ?",
        a: "Oui, entièrement. Workyt est une association loi 1901 financée par des dons et animée par des bénévoles. Il n'y a ni abonnement, ni version premium, ni publicité, ni contenu réservé. Aucune carte bancaire n'est demandée à aucun moment.",
    },
    {
        q: "Pour quels niveaux scolaires ?",
        a: "De la 6ème au supérieur. Les cours et fiches couvrent le collège, le lycée (voie générale et technologique) et les premières années d'études supérieures, avec un accent sur les programmes du brevet et du baccalauréat.",
    },
    {
        q: "Qui écrit les cours et les fiches ?",
        a: "Des bénévoles : enseignants, étudiants et anciens élèves. Chaque contenu passe par une relecture avant publication, et l'auteur est affiché sur le cours. Tu peux toi-même proposer une fiche une fois inscrit.",
    },
    {
        q: "Comment poser une question sur un exercice ?",
        a: "Rends-toi sur le forum, choisis la matière, décris ton blocage et publie. La communauté répond aux questions au fil de l'eau. Pense à préciser ton niveau et ce que tu as déjà essayé : les questions détaillées obtiennent de meilleures réponses.",
    },
    {
        q: "Faut-il créer un compte pour utiliser Workyt ?",
        a: "Non pour consulter : les cours, les fiches et le forum sont lisibles sans inscription. Le compte devient utile pour poser une question, publier une fiche, suivre ta progression et gagner des points.",
    },
    {
        q: "Comment aider l'association ?",
        a: "Trois façons : devenir bénévole pour rédiger ou relire des contenus, faire un don pour couvrir les frais d'hébergement, ou simplement participer au forum en répondant aux questions des autres élèves.",
    },
];

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
};

export default function FaqSection() {
    return (
        <section id="faq" className="bg-[var(--wk-paper-2)] px-4 py-20 md:py-28">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-4">
                    <div className="font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.6)]">
                        <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
                        <span>05</span>
                        <span>Questions</span>
                    </div>
                    <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl">
                        Les questions{" "}
                        <span className="italic">qu&apos;on nous pose</span>.
                    </h2>
                    <p className="mt-5 text-[rgba(26,21,18,0.7)]">
                        Il en manque une ?{" "}
                        <a
                            href="mailto:admin@workyt.fr"
                            className="font-semibold text-[var(--wk-accent)] underline underline-offset-4"
                        >
                            Écris-nous
                        </a>
                        , on répond.
                    </p>
                </div>

                <div className="lg:col-span-8">
                    <dl className="divide-y divide-[rgba(26,21,18,0.12)] border-y border-[rgba(26,21,18,0.12)]">
                        {FAQ.map((item) => (
                            <details key={item.q} className="group py-1">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wk-accent)] [&::-webkit-details-marker]:hidden">
                                    <dt className="font-serif-display text-lg leading-snug md:text-xl">
                                        {item.q}
                                    </dt>
                                    <Plus
                                        className="h-5 w-5 shrink-0 text-[var(--wk-accent)] transition-transform duration-300 group-open:rotate-45"
                                        aria-hidden="true"
                                    />
                                </summary>
                                <dd className="pb-5 pr-10 text-sm leading-relaxed text-[rgba(26,21,18,0.7)]">
                                    {item.a}
                                </dd>
                            </details>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}
