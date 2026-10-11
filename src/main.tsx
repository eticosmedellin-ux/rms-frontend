import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import {queryClient} from '@/api/queryClient';
import {AparienciaProvider} from '@/features/apariencia/AparienciaProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/index.css';



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AparienciaProvider><App /></AparienciaProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
