import { Geist_Mono, Inter } from 'next/font/google';

import type { Metadata, Viewport } from 'next';

import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TuRenta AI — Tu declaración de renta, sin enredos',
  description:
    'Sube tus documentos, responde unas preguntas y recibe tu borrador del formulario 210 con instrucciones para presentarlo en la DIAN.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Aplica el tema guardado antes de pintar, para evitar el parpadeo. Por defecto, claro.
const TEMA_INICIAL =
  "try{var t=localStorage.getItem('tema');document.documentElement.dataset.theme=t==='dark'||t==='auto'?t:'light';}catch(e){}";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO" data-theme="light" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
        {children}
      </body>
    </html>
  );
}
