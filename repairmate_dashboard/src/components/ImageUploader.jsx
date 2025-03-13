import React, { useState } from 'react';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import { uploadStepImage } from '../services/api';

const ImageUploader = ({ onImageUpload, type, id }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (!id) {
      setError('Invalid step ID. Please save the step first.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      console.log('Uploading image:', { id, fileName: file.name });
      const response = await uploadStepImage(id, formData);
      console.log('Full response:', response);
      
      if (response.data?.url) {
        onImageUpload(response.data.url);
      } else {
        throw new Error(`Invalid response: ${JSON.stringify(response.data)}`);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
};

  return (
    <div className="image-uploader">
      {error && <div className="upload-error">{error}</div>}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id={`file-upload-${type}-${id}`}
      />
      <label 
        htmlFor={`file-upload-${type}-${id}`}
        className={`upload-button ${uploading ? 'uploading' : ''}`}
      >
        {uploading ? (
          <span className="upload-status">
            <FaSpinner className="fa-spin" /> Uploading...
          </span>
        ) : (
          <span className="upload-prompt">
            <FaUpload /> Upload Image
          </span>
        )}
      </label>
    </div>
  );
};

export default ImageUploader;