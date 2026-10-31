import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/globals.css';
import App from './App.tsx';
import { AuthProvider } from './state/AuthContext.tsx';
import { DynamicConfigProvider } from './state/DynamicConfigContext.tsx';
import { MemberStoreProvider } from './state/MemberStoreContext.tsx';
import { FinanceStoreProvider } from './state/FinanceStoreContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DynamicConfigProvider>
          <MemberStoreProvider>
            <FinanceStoreProvider>
              <App />
            </FinanceStoreProvider>
          </MemberStoreProvider>
        </DynamicConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
