// src/utils/fetchPdf.ts
export const fetchPdfAsBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Erreur lors de la récupération du fichier PDF.");
    }
    return await response.blob();
};
