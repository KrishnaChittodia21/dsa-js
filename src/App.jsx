import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NotFound from './pages/NotFound.jsx';

// Pages with heavy dependencies (the code editor) are split into separate chunks.
const TopicPage = lazy(() => import('./pages/TopicPage.jsx'));
const QuestionPage = lazy(() => import('./pages/QuestionPage.jsx'));
const PatternsPage = lazy(() => import('./pages/PatternsPage.jsx'));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage.jsx'));
const CompaniesIndex = lazy(() => import('./pages/CompaniesPage.jsx').then((m) => ({ default: m.CompaniesIndex })));
const CompanyDetail = lazy(() => import('./pages/CompaniesPage.jsx').then((m) => ({ default: m.CompanyDetail })));
const ToolkitDetail = lazy(() => import('./pages/ToolkitPage.jsx').then((m) => ({ default: m.ToolkitDetail })));
const ProgressPage = lazy(() => import('./pages/ProgressPage.jsx'));
const RevisionPage = lazy(() => import('./pages/RevisionPage.jsx'));
const SavedPage = lazy(() => import('./pages/SavedPage.jsx'));
const ShortsPage = lazy(() => import('./pages/ShortsPage.jsx'));
const ShortPage = lazy(() => import('./pages/ShortPage.jsx'));
const VisualizePage = lazy(() => import('./pages/VisualizePage.jsx'));
const PatternFinderPage = lazy(() => import('./pages/PatternFinderPage.jsx'));
const PlanPage = lazy(() => import('./pages/PlanPage.jsx'));
const ContentsPage = lazy(() => import('./pages/ContentsPage.jsx'));
const ToolsPage = lazy(() => import('./pages/ToolsPage.jsx'));
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
                  <Route path="plan" element={<PlanPage />} />
                  {/* the old Learning path page: stages now live on /contents, the plan on /plan */}
                  <Route path="path" element={<Navigate to="/plan" replace />} />
                  <Route path="topic/:topicId" element={<TopicPage />} />
                  <Route path="topic/:topicId/q/:questionId" element={<QuestionPage />} />
                  <Route path="patterns" element={<PatternsPage />} />
                  <Route path="visualize" element={<VisualizePage />} />
                  <Route path="finder" element={<PatternFinderPage />} />
                  <Route path="questions" element={<QuestionsPage />} />
                  <Route path="companies" element={<CompaniesIndex />} />
                  <Route path="companies/:companyId" element={<CompanyDetail />} />
                  <Route path="tools" element={<ToolsPage />} />
                  {/* cheat sheet, toolkit, JS reference and playground are tabs of /tools now */}
                  <Route path="cheatsheet" element={<Navigate to="/tools?tab=cheatsheet" replace />} />
                  <Route path="toolkit" element={<Navigate to="/tools?tab=toolkit" replace />} />
                  <Route path="js" element={<Navigate to="/tools?tab=js" replace />} />
                  <Route path="playground" element={<Navigate to="/tools?tab=playground" replace />} />
                  <Route path="toolkit/:toolId" element={<ToolkitDetail />} />
                  {/* the old Track page was merged into Progress */}
                  <Route path="track" element={<Navigate to="/progress" replace />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="achievements" element={<AchievementsPage />} />
                  <Route path="revision" element={<RevisionPage />} />
                  <Route path="saved" element={<SavedPage />} />
                  <Route path="shorts" element={<ShortsPage />} />
                  <Route path="shorts/:id" element={<ShortPage />} />
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
