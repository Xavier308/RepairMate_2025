// AllIssues.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchIssuesForMachine, fetchMachineDetails } from '../services/api';
import { FaSearch, FaFilter } from 'react-icons/fa';
import './AllIssues.css';


function AllIssues() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [issuesPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [machineResponse, issuesResponse] = await Promise.all([
          fetchMachineDetails(machineId),
          fetchIssuesForMachine(machineId)
        ]);

        console.log('Machine Response:', machineResponse);
        console.log('Issues Response:', issuesResponse);

        if (machineResponse && machineResponse.data) {
          setMachine(machineResponse.data);
        } else {
          console.error('Machine data is undefined', machineResponse);
          setError('Failed to load machine details');
        }

        if (Array.isArray(issuesResponse)) {
          setIssues(issuesResponse);
          setFilteredIssues(issuesResponse);
          const uniqueCategories = [...new Set(issuesResponse
            .filter(issue => issue.category_name)
            .map(issue => issue.category_name))];
          setCategories(uniqueCategories);
        } else {
          console.error('Issues data is not an array', issuesResponse);
          setIssues([]);
          setFilteredIssues([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching machine details or issues:', error);
        setError('Failed to load machine details or issues');
        setLoading(false);
      }
    };

    loadData();
  }, [machineId]);

  useEffect(() => {
    const results = issues.filter(issue =>
      (issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       issue.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === '' || issue.category_name === selectedCategory)
    );
    setFilteredIssues(results);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, issues]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleIssueClick = (issue) => {
    navigate(`/issue/${issue.id}`, { state: { machineId: issue.machine } });
  };

  // Get current issues
  const indexOfLastIssue = currentPage * issuesPerPage;
  const indexOfFirstIssue = indexOfLastIssue - issuesPerPage;
  const currentIssues = filteredIssues.slice(indexOfFirstIssue, indexOfLastIssue);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="all-issues">
      <h1>All Issues for {machine ? machine.name : `Machine ${machineId}`}</h1>
      <div className="search-filter-container">
        <div className="search-bar2">
          <FaSearch />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        {/*<div className="filters">
          <FaFilter />
          <select value={selectedCategory} onChange={handleCategoryFilter}>
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>*/}
      </div>

      <div className="issues-list">
        {currentIssues.map(issue => (
          <div key={issue.id} className="issue-item" onClick={() => handleIssueClick(issue)}>
            <h3>{issue.error_code}: {issue.title}</h3>
            <p>{issue.description}</p>
            <span className="category-tag">{issue.category_name}</span>
          </div>
        ))}
      </div>

      <Pagination
        issuesPerPage={issuesPerPage}
        totalIssues={filteredIssues.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
}


function Pagination({ issuesPerPage, totalIssues, paginate, currentPage }) {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalIssues / issuesPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className='pagination'>
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <a onClick={() => paginate(number)} href='#!' className='page-link'>
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default AllIssues;