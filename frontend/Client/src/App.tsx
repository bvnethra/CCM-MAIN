import React from 'react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { PermissionProvider } from './context/PermissionContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <NotificationProvider>
          <PermissionProvider>
            <AppRoutes />
          </PermissionProvider>
        </NotificationProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
