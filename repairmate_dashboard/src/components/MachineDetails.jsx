import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMachineDetails, deleteMachine, getMachineImages, submitTroubleshootingRequest, getMachineManual, copyMachineTemplate  } from '../services/api';
import { FaBookmark, FaLock, FaCog, FaMagic, FaTrash, FaBook, FaPencilAlt, FaPlus, FaExclamationCircle, FaFilePdf, FaDownload, FaEllipsisV, FaCopy } from 'react-icons/fa';
import './MachineDetails.css';

import ManualUploadHandler from './ManualUploadHandler.jsx';

function MachineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef(null);
  const optionsButtonRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [manualUrl, setManualUrl] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  
  const loadMachineDetails = async () => {
    try {
      setLoading(true);
      const detailsResponse = await fetchMachineDetails(id);
      if (detailsResponse.data) {
        const imagesResponse = await getMachineImages(id);
        const imageUrl = imagesResponse.data.length > 0 ? imagesResponse.data[0].url : 'default_image_url_here'; // Asegúrate de tener una URL predeterminada

        try {
          const manualResponse = await getMachineManual(id);
          if (manualResponse.data && manualResponse.data.url) {
            setManualUrl(manualResponse.data.url);
          }
        } catch (error) {
          console.log('No manual found for this machine');
        }

        setMachine({
          ...detailsResponse.data,
          image_url: imageUrl
        });
      } else {
        setError('Machine details not found');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching machine details:', error);
      setError('Failed to load machine details');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMachineDetails();
  }, [id]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsMenu && optionsMenuRef.current && !optionsMenuRef.current.contains(event.target) && !optionsButtonRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptionsMenu]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      try {
        await deleteMachine(id);
        navigate('/machines');
      } catch (error) {
        console.error('Error deleting machine:', error);
        setError(`Failed to delete machine: ${error.message}`);
      }
    }
  };

  const handleRepairClick = (e, machineId) => {
    e.stopPropagation();
    navigate(`/troubleshoot/${machineId}`);
  };

  const handleEditMachine = () => {
    navigate(`/edit-machine/${id}`);
  };

  const handleTroubleshoot = () => {
    navigate(`/troubleshoot/${id}`);
  };




 const handleViewManual = async () => {
  try {
    const response = await getMachineManual(id);
    if (response.data.url) {
      // Abrir en una nueva ventana
      const pdfWindow = window.open('', '_blank');
      pdfWindow.document.write(`
        <html>
          <head>
            <title>Machine Manual</title>
          </head>
          <body style="margin:0;padding:0;">
            <iframe 
              src="${response.data.url}" 
              style="width:100%;height:100vh;border:none;"
            ></iframe>
          </body>
        </html>
      `);
    }
  } catch (error) {
    setError('Failed to load manual');
    console.error('Error loading manual:', error);
  }
};

  const handleManageIssuesAndSolutions = () => {
    navigate(`/manage-issues/${id}`);
  };


  const toggleOptionsMenu = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const ManualModal = () => (
    <div className="manual-modal" onClick={(e) => {
      e.preventDefault();
      setShowManualModal(false);
    }}>
      <div className="manual-modal-content" onClick={e => e.stopPropagation()}>
        <h3>Machine Manual</h3>
        <div className="manual-status">
          {manualUrl ? (
            <div className="manual-actions">
              <button onClick={() => window.open(manualUrl, '_blank')} className="view-manual-btn">
                <FaFilePdf /> View Manual
              </button>
              <button onClick={() => window.open(manualUrl, '_blank')} className="download-manual-btn">
                <FaDownload /> Download
              </button>
            </div>
          ) : (
            <p>No manual uploaded for this machine.</p>
          )}
          <ManualUploadHandler 
            machineId={id}
            onSuccess={(message) => {
              setSuccessMessage(message);
              loadMachineDetails();
            }}
            onError={(message) => setError(message)}
            onUploadComplete={(url) => {
              if (url) {
                setManualUrl(url);
                setTimeout(() => setShowManualModal(false), 1500);
              }
            }}
          />
        </div>
        <button className="close-modal" onClick={(e) => {
          e.preventDefault();
          setShowManualModal(false);
        }}>×</button>
      </div>
    </div>
  );

  const ViewManualButton = ({ hasManual, onClick }) => (
    <button 
      className={`manual-button ${!hasManual ? 'disabled' : ''}`}
      onClick={hasManual ? onClick : undefined}
      title={hasManual ? "View Machine Manual" : "No manual available"}
    >
      <FaBook /> View Manual
    </button>
  );

  const refreshDetails = async () => {
    try {
      const detailsResponse = await fetchMachineDetails(id);
      if (detailsResponse.data) {
        const imagesResponse = await getMachineImages(id);
        const imageUrl = imagesResponse.data.length > 0 
          ? imagesResponse.data[0].url 
          : 'default_image_url_here';

        try {
          const manualResponse = await getMachineManual(id);
          if (manualResponse.data && manualResponse.data.url) {
            setManualUrl(manualResponse.data.url);
          } else {
            setManualUrl(null);
          }
        } catch (error) {
          console.log('No manual found for this machine');
          setManualUrl(null);
        }

        setMachine({
          ...detailsResponse.data,
          image_url: imageUrl
        });
      }
    } catch (error) {
      console.error('Error refreshing machine details:', error);
      setError('Failed to refresh machine details');
    }
  };

  const handleTemplateAction = async () => {
    if (!machine) return;
  
    try {
      setIsCopying(true);
      const response = await copyMachineTemplate(machine.id);
      navigate(`/machines/${response.data.machine_id}`);
    } catch (error) {
      console.error('Copy template error:', error);
      if (error.response?.data?.machine_id) {
        // Usuario ya tiene una copia
        navigate(`/machines/${error.response.data.machine_id}`);
      } else {
        setError(
          error.response?.data?.detail || 
          'Failed to copy template. Please try again.'
        );
      }
    } finally {
      setIsCopying(false);
    }
  };




  if (loading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!machine) return <div className="error-message">Machine not found</div>;


  return (
    <div className="machine-details-container">
      <div className="machine-details-content">
        <div className="machine-image-card">
          <div className="machine-header2">
            {machine.is_template ? (
              // Si es template, mostrar el icono desactivado
              <FaMagic 
                className="machine-header-icon2 icon-FaMagic disabled"
                title="Copy template to enable troubleshooting"
              />
            ) : (
              // Si no es template, mantener la funcionalidad normal
              <FaMagic 
                className="machine-header-icon2 icon-FaMagic" 
                onClick={(e) => handleRepairClick(e, machine.id)}
                title="Repair It!"
              />
            )}
            <h1>{machine.name}</h1>
            <FaBookmark className="machine-header-icon2 icon-bookmark" title="Feature coming soon" />
            <FaLock className="machine-header-icon2 icon-lock" title="Feature coming soon" />
            {machine.is_template && (
              <div className="template-badge">
                Template
              </div>
            )}
          </div>
          <div className="machine-details-image">
            <img src={machine.image_url} alt={machine.name} />
            {/* Solo mostrar el botón de manual si no es template - si quiero quese vea */}

              <ViewManualButton 
                hasManual={!!manualUrl} 
                onClick={handleViewManual}
              />

          </div>
        </div>
        <div className="machine-info-card">
          <div className="action-buttons-container">
            <div className="action-buttons">
              <button ref={optionsButtonRef} className="action-buttons-machine-details" onClick={toggleOptionsMenu} title="Options">
                <FaEllipsisV />
              </button>
            </div>
            {showOptionsMenu && (
              <div ref={optionsMenuRef} className="options-menu">
                {machine.is_template ? (
                  // Si es un template, mostrar solo el botón de copiar
                  <button 
                    onClick={handleTemplateAction} 
                    disabled={isCopying}
                    className="copy-template-button"
                  >
                    <FaCopy /> {isCopying ? 'Copying...' : 'Copy Template'}
                  </button>
                ) : (
                  // Si no es template, mostrar los botones normales
                  <>
                    <button onClick={() => navigate(`/edit-machine/${id}`)}><FaPencilAlt /> Edit Machine</button>
                    <button onClick={() => navigate(`/manage-issues/${id}`)}><FaPlus /> Create Issues & Solutions</button>
                    <button className="delete-button-machine" onClick={handleDelete}>
                      <FaTrash /><span>Delete Machine</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="machine-details-info">
            <h2>Machine details:</h2>
            <p><strong>Model:</strong> {machine.model}</p>
            <p><strong>Series:</strong> {machine.series}</p>
            <p><strong>Description:</strong> {machine.description}</p>
            <p><strong>Category:</strong> {machine.category_name || 'N/A'}</p>
            <p><strong>Manufacturer:</strong> {machine.manufacturer_name || 'N/A'}</p>
            <p><strong>Department:</strong> {machine.department_name || 'N/A'}</p>
            <p><strong>Machine Type:</strong> {machine.machine_type_name || 'N/A'}</p>
            {!machine.is_template && (
              <ManualUploadHandler 
                machineId={id}
                hasManual={!!manualUrl}
                onSuccess={(message) => {
                  setSuccessMessage(message);
                  refreshDetails();
                }}
                onError={(message) => setError(message)}
                onUploadComplete={(url) => {
                  setManualUrl(url);
                }}
                refreshDetails={refreshDetails}
              />
            )}
          </div>
        </div>
        {showManualModal && <ManualModal />}
      </div>
    </div>
  );
}

export default MachineDetails;