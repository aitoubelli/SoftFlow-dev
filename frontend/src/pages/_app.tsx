import type { AppProps } from 'next/app';
import '@/globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster />
    </AuthProvider>
  );
}

export default MyApp;
