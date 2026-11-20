'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';

type Props = {
  nomFichier: string;
  /**
   * Fabrique le document React-PDF de manière asynchrone (dynamic import de la
   * lib et du composant à l'intérieur). Cette fonction est appelée uniquement
   * côté client au moment du clic. Aucun import statique de @react-pdf/renderer
   * ne doit figurer dans ce fichier ou dans la page principale.
   */
  fabriquerDocument: () => Promise<React.ReactElement>;
};

type EtatBouton = 'inactif' | 'generation' | 'pret';

export default function BoutonExportPdf({ nomFichier, fabriquerDocument }: Props) {
  const [etat, setEtat] = useState<EtatBouton>('inactif');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const lienRef = useRef<HTMLAnchorElement>(null);

  // Nettoyer l'URL blob quand le composant est démonté
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Déclencher le téléchargement quand le blob est prêt
  useEffect(() => {
    if (etat === 'pret' && blobUrl && lienRef.current) {
      lienRef.current.click();
      setEtat('inactif');
    }
  }, [etat, blobUrl]);

  async function generer() {
    setEtat('generation');
    try {
      // Import dynamique — uniquement exécuté côté client au moment du clic.
      // Turbopack ne trace pas les imports() à l'intérieur des callbacks async.
      const reactPdf = await import('@react-pdf/renderer');
      const documentElement = await fabriquerDocument();
      const blob = await reactPdf.pdf(documentElement as React.ReactElement<import('@react-pdf/renderer').DocumentProps>).toBlob();
      const url = URL.createObjectURL(blob);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(url);
      setEtat('pret');
    } catch {
      setEtat('inactif');
    }
  }

  return (
    <>
      <Button
        disabled={etat === 'generation'}
        onClick={generer}
        className="!bg-[#D4A017] hover:!bg-[#b8871a] text-white whitespace-nowrap"
      >
        {etat === 'generation' ? 'Génération…' : '⬇ Exporter PDF'}
      </Button>
      {/* Lien invisible pour déclencher le téléchargement */}
      {blobUrl && (
        <a
          ref={lienRef}
          href={blobUrl}
          download={nomFichier}
          className="hidden"
          aria-hidden="true"
        />
      )}
    </>
  );
}
