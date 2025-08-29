import { createRoot } from 'react-dom/client'
import { TenantProvider } from "./tenant/TenantProvider.tsx";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <TenantProvider>
    <App />
  </TenantProvider>
)
