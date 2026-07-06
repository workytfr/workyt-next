import React from "react";

/**
 * Indicateur de champ obligatoire — la mascotte Foxy 🦊 en tout petit,
 * à la place de la classique étoile rouge.
 *
 * Usage :
 *   <label>Titre <RequiredMark /></label>
 */
export default function RequiredMark({
  size = 14,
  className = "",
  title = "Champ obligatoire",
}: {
  /** Taille en pixels (garder petit). */
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={`inline-block align-middle ml-1 -translate-y-px ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        aria-hidden="true"
        focusable="false"
      >
        {/* Oreilles */}
        <path fill="#ea580c" d="M3.2 2.8 8.5 6.8 4.8 11.5z" />
        <path fill="#ea580c" d="M20.8 2.8 15.5 6.8 19.2 11.5z" />
        {/* Tête */}
        <path
          fill="#f97316"
          d="M12 5.5c-4.1 0-7.2 3-7.2 6.9 0 3.4 3.2 6.1 7.2 6.1s7.2-2.7 7.2-6.1c0-3.9-3.1-6.9-7.2-6.9z"
        />
        {/* Museau clair */}
        <path
          fill="#fff7ed"
          d="M12 11.6c-2.1 0-3.4 1.1-3.4 2.9L12 18l3.4-3.5c0-1.8-1.3-2.9-3.4-2.9z"
        />
        {/* Yeux */}
        <circle cx="9.3" cy="11.4" r="1.05" fill="#1f2937" />
        <circle cx="14.7" cy="11.4" r="1.05" fill="#1f2937" />
        {/* Truffe */}
        <circle cx="12" cy="14.6" r="1" fill="#1f2937" />
      </svg>
    </span>
  );
}
