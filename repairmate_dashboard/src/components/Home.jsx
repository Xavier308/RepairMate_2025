import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar.jsx';
import { FaMagic, FaBookmark, FaLock } from 'react-icons/fa';
import { fetchMachines, getMachineImages } from '../services/api';
import RecentActivity from './RecentActivity.jsx';
import NotesAndReminders from './NotesAndReminders.jsx';
import './Home.css';

{/*
function QuickStartGuidePopup({ onClose }) {
  return (
    <div className="quick-start-popup">
      <div className="quick-start-content">
        <h2>Quick Start Guide</h2>
        <ol>
          <li>Add your machines in the "My Machines" section</li>
          <li>Use the "Troubleshoot" feature when you encounter an issue</li>
          <li>Check out our "Training" materials to learn more about machine maintenance</li>
          <li>Use the notes and reminders to keep track of maintenance tasks</li>
        </ol>
        <button className="close-popup" onClick={onClose}>×</button>
      </div>
    </div>
  );
}
*/}


function Home() {
  const navigate = useNavigate();

  // State variables for machine data and UI control
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [showQuickStart, setShowQuickStart] = useState(true); // Controls visibility of the Quick Start Guide
  const [expandedDescriptions, setExpandedDescriptions] = useState({}); // Keeps track of expanded descriptions
  const [isLoading, setIsLoading] = useState(true); // Loading state for data fetching
  const [activeTab, setActiveTab] = useState('recent'); // Active tab state (e.g., 'recent' or 'bookmarked')

  // Fetch machine data when the component mounts
  useEffect(() => {
    const loadMachines = async () => {
      try {
        setIsLoading(true);
        const response = await fetchMachines();
        if (!response.data) {
          throw new Error('No machine data received');
        }

        // Filter out template machines and fetch images for each machine
        const nonTemplateMachines = response.data.filter(machine => !machine.is_template);
        const machinesWithImages = await Promise.all(
          nonTemplateMachines.map(async (machine) => {
            try {
              const imagesResponse = await getMachineImages(machine.id);
              return { 
                ...machine, 
                image_url: imagesResponse.data.length > 0 
                  ? imagesResponse.data[0].url 
                  : 'https://img.perceptpixel.com/bibawdef/RepairMate/default_machine.png'
              };
            } catch (error) {
              console.error(`Error fetching images for machine ${machine.id}:`, error);
              // Use a default image if image fetching fails
              return { 
                ...machine, 
                image_url: 'https://img.perceptpixel.com/bibawdef/RepairMate/default_machine.png' 
              };
            }
          })
        );
        
        setMachines(machinesWithImages);
        setFilteredMachines(machinesWithImages.slice(0, 3)); // Show only the first 3 machines initially
      } catch (error) {
        console.error('Error loading machines:', error);
        setFilteredMachines([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadMachines();
  }, []);

  // Handles search input and filters machines based on the search term
  const handleSearch = (term) => {
    const filtered = machines.filter(machine =>
      machine.name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredMachines(filtered.slice(0, 3)); // Limit results to 3 machines
  };

  // Gets the image URL for a machine or a default image if not available
  const getImageUrl = (machine) => {
    return machine.image_url || 'https://img.perceptpixel.com/bibawdef/RepairMate/default_machine.png';
  };

  // Truncates long descriptions to 100 characters with '...'
  const truncateDescription = (description) => {
    if (description.length <= 100) return description;
    return description.slice(0, 100) + '...';
  };

  // Toggles the expanded state of a machine's description
  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handles the click event for the "Repair It!" icon
  const handleRepairClick = (e, machineId) => {
    e.preventDefault();
    navigate(`/troubleshoot/${machineId}`);
  }; 

  
  return (
    <div className="home-container">
      <div className="home-content">
        <SearchBar onSearch={handleSearch} />
        <h1>Dashboard</h1>
        {/* pop-up blocked*/}
        {/*{showQuickStart && <QuickStartGuidePopup onClose={() => setShowQuickStart(false)} />}*/}

        <div className="dashboard-grid">
          <div className="info-cards">
            <div className="notes-reminders card">
              <NotesAndReminders />
            </div>

            <div className="recent-activity card">
              <RecentActivity />
            </div>
          </div>

          <div className="recent-machines">
            <div className="machines-tabs">
              <button
                className={`machines-tab ${activeTab === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveTab('recent')}
              >
                Recent Machines
              </button>
              {/*<button
                className={`machines-tab ${activeTab === 'bookmarked' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookmarked')}
              >
                Bookmarked Machines
              </button>*/}
            </div>

            {activeTab === 'recent' ? (
              <div className="home-machine-grid">
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : filteredMachines.length === 0 ? (
                  <p className="no-machines">No machines found</p>
                ) : (
                  filteredMachines.map(machine => (
                    <div key={machine.id} className="home-machine-card">
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
                      <Link to={`/machines/${machine.id}`}>
                        <div className="home-machine-image">
                          <img src={getImageUrl(machine)} alt={machine.name} />
                        </div>
                        </Link>
                      <div className="home-machine-info">
                        <p><span className="info-label">Model:</span> {machine.model}</p>
                        <p>
                          <span className="info-label">Description: </span>
                          <span className={`home-machine-description ${expandedDescriptions[machine.id] ? 'expanded' : ''}`}>
                            {expandedDescriptions[machine.id] 
                              ? machine.description 
                              : truncateDescription(machine.description || 'No description available')}
                          </span>
                          {machine.description && machine.description.length > 100 && (
                            <span 
                              className="read-more" 
                              onClick={(e) => {
                                e.preventDefault();
                                toggleDescription(machine.id);
                              }}
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
            ) : (
              <div className="home-machine-grid">
                <p className="no-machines">Bookmarked machines feature coming soon!</p>
              </div>
            )}
          </div> 
        </div>
      </div>
    </div>
  );
}

export default Home;