import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './state/ThemeContext.jsx';
import { ProgressProvider } from './state/ProgressContext.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/lesson.css';
import './styles/pages.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
