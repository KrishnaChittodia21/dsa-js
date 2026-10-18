import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
// self-hosted variable fonts: Archivo (display, wght+wdth), Onest (UI), Martian Mono (code/numbers) — latin
import './styles/fonts.css';
import App from './App.jsx';
import { ThemeProvider } from './state/ThemeContext.jsx';
import { ProgressProvider } from './state/ProgressContext.jsx';
// Styles, in cascade order (later files win ties). tokens → base (shared primitives) → shell → overlays →
// per-screen files. Each file's header names its owner and scope. viz.css used to be lazy-loaded by the
// Visualizer; it is now global and stays after the screens it used to follow.
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/overlays.css';
import './styles/charts.css';
import './styles/topic.css';
import './styles/path.css';
import './styles/question.css';
import './styles/toolkit.css';
import './styles/patterns.css';
import './styles/viz.css';
import './styles/dashboard.css';
import './styles/settings.css';
import './styles/achievements.css';
import './styles/revision.css';
import './styles/companies.css';

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
