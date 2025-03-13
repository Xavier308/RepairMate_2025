import React from 'react';
import { Link } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { MdAccountCircle } from "react-icons/md";
import { useLanguage } from '../context/LanguageContext.jsx';
import { translations } from '../translations/translations';
import logo from '../assets/images/repairmate_logo.png';
import './Header.css';

function Header({ onLogout }) {
  const { language } = useLanguage();
  const t = translations[language].header;

  return (
    <header className="app-header">
      <Link to="/" className="header-logo">
        <img src={logo} alt="RepairMate Logo" className="header-logo-image" />
      </Link>
      <div className="header-actions">
        <Link to="/account" className="header-account">
          <MdAccountCircle />
          <span>{t.account}</span>
        </Link>
        <button onClick={onLogout} className="header-logout">
          <FaSignOutAlt />
          <span>{t.logout}</span>
        </button>
      </div>
    </header>
  );
}

export default Header;