import { THEMES, isClanThemeId } from '@/lib/clanThemes';
import type { WarWeek } from './types';

/**
 * Bannière d'une semaine de Guerre des Clans sur le chemin du calendrier :
 * l'icône suit le thème de la semaine (🎃 pour Halloween), la trêve est une
 * colombe. Partagé par le chemin et sa légende.
 */
export function warIcon(w: Pick<WarWeek, 'status' | 'theme'>) {
  if (w.status === 'truce') {
    return {
      icon: '🕊️',
      label: 'Trêve',
      title: 'Trêve : pas de Guerre des Clans cette semaine',
      fill: '#F0FDF4',
      ring: '#16A34A'
    };
  }
  const theme = isClanThemeId(w.theme) ? THEMES[w.theme] : THEMES.classique;
  const themed = theme.id !== 'classique' && theme.page;
  return {
    icon: themed ? theme.emoji : '⚔️',
    label: themed ? `Guerre · ${theme.label}` : 'Guerre des Clans',
    title: `Guerre des Clans${themed ? ` — ${theme.label}` : ''}${w.status === 'planned' ? ' (prévue)' : ''}`,
    // Le fond reprend la pastille du thème (sombre : l'emoji y ressort)
    fill: themed ? theme.page!.accent : '#FEF2F2',
    ring: themed ? theme.page!.ring : '#DC2626'
  };
}
