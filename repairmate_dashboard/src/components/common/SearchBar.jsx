import React, { useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  return (
    <form className="search-bar-container" onSubmit={handleSearch}>
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder="SEARCH"
          className="search-input"
        />
        <FaTimes 
          className={`clear-icon ${searchTerm ? 'visible' : ''}`} 
          onClick={handleClear}
        />
      </div>
    </form>
  );
}

export default SearchBar;
