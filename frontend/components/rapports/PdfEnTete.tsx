import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const s = StyleSheet.create({
  enTete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1B6B3A',
  },
  gauche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 48,
    height: 48,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: '#1B6B3A',
    borderRadius: 6,
  },
  texteEtablissement: {
    flexDirection: 'column',
  },
  nomEtablissement: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1B6B3A',
    textTransform: 'uppercase',
    lineHeight: 1.3,
    maxWidth: 240,
  },
  sousTitre: {
    fontSize: 8,
    color: '#555',
    marginTop: 2,
  },
  droite: {
    textAlign: 'right',
  },
  titreDroit: {
    fontSize: 9,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  repLogoText: {
    fontSize: 8,
    color: '#888',
    marginTop: 2,
  },
});

type Props = {
  logoBase64?: string;
  titreRapport: string;
  sousTitreRapport?: string;
};

export default function PdfEnTete({ logoBase64, titreRapport, sousTitreRapport }: Props) {
  return (
    <View style={s.enTete}>
      <View style={s.gauche}>
        {logoBase64 ? (
          <Image src={logoBase64} style={s.logo} />
        ) : (
          <View style={s.logoPlaceholder} />
        )}
        <View style={s.texteEtablissement}>
          <Text style={s.nomEtablissement}>
            Groupe Scolaire Elhadj Amadou Bendougou Bah
          </Text>
          <Text style={s.sousTitre}>Conakry — République de Guinée</Text>
          <Text style={s.sousTitre}>REPUBLIQUE DE GUINÉE — TRAVAIL · JUSTICE · SOLIDARITÉ</Text>
        </View>
      </View>
      <View style={s.droite}>
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1B6B3A' }}>
          {titreRapport}
        </Text>
        {sousTitreRapport && (
          <Text style={{ fontSize: 9, color: '#555', marginTop: 3 }}>{sousTitreRapport}</Text>
        )}
      </View>
    </View>
  );
}
