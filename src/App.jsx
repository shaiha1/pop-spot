import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Auth pages (served at fixed URLs directly by the router in this standalone app)
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Pages
import Home from '@/pages/Home';
import SearchPage from '@/pages/SearchPage';
import SpaceDetail from '@/pages/SpaceDetail';
import Favorites from '@/pages/Favorites';
import Bookings from '@/pages/Bookings';
import BookingDetail from '@/pages/BookingDetail';
import Profile from '@/pages/Profile';
import HostDashboard from '@/pages/host/HostDashboard';
import CreateSpace from '@/pages/host/CreateSpace';
import EditSpace from '@/pages/host/EditSpace';
import AdminPanel from '@/pages/admin/AdminPanel';
import FAQ from '@/pages/FAQ';

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--brand-background)' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }}></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/space/:slug" element={<SpaceDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/host/spaces/new" element={<CreateSpace />} />
        <Route path="/host/spaces/:id/edit" element={<EditSpace />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
