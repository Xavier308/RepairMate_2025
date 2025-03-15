import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaMagic, FaPlus, FaBookmark, FaLock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { fetchMachines, getMachineImages, fetchDepartments, fetchMachineTypes } from '@/services/api';
import './MyMachines.css';

function MyMachines() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [activeTab, setActiveTab] = useState('my-machines');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const machinesPerPage = 9;

  // Lazy loading of images
  const loadMachineImage = useCallback(async (machine) => {
    try {
      const imagesResponse = await getMachineImages(machine.id);
      return {
        ...machine,
        image_url: imagesResponse.data.length > 0 
          ? imagesResponse.data[0].url 
          : 'https://img.perceptpixel.com/bibawdef/RepairMate/defaultMachineNonUpload.jpg'
      };
    } catch (error) {
      return {
        ...machine,
        image_url: 'https://img.perceptpixel.com/bibawdef/RepairMate/defaultMachineNonUpload.jpg'
      };
    }
  }, []);

  // Initial data load
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [machinesData, departmentsData, typesData] = await Promise.all([
          fetchMachines(),
          fetchDepartments(),
          fetchMachineTypes()
        ]);

        if (!mounted) return;

        // Store basic machine data immediately
        setMachines(machinesData.data.map(machine => ({
          ...machine,
          image_url: 'https://img.perceptpixel.com/bibawdef/RepairMate/defaultMachineNonUpload.jpg'
        })));
        
        setDepartments(departmentsData.data || []);
        setMachineTypes(typesData.data || []);
        setLoading(false);

        // Load images separately
        const updatedMachines = await Promise.all(
          machinesData.data.slice(0, machinesPerPage).map(loadMachineImage)
        );

        if (!mounted) return;
        
        setMachines(prevMachines => 
          prevMachines.map(machine => {
            const updatedMachine = updatedMachines.find(m => m.id === machine.id);
            return updatedMachine || machine;
          })
        );

      } catch (error) {
        if (mounted) {
          console.error('Error loading data:', error);
          setError('Failed to load data. Please try again later.');
          setLoading(false);
        }
      }
    };

    loadInitialData();
    return () => { mounted = false; };
  }, [loadMachineImage]);

  // Memoized filtered machines
  const filteredMachines = useMemo(() => {
    let filtered = machines.filter(machine => {
      const isTemplate = machine.is_template;
      if (activeTab === 'my-machines') {
        return !isTemplate;
      }
      return isTemplate && !machine.is_copy;
    });

    if (searchTerm) {
      filtered = filtered.filter(machine =>
        machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.id.toString().includes(searchTerm)
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(machine =>
        machine.department_name === selectedDepartment
      );
    }

    if (selectedType) {
      filtered = filtered.filter(machine =>
        machine.machine_type_name === selectedType
      );
    }

    return filtered;
  }, [machines, searchTerm, selectedDepartment, selectedType, activeTab]);

  // Memoized current page machines
  const currentMachines = useMemo(() => {
    const indexOfLastMachine = currentPage * machinesPerPage;
    const indexOfFirstMachine = indexOfLastMachine - machinesPerPage;
    return filteredMachines.slice(indexOfFirstMachine, indexOfLastMachine);
  }, [filteredMachines, currentPage, machinesPerPage]);

  const truncateDescription = useCallback((description) => {
    if (!description || description.length <= 100) return description;
    return description.slice(0, 100) + '...';
  }, []);
  
  const toggleDescription = useCallback((e, id) => {
    e.preventDefault();
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // Event handlers
  const handleRepairClick = useCallback((e, machineId) => {
    e.preventDefault();
    navigate(`/troubleshoot/${machineId}`);
  }, [navigate]);

  const paginate = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <p>Loading machines...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="my-machines-container">
      <div className="my-machines-content">
        <h1>Machines</h1>
        
        {/* Tabs */}
        <div className="machines-tabs">
          <button
            className={`tab-button ${activeTab === 'my-machines' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-machines')}
          >
            My Machines
          </button>
          <button
            className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
        </div>

        {/* Search and filters */}
        <div className="search-filter-container">
          <div className="search-bar2">
            <FaSearch />
            <input
              type="text"
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="troubleshoot-filters">
            <FaFilter />
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="">All Types</option>
              {machineTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Machines grid */}
        <div className="my-machine-grid">
          {activeTab === 'my-machines' && (
            <Link to="/add-machine" className="add-machine-card">
              <span className="add-machine-text">Add Machine</span>
              <div className="add-machine-button">
                <FaPlus />
              </div>
            </Link>
          )}

          {currentMachines.length === 0 ? (
            <p className="empty-message">
              {activeTab === 'my-machines' 
                ? 'No machines found. Add a new machine to get started!' 
                : 'No templates available.'}
            </p>
          ) : (
            currentMachines.map(machine => (
              <div key={machine.id} className="my-machine-card">
                <div className="machine-header">
                  <FaMagic 
                    className={`machine-header-icon icon-FaMagic ${machine.is_template ? 'disabled' : ''}`}
                    onClick={machine.is_template ? undefined : (e) => handleRepairClick(e, machine.id)}
                    title={machine.is_template ? "Copy template to enable troubleshooting" : "Repair It!"}
                  />
                  <h3>{machine.name}</h3>
                  <FaBookmark className="machine-header-icon icon-bookmark" title="Feature coming soon" />
                  <FaLock className="machine-header-icon icon-lock" title="Feature coming soon" />
                  {machine.is_template && <div className="template-badge">Template</div>}
                </div>
                <Link to={`/machines/${machine.id}`}>
                  <div className="my-machine-image">
                    <img 
                      src={machine.image_url} 
                      alt={machine.name}
                      loading="lazy"
                    />
                  </div>
                </Link>
                <div className="my-machine-info">
                  <p><span className="info-label">Model:</span> {machine.model}</p>
                  <p>
                    <span className="info-label">Description: </span>
                    <span className={`my-machine-description ${expandedDescriptions[machine.id] ? 'expanded' : ''}`}>
                      {expandedDescriptions[machine.id] 
                        ? machine.description 
                        : truncateDescription(machine.description || 'No description available')}
                    </span>
                    {machine.description && machine.description.length > 100 && (
                      <span 
                        className="read-more" 
                        onClick={(e) => toggleDescription(e, machine.id)}
                      >
                        {expandedDescriptions[machine.id] ? 'Read less' : 'Read more'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredMachines.length > machinesPerPage && (
          <div className="pagination">
            <button
              className="pagination-button"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FaChevronLeft />
            </button>
            <div className="page-numbers">
              {Array.from({ length: Math.ceil(filteredMachines.length / machinesPerPage) })
                .map((_, i) => (
                  <button
                    key={i + 1}
                    className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => paginate(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
            </div>
            <button
              className="pagination-button"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(filteredMachines.length / machinesPerPage)}
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyMachines;