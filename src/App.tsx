import { lazy, Suspense } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { CONVEX_ENABLED } from './admin/convexClient';
import { AdminProvider } from './admin/store';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Properties = lazy(() => import('./pages/Properties'));
const EstateDetail = lazy(() => import('./pages/EstateDetail'));
const Construction = lazy(() => import('./pages/Construction'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Contact = lazy(() => import('./pages/Contact'));
const Book = lazy(() => import('./pages/Book'));
const ScrollDemo = lazy(() => import('./pages/ScrollDemo'));
const Account = lazy(() => import('./pages/Account'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Login = lazy(() => import('./admin/Login'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const Tasks = lazy(() => import('./admin/Tasks'));
const Team = lazy(() => import('./admin/Team'));
const Permissions = lazy(() => import('./admin/Permissions'));
const Mail = lazy(() => import('./admin/Mail'));
const Chat = lazy(() => import('./admin/Chat'));
const TeamChat = lazy(() => import('./admin/TeamChat'));
const WebsiteEditor = lazy(() => import('./admin/WebsiteEditor'));
const PropertiesManager = lazy(() => import('./admin/PropertiesManager'));
const Journal = lazy(() => import('./admin/Journal'));
const CompanyCloud = lazy(() => import('./admin/CompanyCloud'));
const Agents = lazy(() => import('./admin/Agents'));
const Apps = lazy(() => import('./admin/Apps'));
const Marketing = lazy(() => import('./admin/Marketing'));
const Social = lazy(() => import('./admin/Social'));
const Automations = lazy(() => import('./admin/Automations'));
const CRM = lazy(() => import('./admin/CRM'));
const ConfigNeeded = lazy(() => import('./admin/ConfigNeeded'));
const Settings = lazy(() => import('./admin/Settings'));

function RouteFallback() {
  return <div className="min-h-[40vh] bg-bg" aria-label="Loading page" />;
}

function AdminRoot() {
  if (!CONVEX_ENABLED) return <ConfigNeeded />;
  return (
    <AdminProvider>
      <Outlet />
    </AdminProvider>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Marketing site */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="land" element={<Navigate to="/properties?kind=land" replace />} />
          <Route path="properties" element={<Properties />} />
          <Route path="estates/:slug" element={<EstateDetail />} />
          <Route path="construction" element={<Construction />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="contact" element={<Contact />} />
          <Route path="book" element={<Book />} />
          <Route path="account" element={<Account />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="scroll-demo" element={<ScrollDemo />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Staff workspace (Convex-backed) */}
        <Route element={<AdminRoot />}>
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="team" element={<Team />} />
            <Route path="crm" element={<CRM />} />
            <Route path="listings" element={<PropertiesManager />} />
            <Route path="journal" element={<Journal />} />
            <Route path="cloud" element={<CompanyCloud />} />
            <Route path="mail" element={<Mail />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="agents" element={<Agents />} />
            <Route path="apps" element={<Apps />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="social" element={<Social />} />
            <Route path="automations" element={<Automations />} />
            <Route path="chat" element={<Chat />} />
            <Route path="team-chat" element={<TeamChat />} />
            <Route path="site-editor" element={<WebsiteEditor />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
