import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ClientListPage } from './ClientList';
import { ClientFormPage } from './ClientForm';
import { ClientDetailsPage } from './ClientDetails';

// Wrapper components for routes
export const ClientCreatePage: React.FC = () => (
  <ClientFormPage mode="create" />
);

export const ClientEditPage: React.FC = () => (
  <ClientFormPage mode="edit" />
);

// Main ClientPages component with nested routes
export const ClientPages: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ClientListPage />} />
      <Route path="new" element={<ClientCreatePage />} />
      <Route path=":id" element={<ClientDetailsPage />} />
      <Route path=":id/edit" element={<ClientEditPage />} />
    </Routes>
  );
};

// Named exports are handled in index.ts to avoid duplicates