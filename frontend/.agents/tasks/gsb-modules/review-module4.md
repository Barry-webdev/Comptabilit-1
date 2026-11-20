# Revue MODULE 4 — Rapports

**Fichiers examinés**
- `app/(protected)/rapports/page.tsx`
- `components/rapports/BoutonExportPdf.tsx`
- `components/rapports/PdfJournalier.tsx`
- `components/rapports/PdfMensuel.tsx`
- `components/rapports/PdfAnnuel.tsx`
- `components/rapports/PdfRecouvrement.tsx`
- `lib/mock-data.ts` (types `Depense`, `AnneeScolaire`)

---

## Ce qui est conforme

| Critère | Statut |
|---------|--------|
| 1. 4 onglets (Journalier, Mensuel, Annuel, Recouvrement par classe) | ✅ |
| 2. Journalier : sélecteur date, encaissements + recettes annexes + dépenses + solde clôture | ✅ |
| 3. Mensuel : sélecteurs mois/année, recettes scolaires + annexes, dépenses par catégorie, résultat net | ✅ |
| 4. Annuel : sélecteur année scolaire, recettes+dépenses par mois + dépenses par catégorie (voir blockers) | ⚠️ partiel |
| 5. Recouvrement : sélecteur classe, tableau Total dû/payé/solde/statut (Soldé/En cours/Impayé) | ✅ |
| 8. `formatGNF` sur tous les montants | ✅ |
| 9. `'use client'`, zéro `any`, zéro `as unknown` | ✅ |
| 10. Responsive, interface française | ✅ |

---

## Blockers

### B-1 — Critère 6 non respecté : `PDFDownloadLink` absent

**Fichier :** `components/rapports/BoutonExportPdf.tsx`

**Critère :** « Bouton Exporter PDF sur chaque onglet utilisant `@react-pdf/renderer` via `PDFDownloadLink` »

**Constat :** Le composant n'utilise pas `PDFDownloadLink` de `@react-pdf/renderer`. À la place, il appelle `reactPdf.pdf(...).toBlob()` puis déclenche un clic sur un `<a>` caché. C'est une API bas niveau (`pdf().toBlob()`) non prescrite. `PDFDownloadLink` n'est importé nulle part dans le module rapports.

**Correction :** Utiliser `PDFDownloadLink` de `@react-pdf/renderer` (en le chargeant dynamiquement via `dynamic(..., {ssr: false})` pour éviter l'hydratation SSR), ou obtenir de l'approbateur une dérogation explicite acceptant le patron `toBlob()` + `<a>` comme équivalent acceptable.

---

### B-2 — Critère 7 non respecté : `dynamic + ssr:false` absent

**Fichier :** `components/rapports/BoutonExportPdf.tsx`, `app/(protected)/rapports/page.tsx`

**Critère :** « Composants PDF chargés avec `dynamic + ssr:false` »

**Constat :** Aucun appel à `next/dynamic` n'existe dans le module rapports. Les composants PDF (`PdfJournalier`, `PdfMensuel`, `PdfAnnuel`, `PdfRecouvrement`) sont chargés via `import()` dynamique à l'intérieur d'une callback async passée à `fabriquerDocument`. Ce patron est SSR-safe en pratique, mais `next/dynamic` avec `ssr: false` n'est nulle part utilisé, contrairement à l'exigence littérale.

**Correction :** Charger chaque composant PDF avec `dynamic(() => import('@/components/rapports/PdfXxx'), { ssr: false })`, ou obtenir une dérogation de l'approbateur acceptant le patron `import()` inline.

---

### B-3 — Dépenses par catégorie (onglet Annuel) non filtrées par année scolaire

**Fichiers :**
- `app/(protected)/rapports/page.tsx` lignes 628–634 (`RapportAnnuel`)
- `components/rapports/PdfAnnuel.tsx` lignes 84–88

**Critère :** Critère 4 — rapport annuel affiche les données de l'année scolaire sélectionnée.

**Constat :** `categoriesMap` dans `RapportAnnuel` itère sur le tableau `depenses` brut (tout le store) sans filtrer par l'année scolaire sélectionnée :

```ts
// page.tsx ligne 630-633
for (const d of depenses) {              // ← tout le store, non filtré
  map[d.categorie] = (map[d.categorie] ?? 0) + d.montant;
}
```

La table "Recettes et dépenses par mois" filtre correctement par préfixe de date, mais la section "Dépenses totales par catégorie" additionne les dépenses de toutes les années. Même défaut dans `PdfAnnuel.tsx` ligne 85. La somme affichée pour chaque catégorie sera incorrecte dès qu'il y a des dépenses sur plusieurs années scolaires.

**Conséquence utilisateur :** Le comptable voit des totaux gonflés dans la section catégories quand il sélectionne une année scolaire antérieure à l'année courante.

**Correction :** Remplacer l'itération sur `depenses` par une itération sur les dépenses déjà filtrées par les mois de l'année scolaire. Dans `RapportAnnuel`, `donneesMois` contient déjà les totaux mensuels mais pas le détail par catégorie ; il faut filtrer `depenses` sur la plage de dates de l'année scolaire avant de construire `categoriesMap`. Même correction dans `PdfAnnuel`.

Exemple de correction dans `page.tsx` :

```ts
const categoriesMap = useMemo(() => {
  const map: Record<string, number> = {};
  for (const { mois, annee } of moisAnneeScolaire) {
    const prefixe = `${annee}-${String(mois).padStart(2, '0')}`;
    for (const d of depenses.filter((dep) => dep.date.startsWith(prefixe))) {
      map[d.categorie] = (map[d.categorie] ?? 0) + d.montant;
    }
  }
  return map;
}, [depenses, moisAnneeScolaire]);
```

---

## Verdict

**CHANGES_REQUESTED** — 3 blockers (B-1, B-2, B-3).
