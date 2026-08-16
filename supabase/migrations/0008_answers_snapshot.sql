-- ============================================================================
-- Filet de sécurité : instantané complet des réponses validées, enregistré
-- directement sur la ligne submissions au moment de la soumission. Sert de
-- source de vérité durable indépendante de l'écriture détaillée par champ
-- dans submission_answers — si celle-ci échoue pour une raison quelconque,
-- la donnée brute reste récupérable au lieu d'être perdue silencieusement.
-- ============================================================================

alter table public.submissions
  add column if not exists answers_snapshot jsonb;
