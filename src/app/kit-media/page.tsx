import { Metadata } from "next";
import Link from "next/link";
import {
    Newspaper,
    Sparkles,
    Users,
    Heart,
    Globe,
    Eye,
    MessageCircle,
    Instagram,
    Target,
    Gift,
    Package,
    Handshake,
    Gem,
    ShieldCheck,
    BadgeCheck,
    Clock,
    Mail,
    ArrowRight,
    Youtube,
    Music2,
    BookOpen,
    Tag,
    CheckCircle2,
    Rocket,
    Lightbulb,
    MessageSquare,
    Megaphone,
    Send,
} from "lucide-react";
import PartnershipForm from "./PartnershipForm";
import { getInstagramFollowers, formatFollowers } from "@/lib/instagram";

export const metadata: Metadata = {
    title: "Kit média Workyt — Partenariats & visibilité",
    description:
        "Kit média de Workyt, association loi 1901 portée par 100+ bénévoles. Audience étudiante 11–25 ans engagée, blog culture générale et programme de fidélité Workyt Award. Proposez un partenariat, un prêt presse ou une activation communautaire.",
    keywords:
        "kit média Workyt, partenariat étudiant, prêt presse, partenariat marque, Workyt Award, média kit, visibilité étudiante, partenariat association",
    alternates: { canonical: "https://workyt.fr/kit-media" },
    openGraph: {
        title: "Kit média Workyt — Partenariats & visibilité",
        description:
            "Une audience jeune, scolaire et engagée. Prêt presse, partenariats long terme et activation communautaire via le Workyt Award.",
        url: "https://workyt.fr/kit-media",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
        images: [{ url: "https://workyt.fr/default-thumbnail.png", width: 1200, height: 630, alt: "Kit média Workyt" }],
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt_fr",
        title: "Kit média Workyt — Partenariats & visibilité",
        description: "Audience étudiante engagée. Prêt presse, contenus honnêtes et Workyt Award.",
    },
    robots: { index: true, follow: true },
};

const baseStats = [
    { icon: Eye, value: "11,1k", label: "Impressions / mois", sub: "Blog (Search Console)" },
    { icon: Globe, value: "1,1k", label: "Visites / mois", sub: "Cloudflare (30 j)" },
    { icon: Heart, value: "100+", label: "Bénévoles actifs", sub: "Association loi 1901" },
];

const channels = [
    { icon: BookOpen, name: "Blog — Nos Tests", formats: "Test détaillé, comparatif, tuto", link: "blog.workyt.fr" },
    { icon: Tag, name: "Blog — Le Bon Plan", formats: "Sélection produits, codes promo", link: "blog.workyt.fr" },
    { icon: Youtube, name: "YouTube", formats: "Tutos, formats courts, lives (chaîne en lancement)", link: "@workytfr" },
    { icon: Instagram, name: "Instagram", formats: "Reels, stories, posts", link: "@workyt" },
    { icon: Music2, name: "TikTok", formats: "Démos courtes, avis", link: "À venir" },
    { icon: MessageCircle, name: "Discord", formats: "Relais communauté, retours", link: "700+ membres" },
];

const offers = [
    {
        icon: Package,
        tag: "Formule 1",
        title: "Prêt presse / test produit",
        points: [
            "Test honnête publié dans notre rubrique « Nos Tests » + relais réseaux",
            "Produit prêté (retourné) ou offert selon vos conditions",
            "Angle étudiant : utilité réelle pour les études et la productivité",
        ],
    },
    {
        icon: Handshake,
        tag: "Formule 2",
        title: "Partenariat long terme",
        points: [
            "Série de tests récurrents et contenus dédiés sur l'année",
            "Opérations communautaires : codes promo « Bon Plan », jeux-concours, lives",
            "Visibilité régulière auprès d'une cible jeune difficile à toucher par la pub classique",
        ],
    },
    {
        icon: Gem,
        tag: "Formule 3",
        title: "Activation — Workyt Award",
        points: [
            "Vos codes promo intégrés à notre programme de fidélité gamifié",
            "Un canal d'acquisition direct vers vos produits, porté par une communauté motivée",
            "Engagement marque minimal : vous fournissez les codes, nous gérons tout",
        ],
    },
];

const awardSteps = [
    { n: 1, title: "L'étudiant est actif", text: "Cours, fiches, forum, quiz : chaque action sur Workyt lui fait gagner des gemmes." },
    { n: 2, title: "Il accumule ses gemmes", text: "Au fil de son engagement sur la plateforme, son solde de gemmes grandit." },
    { n: 3, title: "Il les échange", text: "Dans la boutique Workyt Award, contre un code promo de votre marque." },
    { n: 4, title: "Il achète chez vous", text: "Code à usage unique utilisé directement sur votre site — trafic qualifié." },
];

const commitments = [
    { icon: Eye, title: "Transparence", text: "Tout contenu sponsorisé ou produit reçu est signalé clairement." },
    { icon: ShieldCheck, title: "Honnêteté éditoriale", text: "Nos tests gardent leur indépendance — c'est ce qui leur donne de la valeur." },
    { icon: Clock, title: "Fiabilité", text: "Délais respectés et interlocuteur dédié pour le suivi du partenariat." },
    { icon: BadgeCheck, title: "Image valorisante", text: "Une association éducative à l'image positive pour votre marque." },
];

const launchPerks = [
    { icon: Users, title: "Un panel de testeurs", text: "De vrais étudiants de notre communauté essaient votre produit ou service." },
    { icon: MessageSquare, title: "Des retours concrets", text: "Vous récupérez des avis utiles pour ajuster votre offre avant ou pendant le lancement." },
    { icon: Megaphone, title: "Un premier coup de projecteur", text: "Visibilité auprès d'une audience jeune, curieuse et prescriptrice." },
];

const steps = [
    { icon: Send, title: "Vous nous écrivez", text: "Via le formulaire ci-dessous, en quelques minutes. Présentez votre produit et votre objectif." },
    { icon: MessageCircle, title: "On échange", text: "On définit ensemble le format adapté (test, partenariat, codes promo) et les modalités." },
    { icon: Package, title: "Vous envoyez", text: "Produit en prêt, dotation ou codes promo selon la formule choisie — aucun budget pub requis." },
    { icon: Megaphone, title: "On publie & on relaie", text: "Contenu honnête + relais auprès de la communauté, dans un délai convenu à l'avance." },
];

const objectives = [
    { icon: Package, text: "Faire découvrir à notre communauté des produits et services utiles aux études et à la vie étudiante." },
    { icon: Tag, text: "Proposer des « bons plans » réels (codes promo, sélections) à notre communauté." },
    { icon: Target, text: "Faire vivre une ligne éditoriale honnête, pédagogique et orientée réussite." },
    { icon: Heart, text: "Financer indirectement notre mission associative grâce à des dotations et partenariats." },
];

export default async function KitMediaPage() {
    // Compteur d'abonnés Instagram en direct (API officielle, cache 24 h).
    // Repli sur "250+" si l'API n'est pas configurée ou indisponible.
    const igCount = await getInstagramFollowers();
    const stats = [
        ...baseStats,
        {
            icon: Instagram,
            value: igCount !== null ? formatFollowers(igCount) : "250+",
            label: "Abonnés Instagram",
            sub: "@workyt",
        },
    ];

    const ld = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Kit média Workyt",
        url: "https://workyt.fr/kit-media",
        inLanguage: "fr",
        isPartOf: { "@type": "WebSite", name: "Workyt", url: "https://workyt.fr" },
        about: {
            "@type": "EducationalOrganization",
            name: "Workyt",
            url: "https://workyt.fr",
            description:
                "Association loi 1901 d'entraide scolaire gratuite, 100 % bénévole, avec un blog culture générale et des rubriques de tests, bons plans et conseils.",
            sameAs: [
                "https://twitter.com/workyt_fr",
                "https://www.instagram.com/workyt",
                "https://www.linkedin.com/company/workyt",
                "https://discord.gg/workyt",
            ],
        },
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: "https://workyt.fr" },
            { "@type": "ListItem", position: 2, name: "Kit média", item: "https://workyt.fr/kit-media" },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

            <div className="min-h-screen bg-white">
                {/* ===== HERO ===== */}
                <header className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 text-white">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />
                    <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24">
                        <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-white/80">
                            <Link href="/" className="hover:text-white">Accueil</Link>
                            {" › "}
                            <span className="text-white font-medium">Kit média</span>
                        </nav>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-5">
                            <Newspaper className="w-4 h-4" />
                            Kit média — Partenariats &amp; visibilité
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5">
                            Workyt
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mb-8">
                            La plateforme d&apos;apprentissage gratuite portée par une association de
                            100+ bénévoles — cours, fiches, forum, quiz, et un blog culture générale.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <a
                                href="https://workyt.fr"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-full text-sm font-semibold hover:bg-orange-50 transition-colors"
                            >
                                <Globe className="w-4 h-4" /> workyt.fr
                            </a>
                            <a
                                href="https://blog.workyt.fr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm border border-white/30 text-white rounded-full text-sm font-semibold hover:bg-white/25 transition-colors"
                            >
                                <BookOpen className="w-4 h-4" /> blog.workyt.fr
                            </a>
                        </div>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-6 py-14 md:py-20">
                    {/* ===== WORKYT EN BREF ===== */}
                    <section className="mb-20">
                        <SectionTitle kicker="Qui sommes-nous" title="Workyt en bref" />
                        <div className="prose prose-gray max-w-none text-[#374151] leading-relaxed space-y-4">
                            <p className="text-base">
                                Workyt est une <strong>association loi 1901 à but non lucratif</strong> qui
                                rend l&apos;apprentissage accessible à tous, gratuitement. Nous nous adressons
                                aux collégiens, lycéens et étudiants (11–25 ans), ainsi qu&apos;à leurs parents
                                et enseignants.
                            </p>
                            <p className="text-base">
                                Au-delà des cours et fiches de révision, notre blog publie des contenus de
                                culture générale et de vie étudiante, avec des rubriques dédiées
                                «&nbsp;Le Bon Plan&nbsp;», «&nbsp;Nos Tests&nbsp;» et «&nbsp;Conseils &amp;
                                méthodes&nbsp;» — un espace où nous mettons en avant ce qui est utile aux
                                étudiants.
                            </p>
                        </div>
                        <div className="mt-6 rounded-2xl bg-orange-50 border-l-4 border-orange-400 p-5">
                            <p className="text-sm md:text-base text-[#7c2d12]">
                                <strong className="text-[#9a3412]">Notre atout différenciant :</strong>{" "}
                                nous ne sommes pas un média de plus. Nous touchons une audience jeune,
                                scolaire et engagée, via une association à l&apos;image positive et à
                                l&apos;indépendance éditoriale réelle.
                            </p>
                        </div>
                    </section>

                    {/* ===== CHIFFRES CLÉS ===== */}
                    <section className="mb-20">
                        <SectionTitle kicker="Les preuves" title="Nos chiffres clés" />
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((s) => (
                                <div
                                    key={s.label}
                                    className="bg-white border border-[#e3e2e0] rounded-2xl p-5 text-center hover:border-orange-200 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                                        <s.icon className="w-5 h-5 text-[#f97316]" />
                                    </div>
                                    <p className="text-3xl font-bold text-[#37352f]">{s.value}</p>
                                    <p className="text-sm font-semibold text-[#37352f] mt-1">{s.label}</p>
                                    <p className="text-xs text-[#9ca3af] mt-0.5">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ===== POURQUOI ===== */}
                    <section className="mb-20">
                        <SectionTitle
                            kicker="Nos objectifs"
                            title="Pourquoi ce partenariat nous intéresse"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {objectives.map((o, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 bg-white border border-[#e3e2e0] rounded-2xl p-5 hover:border-orange-200 transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                        <o.icon className="w-4 h-4 text-[#f97316]" />
                                    </div>
                                    <p className="text-sm text-[#374151] leading-relaxed">{o.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ===== AUDIENCE ===== */}
                    <section className="mb-20">
                        <SectionTitle kicker="À qui nous parlons" title="Notre audience" />
                        <div className="rounded-2xl border border-[#e3e2e0] overflow-hidden">
                            {[
                                { label: "Profil dominant", value: "Collégiens, lycéens et étudiants (11–25 ans), + parents et enseignants" },
                                { label: "Tranche d'âge", value: "11–25 ans — cœur de cible étudiant" },
                                { label: "Géographie", value: "France francophone majoritaire" },
                                { label: "Centres d'intérêt", value: "Réussite scolaire, productivité, matériel d'étude, orientation, gaming, japonais/JLPT, vie étudiante" },
                                { label: "Engagement", value: "Communauté active sur Discord, forum d'entraide et réseaux sociaux" },
                            ].map((row, i) => (
                                <div
                                    key={row.label}
                                    className={`flex flex-col sm:flex-row gap-1 sm:gap-4 px-5 py-4 ${i % 2 === 0 ? "bg-[#faf9f7]" : "bg-white"}`}
                                >
                                    <span className="text-sm font-semibold text-[#37352f] sm:w-44 shrink-0">
                                        {row.label}
                                    </span>
                                    <span className="text-sm text-[#6b6b6b] leading-relaxed">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ===== CANAUX ===== */}
                    <section className="mb-20">
                        <SectionTitle kicker="Où nous diffusons" title="Nos canaux de diffusion" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {channels.map((c) => (
                                <div
                                    key={c.name}
                                    className="bg-white border border-[#e3e2e0] rounded-2xl p-5 hover:border-orange-200 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                            <c.icon className="w-5 h-5 text-[#f97316]" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-[#37352f]">{c.name}</h3>
                                    </div>
                                    <p className="text-xs text-[#6b6b6b] leading-relaxed mb-3">{c.formats}</p>
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#f97316] bg-orange-50 px-2.5 py-1 rounded-full">
                                        {c.link}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ===== CE QUE NOUS PROPOSONS ===== */}
                    <section className="mb-20">
                        <SectionTitle
                            kicker="Nos formules"
                            title="Ce que nous proposons aux marques"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {offers.map((o) => (
                                <div
                                    key={o.title}
                                    className="flex flex-col bg-white border border-[#e3e2e0] rounded-2xl p-6 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/40 transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                                            <o.icon className="w-5 h-5 text-[#f97316]" />
                                        </div>
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">
                                            {o.tag}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-[#37352f] mb-3">{o.title}</h3>
                                    <ul className="space-y-2.5">
                                        {o.points.map((p, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-[#6b6b6b] leading-relaxed">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-[#f97316] shrink-0 mt-0.5" />
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ===== VOUS LANCEZ UN PROJET ===== */}
                    <section className="mb-20">
                        <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/60 p-7 md:p-10">
                            <div className="absolute top-0 right-0 w-56 h-56 bg-orange-200/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-orange-600 text-xs font-semibold mb-4 border border-orange-100">
                                    <Rocket className="w-3.5 h-3.5" />
                                    Startups &amp; projets en lancement
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-[#37352f] mb-3">
                                    Vous lancez un projet ?
                                </h2>
                                <p className="text-base text-[#6b6b6b] leading-relaxed max-w-2xl mb-8">
                                    Application étudiante, service, marque qui démarre&nbsp;: faites tester
                                    votre produit par de vrais étudiants et récoltez des retours concrets,
                                    avant même d&apos;avoir un budget marketing. On adore donner un coup de
                                    pouce aux projets qui aident les jeunes.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    {launchPerks.map((p) => (
                                        <div key={p.title} className="bg-white border border-orange-100 rounded-2xl p-5">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                                                <p.icon className="w-5 h-5 text-[#f97316]" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-[#37352f] mb-1.5">{p.title}</h3>
                                            <p className="text-xs text-[#6b6b6b] leading-relaxed">{p.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <a
                                    href="#contact"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-full text-sm font-medium transition-colors"
                                >
                                    <Lightbulb className="w-4 h-4" />
                                    Proposer mon projet
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* ===== WORKYT AWARD ===== */}
                    <section className="mb-20">
                        <SectionTitle
                            kicker="Notre activation clé en main"
                            title="Le Workyt Award"
                        />
                        <p className="text-base text-[#374151] leading-relaxed mb-8 max-w-3xl">
                            Notre programme de fidélité communautaire transforme l&apos;engagement de nos
                            étudiants en réductions concrètes chez nos partenaires.{" "}
                            <strong>Aucun coût fixe, aucune gestion :</strong> vous fournissez des codes
                            promo à usage unique, Workyt s&apos;occupe de l&apos;animation, de la distribution
                            et du suivi.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {awardSteps.map((step) => (
                                <div key={step.n} className="relative bg-white border border-[#e3e2e0] rounded-2xl p-5">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-white flex items-center justify-center text-sm font-bold mb-3">
                                        {step.n}
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#37352f] mb-1">{step.title}</h3>
                                    <p className="text-xs text-[#6b6b6b] leading-relaxed">{step.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-orange-50 p-5 flex items-start gap-3">
                                <Gift className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-[#9a3412] mb-1">Côté étudiant</h4>
                                    <p className="text-xs text-[#7c2d12] leading-relaxed">
                                        Une récompense motivante qui valorise l&apos;effort et l&apos;apprentissage.
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-[#37352f] p-5 flex items-start gap-3">
                                <Target className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-1">Côté marque</h4>
                                    <p className="text-xs text-white/70 leading-relaxed">
                                        Un canal de conversion mesurable + une image d&apos;acteur engagé pour l&apos;éducation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                href="/award"
                                className="inline-flex items-center gap-2 text-sm font-medium text-[#f97316] hover:text-[#ea580c] transition-colors"
                            >
                                Découvrir le Workyt Award
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </section>

                    {/* ===== ENGAGEMENTS ===== */}
                    <section className="mb-20">
                        <SectionTitle kicker="Notre éthique" title="Nos engagements" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {commitments.map((c) => (
                                <div
                                    key={c.title}
                                    className="bg-white border border-[#e3e2e0] rounded-2xl p-5 hover:border-orange-200 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                                        <c.icon className="w-5 h-5 text-[#f97316]" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#37352f] mb-1.5">{c.title}</h3>
                                    <p className="text-xs text-[#6b6b6b] leading-relaxed">{c.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ===== COMMENT ÇA MARCHE ===== */}
                    <section className="mb-20">
                        <SectionTitle kicker="Simple et cadré" title="Comment ça marche" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {steps.map((s, i) => (
                                <div key={s.title} className="relative bg-white border border-[#e3e2e0] rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                            <s.icon className="w-5 h-5 text-[#f97316]" />
                                        </div>
                                        <span className="text-2xl font-bold text-orange-200">{i + 1}</span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#37352f] mb-1.5">{s.title}</h3>
                                    <p className="text-xs text-[#6b6b6b] leading-relaxed">{s.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ===== CONTACT + FORMULAIRE ===== */}
                    <section id="contact" className="scroll-mt-24">
                        <SectionTitle kicker="Construisons ensemble" title="Démarrer un partenariat" />
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Pitch */}
                            <div className="lg:col-span-2">
                                <div className="relative overflow-hidden bg-gradient-to-br from-[#37352f] to-[#2c2b27] rounded-2xl p-7 text-white h-full">
                                    <div className="absolute top-0 right-0 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-medium mb-4">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Réponse rapide
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 leading-snug">
                                            Soutenir Workyt, c&apos;est investir dans une génération qui apprend
                                        </h3>
                                        <p className="text-white/70 text-sm mb-6 leading-relaxed">
                                            Prêt presse, partenariat long terme, codes promo ou test de votre
                                            projet : dites-nous ce que vous cherchez, on revient vers vous avec
                                            un interlocuteur dédié.
                                        </p>
                                        <ul className="space-y-3">
                                            {[
                                                { icon: Users, t: "Audience jeune", s: "11–25 ans, scolaire et engagée" },
                                                { icon: ShieldCheck, t: "Contenus honnêtes", s: "Indépendance éditoriale réelle" },
                                                { icon: Heart, t: "Image associative", s: "Un partenaire engagé pour l'éducation" },
                                            ].map((v) => (
                                                <li key={v.t} className="flex items-start gap-3">
                                                    <v.icon className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium leading-tight">{v.t}</p>
                                                        <p className="text-xs text-white/50">{v.s}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-6 pt-5 border-t border-white/10">
                                            <a
                                                href="mailto:admin@workyt.fr"
                                                className="inline-flex items-center gap-2 text-sm text-orange-300 hover:text-orange-200 transition-colors"
                                            >
                                                <Mail className="w-4 h-4" />
                                                admin@workyt.fr
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Formulaire */}
                            <div className="lg:col-span-3">
                                <PartnershipForm />
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
    return (
        <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#f97316] mb-2">{kicker}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#37352f]">{title}</h2>
        </div>
    );
}
