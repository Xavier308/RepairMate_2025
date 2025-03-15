import React from 'react';
import Sidebar from '@/components/common/Sidebar.jsx';

function MainLayout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;