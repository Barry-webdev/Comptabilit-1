import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { formatGNF } from '@/lib/utils';
import PdfEnTete from '@/components/rapports/PdfEnTete';
import type { IPaiement, IRecette, IDepense, IEleve, IRecu } from '@/lib/api';

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
  soldeBox: { marginTop: 16, padding: 10, backgroundColor: '#1B6B3A', borderRadius: 4 },
  soldeLabel: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 11 },
  empty: { fontSize: 8, color: '#999', paddingVertical: 6 },
});

type Props = {
  date: string;
  paiements: IPaiement[];
  recettes: IRecette[];
  depenses: IDepense[];
  eleves: IEleve[];
  recus: IRecu[];
  logoBase64?: string;
};

export default function PdfJournalier({ date, paiements, recettes, depenses, eleves, recus, logoBase64 }: Props) {
  const paiementsJour = paiements.filter((p) => p.date === date);
  const recettesAnnexesJour = recettes.filter((r) => r.type === 'annexe' && r.date === date);
  const depensesJour = depenses.filter((d) => d.date === date);

  const totalEncaissements = paiementsJour.reduce((acc, p) => acc + p.montant, 0);
  const totalAnnexes = recettesAnnexesJour.reduce((acc, r) => acc + r.montant, 0);
  const totalDepenses = depensesJour.reduce((acc, d) => acc + d.montant, 0);
  const soldeCloture = totalEncaissements + totalAnnexes - totalDepenses;

  function nomEleve(eleveId: string): string {
    const e = eleves.find((el) => el.id === eleveId);
    return e ? `${e.prenom} ${e.nom}` : eleveId;
  }

  function numeroRecu(recuId: string): string {
    return recus.find((r) => r.id === recuId)?.numero ?? recuId;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfEnTete logoBase64={logoBase64} titreRapport="Journal de Caisse Journalier" sousTitreRapport={`Date : ${date}`} />

        {/* Encaissements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Encaissements du jour</Text>
          {paiementsJour.length === 0 ? (
            <Text style={styles.empty}>Aucun encaissement ce jour</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>N° Reçu</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Élève</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Montant</Text>
              </View>
              {paiementsJour.map((p, i) => (
                <View key={p.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{numeroRecu(p.recuId)}</Text>
                  <Text style={[styles.cell, { flex: 2 }]}>{nomEleve(p.eleveId)}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{formatGNF(p.montant)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total encaissements</Text>
                <Text style={styles.totalValue}>{formatGNF(totalEncaissements)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Recettes annexes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recettes annexes du jour</Text>
          {recettesAnnexesJour.length === 0 ? (
            <Text style={styles.empty}>Aucune recette annexe ce jour</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Libellé</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Catégorie</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Montant</Text>
              </View>
              {recettesAnnexesJour.map((r, i) => (
                <View key={r.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 2 }]}>{r.libelle}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{r.categorie}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{formatGNF(r.montant)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total recettes annexes</Text>
                <Text style={styles.totalValue}>{formatGNF(totalAnnexes)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Dépenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dépenses du jour</Text>
          {depensesJour.length === 0 ? (
            <Text style={styles.empty}>Aucune dépense ce jour</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Motif</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Catégorie</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Montant</Text>
              </View>
              {depensesJour.map((d, i) => (
                <View key={d.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 2 }]}>{d.motif}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{d.categorie}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{formatGNF(d.montant)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total dépenses</Text>
                <Text style={styles.totalValue}>{formatGNF(totalDepenses)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Solde */}
        <View style={styles.soldeBox}>
          <Text style={styles.soldeLabel}>
            Solde de clôture : {formatGNF(soldeCloture)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
