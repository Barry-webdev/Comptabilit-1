import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { formatGNF } from '@/lib/utils';
import PdfEnTete from '@/components/rapports/PdfEnTete';
import type { IPaiement, IRecette, IDepense, IAnneeScolaire } from '@/lib/api';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: '#1A1A1A', fontFamily: 'Helvetica' },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1B6B3A', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#555', marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1B6B3A', borderBottomWidth: 1, borderBottomColor: '#1B6B3A', paddingBottom: 3, marginBottom: 6 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1B6B3A', padding: 4 },
  tableHeaderCell: { color: '#fff', fontFamily: 'Helvetica-Bold', flex: 1, fontSize: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e0d8', padding: 4 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e0d8', padding: 4, backgroundColor: '#F8F6F1' },
  cell: { flex: 1, fontSize: 8 },
  totalRow: { flexDirection: 'row', backgroundColor: '#D4A017', padding: 4, marginTop: 2 },
  totalLabel: { flex: 3, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1A1A1A' },
  totalValue: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1A1A1A', textAlign: 'right' },
  empty: { fontSize: 8, color: '#999', paddingVertical: 6 },
});

const NOMS_MOIS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

type MoisData = {
  mois: number;
  recettesScolaires: number;
  recettesAnnexes: number;
  depenses: number;
};

type Props = {
  anneeScolaire: IAnneeScolaire;
  paiements: IPaiement[];
  recettes: IRecette[];
  depenses: IDepense[];
  logoBase64?: string;
};

export default function PdfAnnuel({ anneeScolaire, paiements, recettes, depenses, logoBase64 }: Props) {
  // Extraire les années civiles à couvrir depuis le nom (ex: "2024-2025")
  const parts = anneeScolaire.nom.split('-');
  const anneeDebut = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
  const anneeFin = parts[1] ? parseInt(parts[1], 10) : anneeDebut + 1;

  // Construire une liste de mois sur l'année scolaire (Sep N à Août N+1)
  const moisParMois: MoisData[] = [];
  // Mois scolaires : Sep(9) à Déc(12) pour anneeDebut, puis Jan(1) à Août(8) pour anneeFin
  const moisAnneeScolaire: Array<{ mois: number; annee: number }> = [
    { mois: 9, annee: anneeDebut }, { mois: 10, annee: anneeDebut },
    { mois: 11, annee: anneeDebut }, { mois: 12, annee: anneeDebut },
    { mois: 1, annee: anneeFin }, { mois: 2, annee: anneeFin },
    { mois: 3, annee: anneeFin }, { mois: 4, annee: anneeFin },
    { mois: 5, annee: anneeFin }, { mois: 6, annee: anneeFin },
    { mois: 7, annee: anneeFin }, { mois: 8, annee: anneeFin },
  ];

  for (const { mois, annee } of moisAnneeScolaire) {
    const prefixe = `${annee}-${String(mois).padStart(2, '0')}`;
    const recettesScolaires = paiements
      .filter((p) => p.date.startsWith(prefixe))
      .reduce((acc, p) => acc + p.montant, 0);
    const recettesAnnexes = recettes
      .filter((r) => r.type === 'annexe' && r.date.startsWith(prefixe))
      .reduce((acc, r) => acc + r.montant, 0);
    const totalDep = depenses
      .filter((d) => d.date.startsWith(prefixe))
      .reduce((acc, d) => acc + d.montant, 0);
    moisParMois.push({ mois, recettesScolaires, recettesAnnexes, depenses: totalDep });
  }

  const grandTotalScolaire = moisParMois.reduce((acc, m) => acc + m.recettesScolaires, 0);
  const grandTotalAnnexes = moisParMois.reduce((acc, m) => acc + m.recettesAnnexes, 0);
  const grandTotalDepenses = moisParMois.reduce((acc, m) => acc + m.depenses, 0);

  // Dépenses par catégorie
  const categoriesMap: Record<string, number> = {};
  for (const d of depenses) {
    categoriesMap[d.categorie] = (categoriesMap[d.categorie] ?? 0) + d.montant;
  }
  const categoriesEntries = Object.entries(categoriesMap);

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <PdfEnTete logoBase64={logoBase64} titreRapport="Bilan Financier Annuel" sousTitreRapport={`Année scolaire : ${anneeScolaire.nom}`} />
        <Text style={styles.subtitle}>Année scolaire : {anneeScolaire.nom}</Text>

        {/* Tableau mensuel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif mensuel des recettes et dépenses</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Mois</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Recettes scolaires</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Recettes annexes</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Total recettes</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Dépenses</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Résultat</Text>
          </View>
          {moisParMois.map((m, i) => {
            const totalRec = m.recettesScolaires + m.recettesAnnexes;
            const resultat = totalRec - m.depenses;
            return (
              <View key={`${m.mois}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.cell, { flex: 1 }]}>{NOMS_MOIS[m.mois - 1]}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{m.recettesScolaires > 0 ? formatGNF(m.recettesScolaires) : '—'}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{m.recettesAnnexes > 0 ? formatGNF(m.recettesAnnexes) : '—'}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{totalRec > 0 ? formatGNF(totalRec) : '—'}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{m.depenses > 0 ? formatGNF(m.depenses) : '—'}</Text>
                <Text style={[styles.cell, { flex: 2, color: resultat >= 0 ? '#1B6B3A' : '#dc2626' }]}>
                  {formatGNF(resultat)}
                </Text>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { flex: 1 }]}>TOTAL</Text>
            <Text style={[styles.totalValue, { flex: 2 }]}>{formatGNF(grandTotalScolaire)}</Text>
            <Text style={[styles.totalValue, { flex: 2 }]}>{formatGNF(grandTotalAnnexes)}</Text>
            <Text style={[styles.totalValue, { flex: 2 }]}>{formatGNF(grandTotalScolaire + grandTotalAnnexes)}</Text>
            <Text style={[styles.totalValue, { flex: 2 }]}>{formatGNF(grandTotalDepenses)}</Text>
            <Text style={[styles.totalValue, { flex: 2 }]}>{formatGNF(grandTotalScolaire + grandTotalAnnexes - grandTotalDepenses)}</Text>
          </View>
        </View>

        {/* Dépenses par catégorie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dépenses totales par catégorie</Text>
          {categoriesEntries.length === 0 ? (
            <Text style={styles.empty}>Aucune dépense</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Catégorie</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Montant total</Text>
              </View>
              {categoriesEntries.map(([cat, montant], i) => (
                <View key={cat} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 3 }]}>{cat}</Text>
                  <Text style={[styles.cell, { flex: 2 }]}>{formatGNF(montant)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatGNF(grandTotalDepenses)}</Text>
              </View>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
