import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from '@/context/LanguageContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import Header from '@/components/common/Header.jsx';
import Sidebar from '@/components/common/Sidebar.jsx';
import Register from '@/components/auth/Register.jsx';
import { setAuthToken } from '@/services/api';
import Login from '@/components/auth/Login.jsx';
// Main Pages
import Home from '@/components/dashboard/Home.jsx';
import MyMachines from '@/components/machines/MyMachines.jsx'
import EnhancedTroubleshoot from '@/components/troubleshooting/EnhancedTroubleshoot.jsx';
import EnhancedTraining from '@/components/training/EnhancedTraining.jsx';
import Settings from '@/components/settings/Settings.jsx';
import Account from '@/components/account/Account.jsx';
// Adjacent pages
import MachineDetails from '@/components/machines/MachineDetails.jsx';
import TroubleshootDetail from '@/components/troubleshooting/TroubleshootDetail.jsx';
import IssuePage from '@/components/issues/IssuePage.jsx';
// Issues and machine
import TroubleshootGuide from '@/components/troubleshooting/TroubleshootGuide.jsx';
import PossibleIssues from '@/components/issues/PossibleIssues.jsx';
import AllIssues from '@/components/issues/AllIssues.jsx';
import AddMachine from '@/components/machines/AddMachine.jsx';
import EditMachine from '@/components/machines/EditMachine.jsx';
import ManageIssues from '@/components/issues/ManageIssues.jsx';
import StepGuide from '@/components/issues/StepGuide.jsx';
// Workspace
import WorkspaceDetail from '@/components/workspace/WorkspaceDetail.jsx';
// Customization Wizard - step by step machine creation
import CustomizationWizard from '@/components/CustomizationWizard/CustomizationWizard.jsx';
// CSS Style
import './App.css';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  const AuthenticatedRoutes = () => (
    <LanguageProvider>
      <>
        <Header onLogout={handleLogout} />
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/machines" element={<MyMachines />} />
            <Route path="/troubleshoot" element={<EnhancedTroubleshoot />} />
            <Route path="/workspaces" element={<EnhancedTraining />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/account" element={<Account />} />
            <Route path="/machines/:id" element={<MachineDetails />} />
            <Route path="/add-machine" element={<AddMachine />} />
            <Route path="/edit-machine/:id" element={<EditMachine />} />
            <Route path="/troubleshoot/:machineId" element={<TroubleshootDetail />} />
            <Route path="/issue/:issueId" element={<IssuePage />} />
            <Route path="/manage-issues/:machineId" element={<ManageIssues />} />
            <Route path="/all-issues/:machineId" element={<AllIssues />} />
            <Route path="/machines/:machineId/edit-guide" element={<StepGuide />} />
            <Route path="/possible-issues/:machineId" element={<PossibleIssues />} />
            <Route path="/troubleshoot/:machineId/guide/:guideId" element={<TroubleshootGuide />} />
            <Route path="/training/workspace/:workspaceId" element={<WorkspaceDetail />} />
          </Routes>
        </MainLayout>
      </>
    </LanguageProvider>
  );

  return (
    <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <AuthenticatedRoutes />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
        </Routes>
    </Router>
  );
}

export default App;
