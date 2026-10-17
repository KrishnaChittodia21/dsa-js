import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
// self-hosted fonts: Fraunces (display), Atkinson Hyperlegible (text), IBM Plex Mono (code) — latin subset
import './styles/fonts.css';
import App from './App.jsx';
import { ThemeProvider } from './state/ThemeContext.jsx';
import { ProgressProvider } from './state/ProgressContext.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/lesson.css';
import './styles/pages.css';
import './styles/pages-ref.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* OS "reduce motion" turns off transform/layout animations (opacity fades remain) */}
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <ProgressProvider>
            <App />
          </ProgressProvider>
        </ThemeProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
);
