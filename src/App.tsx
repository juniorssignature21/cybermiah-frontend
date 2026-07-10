import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AdminLayout, StudentLayout } from '@/components/layout';
import { ApiError } from '@/lib/api';

// Pages
import Login from '@/pages/login';
import StudentRegister from '@/pages/register-student';
import AdminRegister from '@/pages/register-admin';
import StudentDashboard from '@/pages/student-dashboard';
import ExamRoom from '@/pages/exam-room';
import ExamResult from '@/pages/exam-result';
import AdminLive from '@/pages/admin-live';
import AdminQuizzes from '@/pages/admin-quizzes';
import AdminQuizDetail from '@/pages/admin-quiz-detail';
import AdminResults from '@/pages/admin-results';
import AdminTimeline from '@/pages/admin-timeline';

function getRouterBase() {
  const baseUrl = import.meta.env.BASE_URL || '/';
  try {
    return new URL(baseUrl, window.location.origin).pathname.replace(/\/$/, '');
  } catch {
    return baseUrl.startsWith('/') ? baseUrl.replace(/\/$/, '') : '';
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry client errors (4xx) - they won't succeed on retry.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

function ProtectedRoute({ component: Component, roleRequired, layout: Layout, ...rest }: any) {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (roleRequired && role !== roleRequired) {
    return <Redirect to={role === 'admin' ? '/admin' : '/'} />;
  }

  const page = <Component />;
  return Layout ? <Layout>{page}</Layout> : page;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register/student" component={StudentRegister} />
      <Route path="/register/admin" component={AdminRegister} />

      {/* Admin Routes */}
      <Route path="/admin" component={() => <ProtectedRoute component={AdminLive} roleRequired="admin" layout={AdminLayout} />} />
      <Route path="/admin/quizzes/:id" component={() => <ProtectedRoute component={AdminQuizDetail} roleRequired="admin" layout={AdminLayout} />} />
      <Route path="/admin/quizzes" component={() => <ProtectedRoute component={AdminQuizzes} roleRequired="admin" layout={AdminLayout} />} />
      <Route path="/admin/results" component={() => <ProtectedRoute component={AdminResults} roleRequired="admin" layout={AdminLayout} />} />
      <Route path="/admin/timeline/:id" component={() => <ProtectedRoute component={AdminTimeline} roleRequired="admin" layout={AdminLayout} />} />

      {/* Student Routes */}
      <Route path="/" component={() => <ProtectedRoute component={StudentDashboard} roleRequired="student" layout={StudentLayout} />} />
      <Route path="/attempt/:id" component={() => <ProtectedRoute component={ExamRoom} roleRequired="student" layout={StudentLayout} />} />
      <Route path="/result/:id" component={() => <ProtectedRoute component={ExamResult} roleRequired="student" layout={StudentLayout} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={getRouterBase()}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
