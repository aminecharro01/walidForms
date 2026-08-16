import { chunk } from "@/lib/utils/chunk";

const IN_CHUNK_SIZE = 150;
export const FETCH_PAGE_SIZE = 1000;

/**
 * Exécute une requête Supabase filtrée par une longue liste d'identifiants, en gérant :
 * 1. Le découpage du filtre .in(...) en lots — évite de dépasser les limites de longueur
 *    d'URL de l'infrastructure (Cloudflare/API gateway) avec des centaines d'identifiants.
 * 2. La pagination des résultats via .range(offset, ...) — PostgREST limite chaque requête
 *    à 1000 lignes par défaut et tronque silencieusement au-delà, SANS lever d'erreur.
 * Sans ces deux précautions combinées, des lignes peuvent disparaître sans aucun signal.
 */
export async function fetchAllInBatches<T>(
  ids: string[],
  runQuery: (
    idsBatch: string[],
    offset: number
  ) => Promise<{ data: T[] | null; error: { code?: string; message: string } | null }>
): Promise<{ rows: T[]; batchErrors: string[] }> {
  const rows: T[] = [];
  const batchErrors: string[] = [];

  for (const idsBatch of chunk(ids, IN_CHUNK_SIZE)) {
    let offset = 0;
    while (true) {
      const { data, error } = await runQuery(idsBatch, offset);
      if (error) {
        batchErrors.push(`${error.code ?? ""} ${error.message}`.trim());
        break;
      }
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < FETCH_PAGE_SIZE) break;
      offset += FETCH_PAGE_SIZE;
    }
  }

  return { rows, batchErrors };
}
