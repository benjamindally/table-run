import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/navigation/AdminSidebar';
import AdminHeader from '../components/navigation/AdminHeader';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;