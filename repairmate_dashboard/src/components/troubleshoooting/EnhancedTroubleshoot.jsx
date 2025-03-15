import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaMagic, FaBookmark, FaLock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { fetchMachines, fetchDepartments, fetchMachineTypes, getMachineImages } from '@/services/api';
import './EnhancedTroubleshoot.css';


function EnhancedTroubleshoot() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  // New
  const [currentPage, setCurrentPage] = useState(1);
  const machinesPerPage = 9;
  // Get current machines for pagination
  const indexOfLastMachine = currentPage * machinesPerPage;
  const indexOfFirstMachine = indexOfLastMachine - machinesPerPage;
  const currentMachines = filteredMachines.slice(indexOfFirstMachine, indexOfLastMachine);
  const totalPages = Math.ceil(filteredMachines.length / machinesPerPage);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [machinesData, departmentsData, typesData] = await Promise.all([
          fetchMachines(),
          fetchDepartments(),
          fetchMachineTypes()
        ]);

        // Filter out templates before mapping images
        const nonTemplateMachines = machinesData.data.filter(machine => !machine.is_template);

        const machinesWithImages = await Promise.all(
          nonTemplateMachines.map(async (machine) => {
            try {
              const imagesResponse = await getMachineImages(machine.id);
              return {
                ...machine,
                image_url: imagesResponse.data.length > 0 ? imagesResponse.data[0].url : 'https://img.perceptpixel.com/bibawdef/RepairMate/default_machine.png'
              };
            } catch (error) {
              console.error(`Error fetching images for machine ${machine.id}:`, error);
              return { ...machine, image_url: 'https://img.perceptpixel.com/bibawdef/RepairMate/default_machine.png' };
            }
          })
        );
        setMachines(machinesWithImages);
        setFilteredMachines(machinesWithImages);
        setDepartments(departmentsData.data || []);
        setMachineTypes(typesData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    filterMachines(searchTerm, selectedDepartment, selectedType);
  }, [searchTerm, selectedDepartment, selectedType, machines]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleDepartmentFilter = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleTypeFilter = (e) => {
    setSelectedType(e.target.value);
  };

  const filterMachines = (term, department, type) => {
    let filtered = machines;
    if (term) {
      filtered = filtered.filter(machine =>
        machine.name.toLowerCase().includes(term) ||
        machine.id.toString().includes(term)
      );
    }
    if (department) {
      filtered = filtered.filter(machine =>
        machine.department_name === department
      );
    }
    if (type) {
      filtered = filtered.filter(machine =>
        machine.machine_type_name === type
      );
    }
    setFilteredMachines(filtered);
  };

  const handleMachineSelect = (machine) => {
    navigate(`/troubleshoot/${machine.id}`);
  };

  const handleRepairClick = (e, machineId) => {
    e.stopPropagation();
    navigate(`/troubleshoot/${machineId}`);
  };

  const truncateDescription = (description) => {
    if (description.length <= 100) return description;
    return description.slice(0, 100) + '...';
  };
  
  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const LoadingSpinner = () => (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p>Loading machines...</p>
    </div>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FaChevronLeft />
        </button>

        <div className="page-numbers">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              className={`page-number ${currentPage === number ? 'active' : ''}`}
              onClick={() => paginate(number)}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          className="pagination-button"
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FaChevronRight />
        </button>
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="troubleshoot-container">
      <div className="troubleshoot-content">
        <h1>Choose your machine</h1>
        <div className="search-filter-container">
          <div className="search-bar2">
            <FaSearch />
            <input
              type="text"
              placeholder="Search machines..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="troubleshoot-filters">
          <FaFilter />
            <select value={selectedDepartment} onChange={handleDepartmentFilter}>
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
            <select value={selectedType} onChange={handleTypeFilter}>
              <option value="">All Types</option>
              {machineTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="troubleshoot-machines-grid">
        {currentMachines.length === 0 ? (
            <p className="empty-message">No machines found. Add a new machine to get started!</p>
          ) : (
            currentMachines.map(machine => (
            <div key={machine.id} className="troubleshoot-machine-card" onClick={() => handleMachineSelect(machine)}>
              <div className="machine-header">
                <FaMagic 
                  className="machine-header-icon icon-FaMagic" 
                  onClick={(e) => handleRepairClick(e, machine.id)}
                  title="Repair It!"
                />
                <h3>{machine.name}</h3>
                <FaBookmark className="machine-header-icon icon-bookmark" title="Feature coming soon" />
                <FaLock className="machine-header-icon icon-lock" title="Feature coming soon" />
              </div>
              <div className="troubleshoot-machine-image">
                <img src={machine.image_url} alt={machine.name} />
              </div>
              <div className="troubleshoot-machine-info-card">
                <p><span className="info-label">Model:</span> {machine.model}</p>
                <p>
                  <span className="info-label">Description: </span>
                  <span className={`troubleshoot-machine-description ${expandedDescriptions[machine.id] ? 'expanded' : ''}`}>
                    {expandedDescriptions[machine.id] ? machine.description : truncateDescription(machine.description || 'No description available')}
                  </span>
                  {machine.description && machine.description.length > 100 && (
                    <span className="read-more" onClick={(e) => {
                      e.stopPropagation();
                      toggleDescription(machine.id);
                    }}>
                      {expandedDescriptions[machine.id] ? 'Read less' : 'Read more'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )))}
        </div>
        <Pagination />
      </div>
    </div>
  );
}

export default EnhancedTroubleshoot;