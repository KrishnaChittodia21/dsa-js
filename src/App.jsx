import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LearningPath from './pages/LearningPath.jsx';
import TopicPage from './pages/TopicPage.jsx';
import NotFound from './pages/NotFound.jsx';

// Pages with heavy dependencies (the code editor) are split into separate chunks.
const QuestionPage = lazy(() => import('./pages/QuestionPage.jsx'));
const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage.jsx'));
const PatternsPage = lazy(() => import('./pages/PatternsPage.jsx'));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage.jsx'));
const CompaniesIndex = lazy(() => import('./pages/CompaniesPage.jsx').then((m) => ({ default: m.CompaniesIndex })));
const CompanyDetail = lazy(() => import('./pages/CompaniesPage.jsx').then((m) => ({ default: m.CompanyDetail })));
const ToolkitIndex = lazy(() => import('./pages/ToolkitPage.jsx').then((m) => ({ default: m.ToolkitIndex })));
const ToolkitDetail = lazy(() => import('./pages/ToolkitPage.jsx').then((m) => ({ default: m.ToolkitDetail })));
const JsReferencePage = lazy(() => import('./pages/JsReferencePage.jsx'));
const ProgressPage = lazy(() => import('./pages/ProgressPage.jsx'));
const RevisionPage = lazy(() => import('./pages/RevisionPage.jsx'));
const CheatSheetPage = lazy(() => import('./pages/CheatSheetPage.jsx'));
const VisualizePage = lazy(() => import('./pages/VisualizePage.jsx'));
const PatternFinderPage = lazy(() => import('./pages/PatternFinderPage.jsx'));
const ContentsPage = lazy(() => import('./pages/ContentsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage.jsx'));

const Loading = () => <div className="page muted small">Loading…</div>;

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="*"
          element={
            <ErrorBoundary>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="contents" element={<ContentsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="path" element={<LearningPath />} />
                  <Route path="topic/:topicId" element={<TopicPage />} />
                  <Route path="topic/:topicId/q/:questionId" element={<QuestionPage />} />
                  <Route path="patterns" element={<PatternsPage />} />
                  <Route path="visualize" element={<VisualizePage />} />
                  <Route path="finder" element={<PatternFinderPage />} />
                  <Route path="questions" element={<QuestionsPage />} />
                  <Route path="companies" element={<CompaniesIndex />} />
                  <Route path="companies/:companyId" element={<CompanyDetail />} />
                  <Route path="toolkit" element={<ToolkitIndex />} />
                  <Route path="toolkit/:toolId" element={<ToolkitDetail />} />
                  <Route path="js" element={<JsReferencePage />} />
                  <Route path="playground" element={<PlaygroundPage />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="achievements" element={<AchievementsPage />} />
                  <Route path="revision" element={<RevisionPage />} />
                  <Route path="cheatsheet" element={<CheatSheetPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          }
        />
      </Route>
    </Routes>
  );
}
