import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaMagic, FaGraduationCap, FaCog, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { RxDashboard } from "react-icons/rx"
import { RiRobot2Fill } from "react-icons/ri";
import { IoFileTrayStacked } from "react-icons/io5";
import { addGooeyEffect } from './gooeyEffect.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { translations } from '../translations/translations';

/*
 * Sidebar Component
 * - This component renders a sidebar navigation menu with icons and text.
 * - The sidebar can be toggled between open and closed states, which adjusts the layout and visibility of labels.
 * - It uses icons from 'react-icons' to represent menu items visually.
 */

function Sidebar({ onLogout }) {
  // State to manage whether the sidebar is open or closed
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Hook to get the current location path from the router
  const location = useLocation();
  // Get the current language from the LanguageContext and translation strings
  const { language } = useLanguage();
  const t = translations[language].sidebar;

  // Effect to add a custom gooey effect to the sidebar when it mounts
  useEffect(() => {
    addGooeyEffect();
  }, []);

  // Function to toggle the sidebar's open/closed state
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Function to check if a link is active based on the current path
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className={`app-nav ${isSidebarOpen ? 'open' : 'closed'}`}>
      <ul>
        <li>
          <Link 
            to="/troubleshoot" 
            className={`repair-it-button ${isActive('/repairs')}`}
          >
            <FaMagic /> 
            {isSidebarOpen && <span>{t.repairIt}</span>}
          </Link>
        </li>
        <li className="nav-spacer3"></li>
        <li><Link to="/" className={isActive('/')}><RxDashboard /> {isSidebarOpen && t.dashboard}</Link></li>
        <li><Link to="/machines" className={isActive('/machines')}><RiRobot2Fill /> {isSidebarOpen && t.machines}</Link></li>        
        <li><Link to="/workspaces" className={isActive('/workspaces')}><IoFileTrayStacked /> {isSidebarOpen && t.workspaces}</Link></li>
        <li className="nav-spacer"></li>
        <li><Link to="/settings" className={isActive('/settings')}><FaCog /> {isSidebarOpen && t.settings}</Link></li>
        <li className="nav-spacer3"></li>
      </ul>
      <div className="sidebar-toggle-wrapper">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;