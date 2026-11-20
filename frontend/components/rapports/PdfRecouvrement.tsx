import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { formatGNF } from '@/lib/utils';
import PdfEnTete from '@/components/rapports/PdfEnTete';
import type { IEleve, IPaiement, IFrais, IClasse } from '@/lib/api';

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
  totalLabel: { flex: 4, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1A1A1A' },
  totalValue: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1A1A1A', textAlign: 'right' },
  empty: { fontSize: 8, color: '#999', paddingVertical: 6 },
  badge: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, fontSize: 7 },
});

type StatutRecouvrement = 'Soldé' | 'En cours' | 'Impayé';

type LigneEleve = {
  eleve: IEleve;
  totalDu: number;
  totalPaye: number;
  solde: number;
  statut: StatutRecouvrement;
};

type Props = {
  classe: IClasse;
  eleves: IEleve[];
  paiements: IPaiement[];
  fraisParClasse: IFrais[];
  anneeScolaireId: string;
  logoBase64?: string;
};

export default function PdfRecouvrement({ classe, eleves, paiements, fraisParClasse, anneeScolaireId, logoBase64 }: Props) {
  const elevesClasse = eleves.filter(
    (e) => e.classeId === classe.id && e.anneeScolaireId === anneeScolaireId
  );

  const frais = fraisParClasse.find(
    (f) => f.classeId === classe.id && f.anneeScolaireId === anneeScolaireId
  );

  const lignes: LigneEleve[] = elevesClasse.map((eleve) => {
    const totalDu = frais?.totalAnnuel ?? 0;
    const totalPaye = paiements
      .filter((p) => p.eleveId === eleve.id && p.anneeScolaireId === anneeScolaireId)
      .reduce((acc, p) => acc + p.montant, 0);
    const solde = Math.max(0, totalDu - totalPaye);
    let statut: StatutRecouvrement;
    if (solde === 0) statut = 'Soldé';
    else if (totalPaye > 0) statut = 'En cours';
    else statut = 'Impayé';
    return { eleve, totalDu, totalPaye, solde, statut };
  });

  const grandTotalDu = lignes.reduce((acc, l) => acc + l.totalDu, 0);
  const grandTotalPaye = lignes.reduce((acc, l) => acc + l.totalPaye, 0);
  const grandTotalSolde = lignes.reduce((acc, l) => acc + l.solde, 0);

  function couleurStatut(statut: StatutRecouvrement): string {
    if (statut === 'Soldé') return '#1B6B3A';
    if (statut === 'En cours') return '#D4A017';
    return '#dc2626';
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfEnTete logoBase64={logoBase64} titreRapport="Rapport de Recouvrement par Classe" sousTitreRapport={`Classe : ${classe.libelle}`} />
        <Text style={styles.subtitle}>Classe : {classe.libelle}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Situation de recouvrement</Text>
          {lignes.length === 0 ? (
            <Text style={styles.empty}>Aucun élève dans cette classe</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Matricule</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Nom & Prénom</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Total dû</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Total payé</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Solde restant</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Statut</Text>
              </View>
              {lignes.map((ligne, i) => (
                <View key={ligne.eleve.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 1.5, fontFamily: 'Helvetica' }]}>{ligne.eleve.matricule}</Text>
                  <Text style={[styles.cell, { flex: 2 }]}>{ligne.eleve.prenom} {ligne.eleve.nom}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{formatGNF(ligne.totalDu)}</Text>
                  <Text style={[styles.cell, { flex: 1.5, color: '#1B6B3A' }]}>{formatGNF(ligne.totalPaye)}</Text>
                  <Text style={[styles.cell, { flex: 1.5, color: ligne.solde > 0 ? '#dc2626' : '#1B6B3A' }]}>{formatGNF(ligne.solde)}</Text>
                  <Text style={[styles.cell, { flex: 1, color: couleurStatut(ligne.statut), fontFamily: 'Helvetica-Bold' }]}>{ligne.statut}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { flex: 3.5 }]}>TOTAL</Text>
                <Text style={[styles.totalValue, { flex: 1.5 }]}>{formatGNF(grandTotalDu)}</Text>
                <Text style={[styles.totalValue, { flex: 1.5 }]}>{formatGNF(grandTotalPaye)}</Text>
                <Text style={[styles.totalValue, { flex: 1.5 }]}>{formatGNF(grandTotalSolde)}</Text>
                <Text style={[styles.totalValue, { flex: 1 }]}> </Text>
              </View>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
