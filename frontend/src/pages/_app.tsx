import type { AppProps } from 'next/app';
import '@/globals.css';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster richColors />
    </AuthProvider>
  );
}

export default MyApp;
