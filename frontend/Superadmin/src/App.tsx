import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { PermissionProvider } from './context/PermissionContext';
import { AppRoutes } from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,        // 2 minutes
      gcTime: 1000 * 60 * 10,           // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <PermissionProvider>
              <AppRoutes />
            </PermissionProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

