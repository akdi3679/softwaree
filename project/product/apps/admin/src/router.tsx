import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/Dashboard';
import { ProjectsPage } from './pages/Projects';
import { UsersPage } from './pages/Users';
import { AuditPage } from './pages/Audit';
import { ModulesPage } from './pages/Modules';
import { BackupPage } from './pages/Backup';
import { LoginPage } from './pages/Login';
import { SettingsPage } from './pages/Settings';
import { HelpPage } from './pages/Help';
import { CommandPalettePage } from './pages/CommandPalette';
import { JobsPage } from './pages/Jobs';
import { MaintenancePage } from './pages/Maintenance';
import { DeviceDisputePage } from './pages/DeviceDispute';
import { AppointmentsPage } from './pages/Appointments';
import { PatientPrintPage } from './pages/PatientPrint';
import { StatusPage } from './pages/Status';
import { RolesPage } from './pages/Roles';
import { AnalyticsPage } from './pages/Analytics';
import { AnalyticsMedicalPage } from './pages/AnalyticsMedical';
import { AnalyticsFoodLabPage } from './pages/AnalyticsFoodLab';
import { PatientsPage } from './pages/Patients';
import { PatientDetailPage } from './pages/PatientDetail';
import { PatientVaccinationsPage } from './pages/PatientVaccinations';
import { TodayPage } from './pages/Today';
import { ActiveVisitPage } from './pages/ActiveVisit';
import { WaitingListPage } from './pages/WaitingList';
import { ReferralsPage } from './pages/Referrals';
import { SampleQueuePage } from './pages/SampleQueue';
import { SampleDetailPage } from './pages/SampleDetail';
import { IntakeSamplePage } from './pages/IntakeSample';
import { CustodyPage } from './pages/Custody';
import { ReportsPage } from './pages/Reports';
import { WelcomeWizard as WelcomePage } from './pages/Welcome';
import { FirstSetupPage } from './pages/FirstSetup';
import { LegalPage } from './pages/Legal';
import { PricingPage } from './pages/Pricing';
import { UpgradePage } from './pages/Upgrade';
import { ApiKeysPage } from './pages/ApiKeys';
import { DataQualityPage } from './pages/DataQuality';
import { TelemetrySettingsPage } from './pages/TelemetrySettings';
import { SupportContactPage } from './pages/SupportContact';
import { ReleaseNotesPage } from './pages/ReleaseNotes';
import { GlobalSearchPage } from './pages/GlobalSearch';
import { HelpSearchPage } from './pages/HelpSearch';
import { ModulesBrowsePage } from './pages/ModulesBrowse';
import { InstallModulePage } from './pages/InstallModule';
import { TopPatientsPage } from './pages/TopPatients';
import { AggregateHistoryPage } from './pages/AggregateHistory';
import { ArchiveProjectPage } from './pages/ArchiveProject';
import { DataExportPage } from './pages/DataExport';
import { NewProjectWizard as NewProjectWizardPage } from './pages/NewProjectWizard';

const rootRoute = createRootRoute({ component: AppShell });

const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: '/', component: DashboardPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/projects', component: ProjectsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/users', component: UsersPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/audit', component: AuditPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/modules', component: ModulesPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/modules/browse', component: ModulesBrowsePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/modules/install', component: InstallModulePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/backup', component: BackupPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/setup', component: FirstSetupPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/welcome', component: WelcomePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/settings/api-keys', component: ApiKeysPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/settings/telemetry', component: TelemetrySettingsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/help', component: HelpPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/help/search', component: HelpSearchPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/command-palette', component: CommandPalettePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/jobs', component: JobsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/maintenance', component: MaintenancePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/device-dispute', component: DeviceDisputePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/appointments', component: AppointmentsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/patients', component: PatientsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/patients/$patientId', component: PatientDetailPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/patients/$patientId/print', component: PatientPrintPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/patients/$patientId/vaccinations', component: PatientVaccinationsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/patients/$patientId/history', component: AggregateHistoryPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/today', component: TodayPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/visits/$visitId', component: ActiveVisitPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/waiting-list', component: WaitingListPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/referrals', component: ReferralsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/samples', component: SampleQueuePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/samples/intake', component: IntakeSamplePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/samples/$sampleId', component: SampleDetailPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/samples/$sampleId/custody', component: CustodyPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/reports', component: ReportsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/analytics', component: AnalyticsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/analytics/medical', component: AnalyticsMedicalPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/analytics/food-lab', component: AnalyticsFoodLabPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/status', component: StatusPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/roles', component: RolesPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/legal', component: LegalPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/pricing', component: PricingPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/upgrade', component: UpgradePage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/data-quality', component: DataQualityPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/support', component: SupportContactPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/release-notes', component: ReleaseNotesPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/search', component: GlobalSearchPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/top-patients', component: TopPatientsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/archive', component: ArchiveProjectPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/data-export', component: DataExportPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/projects/new', component: NewProjectWizardPage }),
];

const routeTree = rootRoute.addChildren(routes);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
