/**
 * pdfjs-dist 5 publie `build/pdf.mjs` déjà empaqueté par webpack : le fichier
 * déclare au niveau module `var __webpack_require__` et `var __webpack_exports__`.
 * Rempaqueté par notre webpack en dev (modules non concaténés), ces `var`
 * masquent les paramètres du même nom de l'enveloppe de module, et
 * `__webpack_require__.r(__webpack_exports__)` plante :
 * « Object.defineProperty called on non-object ».
 * On renomme donc ces deux identifiants dans ce seul fichier.
 */
module.exports = function pdfjsRenameLoader(source) {
    return source
        .replace(/\b__webpack_require__\b/g, "__pdfjs_require__")
        .replace(/\b__webpack_exports__\b/g, "__pdfjs_exports__");
};
