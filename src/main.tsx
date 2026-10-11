import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '../bootstrap.min.css';
import '../style.css';
import './lobby.css';
import { IdentityProvider } from './auth/IdentityProvider';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IdentityProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </IdentityProvider>
  </React.StrictMode>,
);
