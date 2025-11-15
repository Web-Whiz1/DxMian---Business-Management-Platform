import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { BusinessSetup } from './pages/BusinessSetup';
import { Bookings } from './pages/Bookings';
import { Customers } from './pages/Customers';
import { Services } from './pages/Services';
import { Analytics } from './pages/Analytics';
import { Staff } from './pages/Staff';
import { Payments } from './pages/Payments';
import { Settings } from './pages/Settings';

function Router() {
  const [path, setPath] = useState(window.location.pathname);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const newPath = new URL(anchor.href).pathname;
        window.history.pushState({}, '', newPath);
        setPath(newPath);
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (path === '/login') {
    if (user) {
      window.location.href = '/dashboard';
      return null;
    }
    return <Login />;
  }

  if (path === '/register') {
    if (user) {
      window.location.href = '/dashboard';
      return null;
    }
    return <Register />;
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  if (path === '/dashboard/setup') {
    return <BusinessSetup />;
  }

  if (path === '/dashboard/bookings') {
    return <Bookings />;
  }

  if (path === '/dashboard/customers') {
    return <Customers />;
  }

  if (path === '/dashboard/services') {
    return <Services />;
  }

  if (path === '/dashboard/analytics') {
    return <Analytics />;
  }

  if (path === '/dashboard/staff') {
    return <Staff />;
  }

  if (path === '/dashboard/payments') {
    return <Payments />;
  }

  if (path === '/dashboard/settings') {
    return <Settings />;
  }

  if (path.startsWith('/dashboard')) {
    return <Dashboard />;
  }

  if (path === '/') {
    if (user) {
      window.location.href = '/dashboard';
      return null;
    }
    return <Login />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-4">Page not found</p>
        <a href="/dashboard" className="text-blue-600 hover:text-blue-700">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
