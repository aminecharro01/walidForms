-- ============================================================================
-- Langue par formulaire : détermine le sens d'affichage (rtl pour l'arabe,
-- ltr pour le français) et les textes système fixes (bouton d'envoi, messages
-- de validation, etc.) sur la page publique du formulaire. Indépendante de la
-- langue de l'interface admin.
-- ============================================================================

alter table public.forms
  add column if not exists language text not null default 'ar' check (language in ('ar', 'fr'));
