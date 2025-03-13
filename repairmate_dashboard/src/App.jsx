import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx'; //New
import MainLayout from './layouts/MainLayout.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Register from './components/Register.jsx';
import { setAuthToken } from './services/api';
import Login from './components/Login.jsx';
// Main Pages
import Home from './components/Home.jsx';
import MyMachines from './components/MyMachines.jsx'
import EnhancedTroubleshoot from './components/EnhancedTroubleshoot.jsx';
import EnhancedTraining from './components/EnhancedTraining.jsx';
import Settings from './components/Settings.jsx';
import Account from './components/Account.jsx';
// Adjacent pages
import MachineDetails from './components/MachineDetails.jsx';
import TroubleshootDetail from './components/TroubleshootDetail.jsx';
import IssuePage from './components/IssuePage.jsx';

import TroubleshootGuide from './components/TroubleshootGuide.jsx';
import PossibleIssues from './components/PossibleIssues.jsx';
import AllIssues from './components/AllIssues.jsx';
import AddMachine from './components/AddMachine.jsx';
import EditMachine from './components/EditMachine.jsx';
import ManageIssues from './components/ManageIssues.jsx';
import StepGuide from './components/StepGuide.jsx';
// Workspace
import WorkspaceDetail from './components/WorkspaceDetail.jsx';
// wizard
import CustomizationWizard from './components/CustomizationWizard.jsx';


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