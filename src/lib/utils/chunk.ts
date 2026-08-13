/** Découpe un tableau en lots — utilisé pour éviter des filtres `.in(...)` avec
 * trop d'identifiants d'un coup, qui peuvent dépasser les limites de longueur
 * d'URL de l'infrastructure (Cloudflare/API gateway) et échouer silencieusement. */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
