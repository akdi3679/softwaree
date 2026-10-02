import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/Dashboard';
import { UserDashboardPage } from './pages/UserDashboard';
import { ConnectPage } from './pages/Connect';
import { UsersPage } from './pages/Users';
import { EventsPage } from './pages/Events';
import { EventLogPage } from './pages/EventLog';
import { EventReceiptPage } from './pages/EventReceipt';
import { EventTimelinePage } from './pages/EventTimeline';
import { EntityDetailPage } from './pages/EntityDetail';
import { PatientsPage } from './pages/Patients';
import { AppointmentsPage } from './pages/Appointments';
import { SamplesPage } from './pages/Samples';
import { SampleDetailPage } from './pages/SampleDetail';
import { OnboardingPage } from './pages/Onboarding';
import { SessionsPage } from './pages/Sessions';
import { SessionStatsPage } from './pages/SessionStats';
import { SignOutPage } from './pages/SignOut';
import { SearchPage } from './pages/Search';
import { SearchResultsPage } from './pages/SearchResults';

const rootRoute = createRootRoute({ component: AppShell });

const SearchResultsRoute = () => {
  const q = new URLSearchParams(window.location.search).get('q') ?? '';
  return <SearchResultsPage q={q} />;
};

const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: '/', component: DashboardPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: UserDashboardPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/connect', component: ConnectPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/users', component: UsersPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/events', component: EventsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/events/log', component: EventLogPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/events/timeline', component: EventTimelinePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/events/$eventId', component: EventReceiptPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/entities/$entityType/$entityId', component: EntityDetailPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/patients', component: PatientsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/appointments', component: AppointmentsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/samples', component: SamplesPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/samples/$sampleId', component: SampleDetailPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/onboarding', component: OnboardingPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/sessions', component: SessionsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/sessions/stats', component: SessionStatsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/sign-out', component: SignOutPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/search', component: SearchPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/search/results', component: SearchResultsRoute }),
];

const routeTree = rootRoute.addChildren(routes);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}