import './globals.css';

export const metadata = {
  title: 'Sécurité Taxis-Motos — Registre syndical',
  description: 'Recensement, vérification et suivi des motos et chauffeurs du syndicat.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
