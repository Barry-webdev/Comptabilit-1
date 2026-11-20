'use client';

import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { IRecu, IEleve } from '@/lib/api';
import { formatGNF, formatDateHeure } from '@/lib/utils';
import Button from '@/components/ui/Button';

type Props = {
  recu: IRecu;
  eleve: IEleve;
  classe: string;
  annee: string;
  nomComptable: string;
  motif: string;
  isDuplicate?: boolean;
  onFermer: () => void;
};

// ─── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    size: 'A4',
    paddingHorizontal: 36,
    paddingVertical: 28,
    fontFamily: 'Helvetica',
    color: '#1A1A1A',
    fontSize: 9,
    backgroundColor: '#FFFFFF',
  },

  // Bloc A6 (demi-page A4)
  bloc: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  // Étiquette exemplaire
  etiquette: {
    textAlign: 'center',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: '0.5pt solid #d1d5db',
  },

  // Mention DUPLICATA en rouge
  duplicata: {
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    letterSpacing: 1,
    marginBottom: 6,
    padding: '3 0',
    border: '1pt solid #dc2626',
  },

  // En-tête établissement
  enTete: {
    textAlign: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: '1pt solid #e5e7eb',
  },
  titrePrincipal: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 2,
    color: '#1B6B3A',
  },
  sousTitre: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 3,
  },
  titreRecu: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#1B6B3A',
    marginTop: 3,
  },

  // Corps
  section: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2.5,
    paddingBottom: 2,
    borderBottom: '0.3pt solid #f3f4f6',
  },
  label: {
    color: '#6b7280',
    width: '45%',
    fontSize: 8,
  },
  valeur: {
    width: '55%',
    textAlign: 'right',
    fontSize: 8,
  },
  valeurGras: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#1A1A1A',
  },
  valeurDanger: {
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
  },
  valeurSuccess: {
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  separateur: {
    borderTop: '0.5pt dashed #d1d5db',
    marginVertical: 5,
  },

  // Signatures
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 6,
    borderTop: '0.5pt solid #e5e7eb',
  },
  signatureZone: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 7,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  signatureLigne: {
    borderBottom: '0.5pt solid #d1d5db',
    marginTop: 14,
  },

  // Ligne de découpe séparant les 2 blocs
  ligneDecoupe: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 2,
  },
  tiretGauche: {
    flex: 1,
    borderTop: '1pt dashed #9ca3af',
  },
  symboleCiseaux: {
    fontSize: 11,
    color: '#9ca3af',
    marginHorizontal: 6,
  },
  tiretDroit: {
    flex: 1,
    borderTop: '1pt dashed #9ca3af',
  },
});

// ─── Composant interne : un bloc de reçu ───────────────────────────────────

type BlocProps = Omit<Props, 'onFermer'> & { etiquette: string };

function BlocRecu({
  recu,
  eleve,
  classe,
  annee,
  nomComptable,
  motif,
  isDuplicate,
  etiquette,
}: BlocProps) {
  return (
    <View style={s.bloc}>
      {/* Étiquette exemplaire */}
      <Text style={s.etiquette}>{etiquette}</Text>

      {/* DUPLICATA si applicable */}
      {isDuplicate && <Text style={s.duplicata}>DUPLICATA</Text>}

      {/* En-tête établissement */}
      <View style={s.enTete}>
        <Text style={s.titrePrincipal}>
          GROUPE SCOLAIRE ELHADJ AMADOU BENDOUGOU BAH
        </Text>
        <Text style={s.sousTitre}>Conakry — République de Guinée</Text>
        <Text style={s.titreRecu}>REÇU DE PAIEMENT</Text>
      </View>

      {/* Corps */}
      <View style={s.section}>
        <View style={s.row}>
          <Text style={s.label}>N° Reçu</Text>
          <Text style={s.valeur}>{recu.numero}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Date / Heure</Text>
          <Text style={s.valeur}>{formatDateHeure(recu.date)}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Matricule</Text>
          <Text style={s.valeur}>{eleve.matricule}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Nom complet</Text>
          <Text style={s.valeur}>
            {eleve.prenom} {eleve.nom}
          </Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Classe</Text>
          <Text style={s.valeur}>{classe}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Année scolaire</Text>
          <Text style={s.valeur}>{annee}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Motif</Text>
          <Text style={s.valeur}>{motif}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Comptable</Text>
          <Text style={s.valeur}>{nomComptable}</Text>
        </View>

        <View style={s.separateur} />

        <View style={s.row}>
          <Text style={s.label}>Montant versé</Text>
          <Text style={[s.valeur, s.valeurGras]}>
            {formatGNF(recu.montantVerse)}
          </Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Solde restant</Text>
          <Text
            style={[
              s.valeur,
              recu.soldeRestant > 0 ? s.valeurDanger : s.valeurSuccess,
            ]}
          >
            {formatGNF(recu.soldeRestant)}
          </Text>
        </View>
      </View>

      {/* Signatures */}
      <View style={s.signatures}>
        <View style={s.signatureZone}>
          <Text style={s.signatureLabel}>Signature du comptable</Text>
          <View style={s.signatureLigne} />
        </View>
        <View style={s.signatureZone}>
          <Text style={[s.signatureLabel, { textAlign: 'right' }]}>
            Cachet de l&apos;établissement
          </Text>
          <View style={s.signatureLigne} />
        </View>
      </View>
    </View>
  );
}

// ─── Document PDF complet : A4 portrait, 2 blocs A6 ───────────────────────

function RecuDocument(props: Omit<Props, 'onFermer'>) {
  return (
    <Document>
      <Page size="A4" orientation="portrait" style={s.page}>
        {/* Bloc supérieur — exemplaire parent / tuteur */}
        <BlocRecu {...props} etiquette="Exemplaire Parent / Tuteur" />

        {/* Ligne de découpe */}
        <View style={s.ligneDecoupe}>
          <View style={s.tiretGauche} />
          <Text style={s.symboleCiseaux}>✂</Text>
          <View style={s.tiretDroit} />
        </View>

        {/* Bloc inférieur — exemplaire archives */}
        <BlocRecu
          {...props}
          etiquette="Exemplaire Archives Établissement"
        />
      </Page>
    </Document>
  );
}

// ─── Export par défaut ─────────────────────────────────────────────────────

export default function GenerateurPDF({
  recu,
  eleve,
  classe,
  annee,
  nomComptable,
  motif,
  isDuplicate,
  onFermer,
}: Props) {
  const nomFichier = `recu-${recu.numero}-${eleve.matricule}.pdf`;

  return (
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <PDFDownloadLink
        document={
          <RecuDocument
            recu={recu}
            eleve={eleve}
            classe={classe}
            annee={annee}
            nomComptable={nomComptable}
            motif={motif}
            isDuplicate={isDuplicate}
          />
        }
        fileName={nomFichier}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 6,
          backgroundColor: '#1B6B3A',
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 600,
          padding: '8px 16px',
          textDecoration: 'none',
        }}
      >
        {({ loading }) => (loading ? 'Préparation…' : 'Télécharger le PDF')}
      </PDFDownloadLink>
      <Button variant="ghost" size="sm" onClick={onFermer}>
        Annuler
      </Button>
    </div>
  );
}
