import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaWrench, FaTrash } from 'react-icons/fa';

import { 
  updateSolution, getStepImages, deleteStepImage, createGuide, createSolution, deleteSolution
} from '@/services/api';

import ImageUploader from '@/components/common/ImageUploader.jsx';

// Some comments are in Spanish - Needs to be change to English ***

function SolutionEditor({ solutions, setSolutions, issueId }) {
  const [expandedSolutionId, setExpandedSolutionId] = useState(null);
  const [editingSolutionId, setEditingSolutionId] = useState(null);
  const [editedSolution, setEditedSolution] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);
  const [creatingGuide, setCreatingGuide] = useState(false);
  const [newGuideTitle, setNewGuideTitle] = useState('');
  const [newSolutionDescription, setNewSolutionDescription] = useState('');
  // new state to track original steps
  const [originalSteps, setOriginalSteps] = useState([]);


  // Primero agregamos logs claros para diagnóstico
  const loadSolutionImages = async (solution) => {
    if (solution.guide && solution.guide.steps) {
      const updatedSteps = await Promise.all(
        solution.guide.steps.map(async (step) => {
          if (step.id) {
            try {
              const imagesResponse = await getStepImages(step.id);
              return {
                ...step,
                image_urls: imagesResponse.map(img => img.url)
              };
            } catch (error) {
              console.error(`Error loading images for step ${step.id}:`, error);
              return {
                ...step,
                image_urls: []
              };
            }
          }
          return step;
        })
      );
      return {
        ...solution,
        guide: {
          ...solution.guide,
          steps: updatedSteps
        }
      };
    }
    return solution;
  };

  // Simplificamos el manejo de imágenes en los pasos
  const StepImages = ({ images }) => {
    if (!images || images.length === 0) {
      return null;
    }

    return (
      <div className="step-images">
        {images.map((url, index) => (
          <div key={index} className="step-image-container">
            <img 
              src={url} 
              alt={`Step image ${index + 1}`} 
              onError={(e) => {
                console.error('Error loading image:', url);
                e.target.src = 'default_image_url_here';
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // En el componente principal del step:
  const StepComponent = ({ step }) => {
    console.log('Rendering step with images:', step.image_urls);
    
    return (
      <div className="step-item">
        <p><strong>Step {step.step_number}:</strong> {step.description}</p>
        <StepImages images={step.image_urls} />
      </div>
    );
  };


  const handleAddSolution = async () => {
    if (!newSolutionDescription.trim()) {
      setError('Please enter a solution description');
      return;
    }

    try {
      const response = await createSolution(issueId, {
        description: newSolutionDescription
      });
      setSolutions([...solutions, response.data]);
      setNewSolutionDescription('');
      setError(null);
    } catch (error) {
      console.error('Failed to add solution:', error);
      setError('Failed to add solution. Please try again.');
    }
  };

  const handleEditSolution = (solutionId) => {
    const solutionToEdit = solutions.find(s => s.id === solutionId);
    setEditingSolutionId(solutionId);
    setEditedSolution(solutionToEdit);
    if (solutionToEdit.guide) {
      // Store both current and original steps
      const currentSteps = solutionToEdit.guide.steps || [];
      setSteps(currentSteps);
      setOriginalSteps(currentSteps);
    } else {
      // Clear steps when editing a solution without a guide
      setSteps([]);
      setOriginalSteps([]);
    }
    setExpandedSolutionId(solutionId);
  };

  const handleCancel = () => {
    // Restore original state
    setEditingSolutionId(null);
    setCreatingGuide(false);
    setEditedSolution(null);
    setSteps([]); // Clear steps
    setOriginalSteps([]); // Clear original steps
    setNewGuideTitle(''); // Clear guide title
  };

  const handleCreateGuide = async (solutionId) => {
    try {
      // Clear any lingering steps data before creating new guide
      setSteps([]);
      setOriginalSteps([]);
      setEditedSolution(null);  // New
      setNewGuideTitle('');
      
      const guideData = {
        title: newGuideTitle || `Guide for Solution ${solutionId}`,
        steps: []
      };
      const response = await createGuide(solutionId, guideData);
      const updatedSolutions = solutions.map(s => 
        s.id === solutionId ? { ...s, guide: response.data } : s
      );
      setSolutions(updatedSolutions);
      setCreatingGuide(false);
      //setNewGuideTitle('');
      handleEditSolution(solutionId);
    } catch (error) {
      console.error('Failed to create guide:', error);
      setError('Failed to create guide. Please try again.');
    }
  };

  const handleSaveSolution = async () => {
    try {
      const solutionData = {
        description: editedSolution.description,
      };
  
      if (editedSolution.guide || steps.length > 0) {
        const validSteps = steps.map((step, index) => ({
          id: step.id,
          step_number: index + 1,
          description: step.description?.trim() || '',
          image_urls: step.image_urls || [],
          video_urls: step.video_urls || []
        })).filter(step => step.description !== '' || step.id);
  
        solutionData.guide = {
          id: editedSolution.guide?.id,
          title: editedSolution.guide?.title || `Guide for Solution ${editingSolutionId}`,
          steps: validSteps
        };
      }
  
      console.log('Sending solution data:', solutionData);
      const updatedSolution = await updateSolution(editingSolutionId, solutionData);
      
      // Actualizar el estado local con los IDs actualizados
      if (updatedSolution.guide && updatedSolution.guide.steps) {
        setSteps(updatedSolution.guide.steps);
      }
      
      const updatedSolutions = solutions.map(s => 
        s.id === editingSolutionId ? updatedSolution : s
      );
      setSolutions(updatedSolutions);
      setEditedSolution(updatedSolution);
  
      // Cerrar el modo de edición
      setEditingSolutionId(null);
      setCreatingGuide(false);
      setError(null);
  
      // Opcional: Mostrar un mensaje de éxito
      // setSuccessMessage('Solution saved successfully');
    } catch (error) {
      console.error('Failed to update solution:', error);
      setError('Failed to update solution. Please try again.');
    }
  };

  // Function to handle solution deletion
  const handleDeleteSolution = async (solutionId) => {
    if (!window.confirm('Are you sure you want to delete this solution? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSolution(solutionId);
      // Update the local state by removing the deleted solution
      const updatedSolutions = solutions.filter(s => s.id !== solutionId);
      setSolutions(updatedSolutions);
      // Reset states if we were editing the deleted solution
      if (editingSolutionId === solutionId) {
        setEditingSolutionId(null);
        setEditedSolution(null);
        setSteps([]);
        setOriginalSteps([]);
      }
      if (expandedSolutionId === solutionId) {
        setExpandedSolutionId(null);
      }
    } catch (error) {
      console.error('Failed to delete solution:', error);
      setError('Failed to delete solution. Please try again.');
    }
  };

  const handleAddStep = () => {
    const newStep = {
      step_number: steps.length + 1,
      description: '',
      image_urls: [],
      video_urls: []
    };
  
    // Actualizar el estado local con el nuevo paso
    const updatedSteps = [...steps, newStep];
    setSteps(updatedSteps);
  
    // Actualizar la solución editada con el nuevo paso
    setEditedSolution(prev => ({
      ...prev,
      guide: {
        ...prev.guide,
        steps: updatedSteps
      }
    }));
  };

  const handleStepChange = (index, field, value) => {
    const updatedSteps = steps.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    );
    setSteps(updatedSteps);
  };

  const handleImageUpload = async (stepIndex, imageUrl) => {
    console.log('Handling image upload:', { stepIndex, imageUrl });
    
    const step = steps[stepIndex];
    if (!step || !step.id) {
      console.error('Invalid step or missing step ID:', step);
      return;
    }

    const updatedSteps = [...steps];
    if (!updatedSteps[stepIndex].image_urls) {
      updatedSteps[stepIndex].image_urls = [];
    }
    updatedSteps[stepIndex].image_urls.push(imageUrl);
    setSteps(updatedSteps);

    try {
      await handleSaveSolution();
    } catch (error) {
      console.error('Error saving step with new image:', error);
      // Revertir cambios si falla el guardado
      const revertedSteps = [...steps];
      setSteps(revertedSteps);
    }
  };

  const handleRemoveImage = async (stepIndex, urlIndex) => {
    try {
      const step = steps[stepIndex];
      if (!step.id) {
        console.error('Step ID is missing');
        return;
      }

      const imageUrl = step.image_urls[urlIndex];
      const imageFileName = imageUrl.split('/').pop();

      await deleteStepImage(step.id, imageFileName);

      const updatedSteps = [...steps];
      updatedSteps[stepIndex].image_urls = updatedSteps[stepIndex].image_urls.filter((_, index) => index !== urlIndex);
      setSteps(updatedSteps);

    } catch (error) {
      console.error('Failed to delete image:', error);
      setError('Failed to delete image. Please try again.');
    }
  };

  const handleUrlChange = (stepIndex, type, urlIndex, value) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex][type][urlIndex] = value;
    setSteps(updatedSteps);
  };

  const addUrl = (stepIndex, type) => {
    const updatedSteps = [...steps];
    if (!updatedSteps[stepIndex][type]) {
      updatedSteps[stepIndex][type] = [];
    }
    updatedSteps[stepIndex][type].push('');
    setSteps(updatedSteps);
  };

  const removeUrl = (stepIndex, type, urlIndex) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex][type] = updatedSteps[stepIndex][type].filter((_, i) => i !== urlIndex);
    setSteps(updatedSteps);
  };

  const toggleSolution = (solutionId) => {
    setExpandedSolutionId(expandedSolutionId === solutionId ? null : solutionId);
  };

  const renderStepImages = (step) => {
    if (!step.image_urls || step.image_urls.length === 0) {
      return <p>No images for this step</p>;
    }
    return (
      <div className="step-images">
        {step.image_urls.map((url, index) => (
          <div key={index} className="step-image-container">
            <img 
              src={url}
              alt={`Step ${step.step_number} image ${index + 1}`}
              onError={(e) => {
                console.error('Failed to load image:', url);
                e.target.style.display = 'none';
              }}
              style={{
                maxWidth: '200px',
                margin: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <button 
              onClick={() => handleRemoveImage(step.id, index)}
              className="remove-image-button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="solutions-section">
      <h2>Possible Solutions:</h2>
      {solutions.map((solution, index) => {
        console.log('Rendering solution:', solution);
        return (
          <div key={solution.id} className="solution-item">
            <div 
              className="solution-header"
              onClick={() => toggleSolution(solution.id)}
            >
              <div className="solution-title">
                <span className="solution-number">Solution {index + 1}</span>
                <span className="solution-description">{solution.description}</span>
                {solution.guide && (
                  <span className="guide-badge">
                    <FaWrench />
                    Step Guide
                  </span>
                )}
              </div>
              <div className="solution-actions">
                <button
                  className="delete-solution-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSolution(solution.id);
                  }}
                  title="Delete solution"
                >
                  <FaTrash />
                </button>
                {expandedSolutionId === solution.id ? <FaChevronUp /> : <FaChevronDown />}
              </div>
            </div>

            <div className={`solution-content ${expandedSolutionId === solution.id ? 'expanded' : ''}`}>
              {editingSolutionId === solution.id && editedSolution ? (
                <div className="edit-solution-form">
                  <h5>Solution description</h5>
                  <textarea
                    value={editedSolution.description}
                    onChange={(e) => setEditedSolution({ ...editedSolution, description: e.target.value })}
                    placeholder="Solution description"
                  />
                  {(editedSolution.guide || creatingGuide) && (
                    <>
                      <h5>Guide title</h5>
                      <input
                        value={editedSolution.guide?.title || ''}
                        onChange={(e) => setEditedSolution({ 
                          ...editedSolution, 
                          guide: { 
                            ...editedSolution.guide, 
                            title: e.target.value 
                          } 
                        })}
                        placeholder="Guide title"
                      />
                      {steps.map((step, stepIndex) => {
                        console.log('Rendering step for editing:', step); // Debug
                        return (
                          <div key={stepIndex} className="edit-step">
                            <h4>Step {stepIndex + 1}</h4>
                            <input
                              value={step.description}
                              onChange={(e) => handleStepChange(stepIndex, 'description', e.target.value)}
                              placeholder="Description"
                            />
                            {/*<div>
                              <h4>Images</h4>
                              <ImageUploader 
                                onImageUpload={(imageUrl) => {
                                  console.log('Image uploaded, URL:', imageUrl);
                                  handleImageUpload(stepIndex, imageUrl);
                                }}
                                type="step"
                                id={step.id}  // Asegúrate de que step.id existe
                              />
                              {step.image_urls && step.image_urls.length > 0 ? (
                                <div className="step-images">
                                  {step.image_urls.map((url, urlIndex) => (
                                    <div key={`image-${urlIndex}`} className="step-image-container">
                                      <img 
                                        src={url} 
                                        alt={`Step ${step.step_number} image ${urlIndex + 1}`}
                                        onError={(e) => {
                                          console.error('Image failed to load:', url);
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                      <button onClick={() => handleRemoveImage(stepIndex, urlIndex)}>Remove</button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p>No images uploaded for this step</p>
                              )}
                            </div>
                            <div>
                              <h4>Video URLs</h4>
                              {step.video_urls && step.video_urls.map((url, urlIndex) => (
                                <div key={`video-${urlIndex}`}>
                                  <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => handleUrlChange(stepIndex, 'video_urls', urlIndex, e.target.value)}
                                    placeholder="Video URL"
                                  />
                                  <button onClick={() => removeUrl(stepIndex, 'video_urls', urlIndex)}>Remove</button>
                                </div>
                              ))}
                              <button onClick={() => addUrl(stepIndex, 'video_urls')}>Add Video URL</button>
                            </div>*/}
                          </div>
                        );
                      })}
                      <div className="button-group">
                        <button onClick={handleAddStep} className="action-button primary-button">Add Step</button>
                      </div>
                    </>
                  )}
                  <div className="button-group">
                    <button onClick={handleSaveSolution} className="action-button primary-button">Save Solution</button>
                    <button 
                      onClick={handleCancel} 
                      className="action-button secondary-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {solution.guide ? (
                    <div className="guide-section">
                      <h4>Troubleshooting Guide: {solution.guide.title}</h4>
                      {solution.guide.steps && solution.guide.steps.map((step, stepIndex) => {
                        console.log('Viewing step:', step);
                        console.log('Step images:', step.image_urls);
                        return (
                          <div key={stepIndex} className="step-item">
                            <p><strong>Step {step.step_number}:</strong> {step.description}</p>
                            {/*{step.image_urls && step.image_urls.length > 0 ? (
                              <div className="step-images">
                                {step.image_urls.map((url, urlIndex) => {
                                  console.log('Rendering view image:', url);
                                  return (
                                    <div key={`image-${urlIndex}`} className="step-image-container">
                                      <img 
                                        src={url} 
                                        alt={`Step ${step.step_number} image ${urlIndex + 1}`}
                                        onError={(e) => {
                                          console.error('Image failed to load:', url);
                                          e.target.style.display = 'none';
                                        }}
                                        onLoad={() => console.log('Image loaded successfully:', url)}
                                        style={{maxWidth: '200px', margin: '10px', border: '1px solid #ddd'}}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p>No images available for this step</p>
                            )}
                            {step.video_urls && step.video_urls.length > 0 && (
                              <div className="step-videos">
                                {step.video_urls.map((url, urlIndex) => (
                                  <div key={urlIndex}>
                                    <a href={url} target="_blank" rel="noopener noreferrer">Video {urlIndex + 1}</a>
                                  </div>
                                ))}
                              </div>
                            )}*/}
                          </div>
                        );
                      })}
                      <button onClick={() => handleEditSolution(solution.id)}>Edit Guide</button>
                    </div>
                  ) : creatingGuide && editingSolutionId === solution.id ? (
                    <div className="create-guide-form">
                      <input
                        type="text"
                        value={newGuideTitle}
                        onChange={(e) => setNewGuideTitle(e.target.value)}
                        placeholder="Enter guide title"
                      />
                      <div className="button-group">
                        <button onClick={() => handleCreateGuide(solution.id)}>Create Guide</button>
                        <button onClick={handleCancel}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="button-group">
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setSteps([]);
                          setOriginalSteps([]);
                          setEditedSolution(null); // New
                          setEditingSolutionId(solution.id);
                          setCreatingGuide(true);
                          setNewGuideTitle(''); // New
                        }}
                      >
                        Add Troubleshooting Guide
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleEditSolution(solution.id)}
                      >
                        Edit Solution
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="add-solution-form">
        <textarea
          value={newSolutionDescription}
          onChange={(e) => setNewSolutionDescription(e.target.value)}
          placeholder="Enter a solution description"
        />
        <button onClick={handleAddSolution}>Add Another Solution</button>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default SolutionEditor;
