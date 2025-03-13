// components/ManualUploadHandler.js
import React, { useState } from 'react';
import { uploadMachineManual, getMachineManual, deleteMachineManual } from '../services/api';
import { FaTrash } from 'react-icons/fa';

// Component for handling the upload and deletion of machine manuals
function ManualUploadHandler({ machineId, onSuccess, onError, onUploadComplete, hasManual, refreshDetails }) {
  const [loading, setLoading] = useState(false);

  // Handles the file selection and initiates the upload
  const handleFileSelect = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return; // Exit if no file is selected

    // Ensure the selected file is a PDF
    if (!file.type.includes('pdf')) {
      onError('Please select a PDF file');
      return;
    }

    setLoading(true); // Set loading state
    const formData = new FormData();
    formData.append('manual', file); // Append the file to the form data

    try {
      const response = await uploadMachineManual(machineId, formData);
      if (response.data) {
        onSuccess('Manual uploaded successfully');
        if (onUploadComplete) {
          onUploadComplete(response.data.url);
        }
        // Refresh machine details
        refreshDetails();
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError(error.response?.data?.message || 'Failed to upload manual');
    } finally {
      setLoading(false);
    }
  };

  // Handles the deletion of the uploaded manual
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this manual?')) return;

    setLoading(true);
    try {
      await deleteMachineManual(machineId);
      onSuccess('Manual deleted successfully');
      refreshDetails();
    } catch (error) {
      onError('Failed to delete manual');
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show the upload button only if there is no existing manual
  if (!hasManual) {
    return (
      <div className="manual-upload-handler">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="manual-upload"
        />
        <label htmlFor="manual-upload" className="upload-label">
          {loading ? 'Uploading...' : 'Upload Manual (PDF)'}
        </label>
      </div>
    );
  }

  // Render a delete button if there is an existing manual
  return (
    <div className="manual-upload-handler">
      <button 
        onClick={handleDelete} 
        disabled={loading} 
        className={`delete-button ${loading ? 'loading' : ''}`}
      >
        <FaTrash /> Delete Manual
      </button>
    </div>
  );
}

export default ManualUploadHandler;