import './globals.css';

export const metadata = {
  title: 'District Scout',
  description: "Espace des chefs de troupe du district",
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#2f6b3a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
