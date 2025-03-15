import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  fetchManufacturers, fetchCategories, fetchDepartments,
  fetchMachineTypes, createMachine, uploadMachineImage
} from '@/services/api';

import CustomizationWizard from '@/components/CustomizationWizard/CustomizationWizard.jsx';
import './AddMachine.css';

// Component for adding a new machine
function AddMachine() {
  // State variables for input fields and form management
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [series, setSeries] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null); // To store the selected image file
  const [imagePreview, setImagePreview] = useState(null); // For image preview
  const [categoryId, setCategoryId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [machineTypeId, setMachineTypeId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customManufacturer, setCustomManufacturer] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [customMachineType, setCustomMachineType] = useState('');
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [error, setError] = useState('');
  const [showWizard, setShowWizard] = useState(false); // Controls the display of the customization wizard
  const [newMachineId, setNewMachineId] = useState(null);

  const navigate = useNavigate();

  // Default image URL used when no custom image is uploaded
  const DEFAULT_IMAGE_URL = 'https://img.perceptpixel.com/bibawdef/RepairMate/defaultMachineNonUpload.jpg';

  // Fetch initial data for dropdowns when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [manufacturersData, categoriesData, departmentsData, machineTypesData] = await Promise.all([
          fetchManufacturers(),
          fetchCategories(),
          fetchDepartments(),
          fetchMachineTypes()
        ]);
        setManufacturers(manufacturersData.data);
        setCategories(categoriesData.data);
        setDepartments(departmentsData.data);
        setMachineTypes(machineTypesData.data);
      } catch (error) {
        setError('Failed to load data. Please try again.');
      }
    };
    fetchData();
  }, []);

  // Handles form submission for creating a new machine
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    try {
      const machineData = {
        name,
        model,
        series,
        description,
        // Use custom input if provided, otherwise use the selected ID
        category: customCategory || (categoryId ? categories.find(c => c.id === parseInt(categoryId))?.category_name : null),
        manufacturer: customManufacturer || (manufacturerId ? manufacturers.find(m => m.id === parseInt(manufacturerId))?.name : null),
        department: customDepartment || (departmentId ? departments.find(d => d.id === parseInt(departmentId))?.name : null),
        machine_type: customMachineType || (machineTypeId ? machineTypes.find(t => t.id === parseInt(machineTypeId))?.name : null)
      };

      // Create machine and get the new machine ID
      const response = await createMachine(machineData);
      const newMachineId = response.data.id;

      if (image) {
        // If a custom image is provided, upload it
        const formData = new FormData();
        formData.append('image', image);
        try {
          await uploadMachineImage(newMachineId, formData);
          console.log('Custom image uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading custom image:', uploadError);
        }
      } else {
         // If no custom image, upload the default image
        try {
          const response = await fetch(DEFAULT_IMAGE_URL);
          const blob = await response.blob();
          const defaultImageFile = new File([blob], 'default-machine-image.jpg', { type: 'image/jpeg' });
          
          const formData = new FormData();
          formData.append('image', defaultImageFile);
          
          await uploadMachineImage(newMachineId, formData);
          console.log('Default image uploaded successfully');
        } catch (defaultImageError) {
          console.error('Error uploading default image:', defaultImageError);
        }
      }

      // Show the customization wizard after successful creation
      setNewMachineId(newMachineId);
      setShowWizard(true);

    } catch (error) {
      console.error('Error creating machine:', error);
      setError('Failed to create machine. Please try again.');
    }
  };

  // Handle image change and set preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);  // Preview the selected image
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);  // Clear preview if no file is selected
    }
  };


  return (
    <div className="add-machine">
      <h2>Add New Machine</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Machine Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Series"
          value={series}
          onChange={(e) => setSeries(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <div className="image-upload">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            id="image-upload"
          />
          <label htmlFor="image-upload" className="image-upload-label">
            {imagePreview ? 'Change Image' : 'Upload Image'}
          </label>
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>
        
        <div className="select-custom-wrapper">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.category_name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Or enter custom category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          />
        </div>

        <div className="select-custom-wrapper">
          <select
            value={manufacturerId}
            onChange={(e) => setManufacturerId(e.target.value)}
          >
            <option value="">Select Manufacturer</option>
            {manufacturers.map(manufacturer => (
              <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Or enter custom manufacturer"
            value={customManufacturer}
            onChange={(e) => setCustomManufacturer(e.target.value)}
          />
        </div>

        <div className="select-custom-wrapper">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">Select Department</option>
            {departments.map(department => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Or enter custom department"
            value={customDepartment}
            onChange={(e) => setCustomDepartment(e.target.value)}
          />
        </div>

        <div className="select-custom-wrapper">
          <select
            value={machineTypeId}
            onChange={(e) => setMachineTypeId(e.target.value)}
          >
            <option value="">Select Machine Type</option>
            {machineTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Or enter custom machine type"
            value={customMachineType}
            onChange={(e) => setCustomMachineType(e.target.value)}
          />
        </div>

        <button type="submit">Add Machine</button>
      </form>
      {showWizard && (
        <CustomizationWizard 
          open={showWizard} 
          machineId={newMachineId}
          onClose={() => {
            setShowWizard(false);
            navigate(`/machines/${newMachineId}`);
          }}
        />
      )}
    </div>
  );
}

export default AddMachine;