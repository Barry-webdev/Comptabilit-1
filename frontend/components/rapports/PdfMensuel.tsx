import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { formatGNF } from '@/lib/utils';
import PdfEnTete from '@/components/rapports/PdfEnTete';
import type { IPaiement, IRecette, IDepense, IEleve } from '@/lib/api';

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
  resultBox: { marginTop: 16, padding: 10, backgroundColor: '#1B6B3A', borderRadius: 4 },
  resultLabel: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 11 },
  empty: { fontSize: 8, color: '#999', paddingVertical: 6 },
  statsRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  statBox: { flex: 1, padding: 8, backgroundColor: '#F8F6F1', borderRadius: 4, borderWidth: 1, borderColor: '#e5e0d8' },
  statLabel: { fontSize: 7, color: '#555' },
  statValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1B6B3A', marginTop: 2 },
});

const NOMS_MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type Props = {
  mois: number;
  annee: number;
  paiements: IPaiement[];
  recettes: IRecette[];
  depenses: IDepense[];
  eleves: IEleve[];
  logoBase64?: string;
};

export default function PdfMensuel({ mois, annee, paiements, recettes, depenses, eleves, logoBase64 }: Props) {
  const paddedMois = String(mois).padStart(2, '0');
  const prefixe = `${annee}-${paddedMois}`;

  const paiementsMois = paiements.filter((p) => p.date.startsWith(prefixe));
  const recettesAnnexesMois = recettes.filter((r) => r.type === 'annexe' && r.date.startsWith(prefixe));
  const depensesMois = depenses.filter((d) => d.date.startsWith(prefixe));

  const totalScolaire = paiementsMois.reduce((acc, p) => acc + p.montant, 0);
  const totalAnnexes = recettesAnnexesMois.reduce((acc, r) => acc + r.montant, 0);
  const totalRecettes = totalScolaire + totalAnnexes;
  const totalDepenses = depensesMois.reduce((acc, d) => acc + d.montant, 0);
  const resultatNet = totalRecettes - totalDepenses;

  // Dépenses par catégorie
  const categoriesMap: Record<string, number> = {};
  for (const d of depensesMois) {
    categoriesMap[d.categorie] = (categoriesMap[d.categorie] ?? 0) + d.montant;
  }
  const categories = Object.entries(categoriesMap);

  function nomEleve(eleveId: string): string {
    const e = eleves.find((el) => el.id === eleveId);
    return e ? `${e.prenom} ${e.nom}` : eleveId;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfEnTete logoBase64={logoBase64} titreRapport="Rapport Financier Mensuel" sousTitreRapport={`${NOMS_MOIS[mois - 1]} ${annee}`} />
        <Text style={styles.subtitle}>{NOMS_MOIS[mois - 1]} {annee}</Text>

        {/* Statistiques */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Recettes scolaires</Text>
            <Text style={styles.statValue}>{formatGNF(totalScolaire)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Recettes annexes</Text>
            <Text style={styles.statValue}>{formatGNF(totalAnnexes)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total dépenses</Text>
            <Text style={styles.statValue}>{formatGNF(totalDepenses)}</Text>
          </View>
        </View>

        {/* Recettes scolaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recettes scolaires du mois</Text>
          {paiementsMois.length === 0 ? (
            <Text style={styles.empty}>Aucun paiement ce mois</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Élève</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tranche</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Montant</Text>
              </View>
              {paiementsMois.map((p, i) => (
                <View key={p.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 2 }]}>{nomEleve(p.eleveId)}</Text>
                  <Text style={[styles.cell, { flex: 1 }]}>{p.tranche}</Text>
                  <Text style={[styles.cell, { flex: 1 }]}>{p.date}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{formatGNF(p.montant)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total scolaire</Text>
                <Text style={styles.totalValue}>{formatGNF(totalScolaire)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Recettes annexes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recettes annexes du mois</Text>
          {recettesAnnexesMois.length === 0 ? (
            <Text style={styles.empty}>Aucune recette annexe ce mois</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Libellé</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Montant</Text>
              </View>
              {recettesAnnexesMois.map((r, i) => (
                <View key={r.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 2.5 }]}>{r.libelle}</Text>
                  <Text style={[styles.cell, { flex: 1 }]}>{r.date}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{formatGNF(r.montant)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total annexes</Text>
                <Text style={styles.totalValue}>{formatGNF(totalAnnexes)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Dépenses par catégorie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dépenses par catégorie</Text>
          {categories.length === 0 ? (
            <Text style={styles.empty}>Aucune dépense ce mois</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Catégorie</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Montant</Text>
              </View>
              {categories.map(([cat, montant], i) => (
                <View key={cat} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 3 }]}>{cat}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{formatGNF(montant)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total dépenses</Text>
                <Text style={styles.totalValue}>{formatGNF(totalDepenses)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Résultat net */}
        <View style={[styles.resultBox, { backgroundColor: resultatNet >= 0 ? '#1B6B3A' : '#dc2626' }]}>
          <Text style={styles.resultLabel}>
            Résultat net : {formatGNF(resultatNet)} {resultatNet >= 0 ? '(Excédent)' : '(Déficit)'}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
