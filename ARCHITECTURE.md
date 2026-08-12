# Architecture — منصة النماذج (walidForms)

Plateforme SaaS de création et collecte de formulaires avec géolocalisation GPS, logique conditionnelle et dashboard analytics. Interface entièrement en arabe (RTL).

---

## Étape 1 — Architecture du projet

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx                     # overview
│   │   │   ├── forms/page.tsx                # liste des formulaires
│   │   │   ├── forms/create/page.tsx
│   │   │   ├── forms/[id]/edit/page.tsx      # form builder
│   │   │   ├── forms/[id]/responses/page.tsx
│   │   │   ├── forms/[id]/analytics/page.tsx
│   │   │   ├── forms/[id]/share/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── layout.tsx                        # sidebar + protection
│   ├── f/[publicFormId]/page.tsx              # formulaire public
│   ├── api/
│   │   ├── forms/[id]/submit/route.ts         # soumission (validation serveur)
│   │   ├── forms/[id]/export/route.ts         # export Excel
│   │   └── conditions/validate/route.ts
│   ├── layout.tsx                             # RTL + lang=ar + fonts
│   ├── page.tsx                               # landing page
│   └── globals.css
│
├── components/
│   ├── ui/              # Button, Card, Modal, Dropdown, Tooltip, Badge, Skeleton, EmptyState...
│   ├── dashboard/        # Sidebar, StatCard, RecentList, TopNav
│   ├── form-builder/     # Canvas, FieldPalette, PropertiesPanel, FieldItem, ConditionBuilder
│   ├── form-renderer/    # FieldRenderer + un composant par type de champ
│   ├── maps/             # LeafletMap, LocationPicker, ResponsesMap
│   └── charts/           # BarChart, LineChart, PieChart (wrappers recharts)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts     # client navigateur (anon key)
│   │   ├── server.ts     # client serveur (Server Components/Actions, cookies)
│   │   └── middleware.ts
│   ├── validation/       # schémas Zod par type de champ + validation de soumission
│   ├── conditions/       # ConditionEngine (pur, testable, sans dépendance UI)
│   ├── export/           # génération XLSX
│   └── utils/            # cn(), formatters, id generators
│
├── types/
│   ├── form.ts           # Form, FormVersion, FormField, FieldType, FieldOption
│   ├── condition.ts       # Condition, ConditionOperator, ConditionAction
│   └── submission.ts      # Submission, SubmissionAnswer, LocationAnswer
│
├── hooks/
│   ├── useGeolocation.ts
│   ├── useAutosave.ts
│   ├── useConditionEngine.ts
│   └── useSupabaseUser.ts
│
└── middleware.ts          # protection routes /dashboard/**
```

**Décision d'architecture :** séparation stricte UI / logique métier / accès données. Le `ConditionEngine` et la validation Zod sont des modules purs sans dépendance React, testables indépendamment et réutilisables côté serveur (API routes) et côté client (rendu formulaire public).

---

## Étape 2 — Schéma PostgreSQL / Supabase

Tables principales (voir migrations SQL dans `supabase/migrations/`) :

- **profiles** — extension de `auth.users`, un par administrateur.
- **forms** — méta-formulaire (titre, description, statut, propriétaire), stable dans le temps.
- **form_versions** — chaque publication crée une version immuable. Les réponses sont toujours liées à une version précise → modifier un formulaire publié ne casse jamais les anciennes réponses.
- **form_fields** — champs d'une version (type, label, ordre, requis, config JSONB pour placeholder/validation).
- **form_field_options** — options pour radio/checkbox/select.
- **form_conditions** — règles de logique conditionnelle (field source, opérateur, valeur, action, field cible), rattachées à une version.
- **submissions** — une soumission = une ligne, liée à `form_version_id`, avec métadonnées (IP hashée, user agent, date).
- **submission_answers** — réponses individuelles en JSONB (flexible, évite une colonne SQL par question). Une ligne par champ répondu, avec `field_id`, `value_json`, et colonnes dédiées `location_lat/lng/accuracy` pour les requêtes géographiques performantes.
- **file_uploads** — métadonnées des fichiers uploadés vers Supabase Storage, liés à `submission_answers`.

**Décision d'architecture :** JSONB pour `submission_answers.value_json` au lieu d'une colonne par question — les formulaires sont dynamiques et créés par l'utilisateur, une colonne SQL fixe par question serait ingérable. En contrepartie, latitude/longitude/accuracy sont dupliquées en colonnes typées `double precision` pour permettre des requêtes spatiales et un tri/filtre rapides sans parser du JSON à chaque fois.

---

## Étape 3 — Relations entre les tables

```
profiles (1) ──< (N) forms
forms (1) ──< (N) form_versions
form_versions (1) ──< (N) form_fields
form_fields (1) ──< (N) form_field_options
form_versions (1) ──< (N) form_conditions
form_versions (1) ──< (N) submissions
submissions (1) ──< (N) submission_answers
submission_answers (1) ──< (0..1) file_uploads
```

- `forms.current_version_id` pointe vers la version active affichée dans le builder.
- `forms.published_version_id` pointe vers la version actuellement publique (peut différer de `current_version_id` si l'admin a des brouillons non publiés).
- Suppression en cascade contrôlée : supprimer un `form` supprime ses versions/champs/conditions ; les `submissions` sont conservées par défaut (soft constraint) sauf suppression explicite assumée par l'admin.

---

## Étape 4 — Policies RLS

Principes :

1. **profiles** : un utilisateur ne lit/modifie que sa propre ligne.
2. **forms / form_versions / form_fields / form_field_options / form_conditions** : lecture/écriture réservée au propriétaire (`owner_id = auth.uid()`) pour les opérations admin ; lecture publique **limitée** aux versions dont `forms.status = 'published'` via une vue/fonction dédiée pour le rendu du formulaire public (sans exposer les formulaires non publiés d'autres utilisateurs).
3. **submissions / submission_answers** : 
   - INSERT autorisé pour `anon` **uniquement** si le formulaire cible est publié (vérifié via une fonction SQL `is_form_publicly_submittable(form_version_id)`).
   - SELECT interdit pour `anon` — jamais de lecture publique des réponses.
   - SELECT/DELETE réservés au propriétaire du formulaire parent.
4. **file_uploads** : mêmes règles que submissions ; URLs signées générées à la demande, jamais de bucket public pour les fichiers utilisateurs.

Toutes les policies sont définies dans les migrations SQL avec `auth.uid()` et des fonctions `SECURITY DEFINER` pour les vérifications croisées (ex. vérifier qu'un `form_version_id` appartient bien à un formulaire publié sans exposer toute la table `forms` à `anon`).

---

## Étape 5 — Architecture Next.js

- **App Router** avec groupes de routes `(auth)` et `(dashboard)` pour des layouts distincts.
- **Server Components par défaut** pour les pages de données (liste formulaires, réponses, analytics) → fetch direct via le client Supabase serveur, pas de round-trip API inutile.
- **Client Components** uniquement pour : form builder (drag & drop, état local complexe), formulaire public (géolocalisation, interactivité), graphiques (recharts), modals/dropdowns.
- **Route Handlers** (`app/api/**`) pour : soumission publique (validation serveur obligatoire, ne jamais faire confiance au client), export Excel (génération streamée), validation de conditions côté serveur.
- **Middleware** pour protéger `/dashboard/**` (redirection vers `/login` si session absente) et gérer le refresh de session Supabase.

---

## Étape 6 — Architecture du Form Builder

```
FormBuilderPage (Client Component)
 ├── FieldPalette        → liste des types de champs disponibles, draggable
 ├── BuilderCanvas        → dnd-kit SortableContext, liste ordonnée des champs
 │     └── FieldItem × N  → aperçu du champ + actions (dupliquer/supprimer/déplacer)
 ├── PropertiesPanel      → édite le champ sélectionné (label, requis, options, validation)
 ├── ConditionsPanel      → liste/éditeur de règles (ConditionBuilder)
 └── PreviewModal         → rend le formulaire tel qu'il apparaîtra publiquement
```

État géré via un reducer local (`useFormBuilderState`) synchronisé avec Supabase via autosave debounced (2s après la dernière modification). Indicateur "غير محفوظ" / "تم الحفظ" reflète l'état de synchronisation.

`dnd-kit` gère le drag & drop pour réordonner les champs (`@dnd-kit/sortable`) et pour glisser un type de champ depuis la palette vers le canvas.

---

## Étape 7 — Moteur de logique conditionnelle

Module pur dans `lib/conditions/engine.ts`, sans dépendance React :

```ts
type ConditionEngineInput = {
  currentAnswers: Record<string, unknown>;
  conditions: Condition[];
  fields: FormField[];
};

function evaluateVisibility(input: ConditionEngineInput): Set<string> /* visibleFieldIds */
```

- Chaque `Condition` a : `sourceFieldId`, `operator`, `value`, `action` ('show' | 'hide'), `targetFieldId`.
- Un champ est visible par défaut sauf s'il est la cible d'au moins une condition avec action `hide` qui s'évalue à vraie, ou caché par défaut s'il est uniquement montré par une condition `show`.
- Opérateurs supportés : `equals, not_equals, contains, greater_than, less_than, greater_or_equal, less_or_equal, is_empty, is_not_empty`.
- Le même moteur tourne côté client (React, recalcul à chaque changement de réponse via `useMemo`) et côté serveur (API route de soumission) pour ignorer/rejeter les réponses à des champs qui auraient dû rester cachés — défense en profondeur.
- Extensible : le type `ConditionAction` est une union ouverte, `require`/`disable`/`redirect`/`skip_section` pourront s'ajouter sans casser l'existant.

---

## Étape 8 — Stratégie GPS

- Champ `LocationField` utilise `navigator.geolocation.getCurrentPosition`.
- Flux : bouton "تحديد موقعي" → état `idle | requesting | success | error | denied` → affichage clair à chaque étape.
- Permission jamais demandée automatiquement au chargement — uniquement au clic utilisateur (conformité confidentialité, §33).
- En cas de refus/erreur : message explicite, le formulaire reste soumissible si le champ n'est pas obligatoire.
- Valeur stockée : `{ latitude, longitude, accuracy, capturedAt }`.
- Affichage carte optionnel via **Leaflet + OpenStreetMap** (gratuit, pas de clé API) — un composant `LocationPicker` affiche la position sur une mini-carte après capture, et `ResponsesMap` affiche tous les points GPS des réponses d'un formulaire avec markers groupés (clustering léger si volumineux).

---

## Étape 9 — Stratégie d'export Excel

- Librairie **`exceljs`** (open source, pas de dépendance payante), utilisée côté route handler serveur pour éviter de charger de grosses réponses côté client.
- Colonnes générées dynamiquement à partir de `form_fields` de la version consultée (une colonne par champ, libellés en arabe conservés), plus colonnes fixes : `ID`, `تاريخ الإرسال`, et si un champ GPS existe : `خط العرض`, `خط الطول`, `دقة الموقع`.
- Génération streamée pour rester dans les limites mémoire du free tier Vercel (pagination des submissions par lots de 500 lors de la construction du classeur).
- Format `.xlsx` avec en-têtes stylés (gras, fond coloré) pour un rendu professionnel.

---

## Étape 10 — Stratégie de déploiement (Vercel Free + Supabase Free)

- **Supabase** : projet gratuit, migrations appliquées via `supabase db push` ou SQL éditeur ; Storage bucket privé pour fichiers avec URLs signées à durée limitée ; Auth email/password activé (pas de SMS payant).
- **Vercel** : déploiement Git-connecté, variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` côté client ; `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur, jamais exposée au bundle client).
- Pas de service tiers payant : cartes = OpenStreetMap/Leaflet, graphiques = Recharts (open source), Excel = ExcelJS (open source), QR code = `qrcode` (open source, génération locale).
- Rate limiting basique sur la route de soumission publique via vérification simple (timestamp + fingerprint léger) sans service payant dédié — solution pragmatique compatible free tier, amélioration possible plus tard avec Upstash Redis (free tier disponible si besoin).

---

## Plan d'implémentation (phases)

Suit exactement les 11 phases du cahier des charges (§35) : Foundation → Form management → Form Builder → Public Forms → GPS → Conditional Logic → Responses → Analytics → Excel → Polish → Deployment.

Chaque phase est développée avec des données réellement connectées à Supabase — aucune donnée hardcodée simulée une fois la configuration Supabase en place, conformément à la règle §36.
