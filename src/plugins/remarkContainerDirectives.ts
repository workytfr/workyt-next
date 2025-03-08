import { visit } from "unist-util-visit";

export function remarkContainerDirectives() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            // On cible uniquement les "containerDirective"
            if (node.type === "containerDirective") {
                const data = node.data || (node.data = {});
                // Le nom de la directive, ex: "definition", "exemple", etc.
                const directiveName = node.name;

                // On veut générer un <div class="definition"> ou <div class="exemple"> etc.
                data.hName = "div";
                data.hProperties = data.hProperties || {};

                // Ajoute la classe qui sera reconnue dans LessonView
                // ex: className="definition" ou "exemple"
                data.hProperties.className = directiveName;
            }
        });
    };
}
