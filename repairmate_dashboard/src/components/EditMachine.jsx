import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMachineDetails, updateMachine, fetchManufacturers, fetchCategories, fetchDepartments, fetchMachineTypes, uploadMachineImage, deleteMachineImage} from '../services/api';
import { FaTrash } from 'react-icons/fa';
import './EditMachine.css';

// Component for editing machine details
function EditMachine() {
  const { id } = useParams(); // Gets the machine ID from the URL
  const navigate = useNavigate();

  // State variables for storing and managing machine data
  const [machine, setMachine] = useState(null);
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [series, setSeries] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null); // Holds the uploaded image file
  const [imagePreview, setImagePreview] = useState(null); // Preview for the uploaded image
  const [existingImageId, setExistingImageId] = useState(null); // ID of the current image, if any

  // State variables for dropdown selections and custom values
  const [categoryId, setCategoryId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [machineTypeId, setMachineTypeId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customManufacturer, setCustomManufacturer] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [customMachineType, setCustomMachineType] = useState('');
  
  // State variables for dropdown data and error handling
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [error, setError] = useState('');

  // Fetches machine details and data for dropdowns when the component loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch machine details and dropdown data concurrently
        const [machineData, manufacturersData, categoriesData, departmentsData, machineTypesData] = await Promise.all([
          fetchMachineDetails(id),
          fetchManufacturers(),
          fetchCategories(),
          fetchDepartments(),
          fetchMachineTypes()
        ]);
        
        // Set machine details and populate form fields
        setMachine(machineData.data);
        setName(machineData.data.name);
        setModel(machineData.data.model);
        setSeries(machineData.data.series);
        setDescription(machineData.data.description || '');

        // Set image preview if an image exists
        if (machineData.data.images && machineData.data.images.length > 0) {
          setImagePreview(machineData.data.images[0].url);
          setExistingImageId(machineData.data.images[0].id);
        }
        
        // Set the IDs if the values exist in the lists, otherwise set as custom values
        const category = categoriesData.data.find(c => c.category_name === machineData.data.category);
        setCategoryId(category ? category.id : '');
        setCustomCategory(category ? '' : machineData.data.category);

        const manufacturer = manufacturersData.data.find(m => m.name === machineData.data.manufacturer);
        setManufacturerId(manufacturer ? manufacturer.id : '');
        setCustomManufacturer(manufacturer ? '' : machineData.data.manufacturer);

        const department = departmentsData.data.find(d => d.name === machineData.data.department);
        setDepartmentId(department ? department.id : '');
        setCustomDepartment(department ? '' : machineData.data.department);

        const machineType = machineTypesData.data.find(t => t.name === machineData.data.machine_type);
        setMachineTypeId(machineType ? machineType.id : '');
        setCustomMachineType(machineType ? '' : machineData.data.machine_type);

        // Set dropdown data
        setManufacturers(manufacturersData.data);
        setCategories(categoriesData.data);
        setDepartments(departmentsData.data);
        setMachineTypes(machineTypesData.data);
      } catch (error) {
        setError('Failed to load data. Please try again.');
      }
    };
    fetchData();
  }, [id]);

  // Handles image file selection and sets a preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Deletes the existing image if there is one
  const handleRemoveImage = async () => {
    if (existingImageId) {
      try {
        await deleteMachineImage(id, existingImageId);
        setImagePreview(null);
        setExistingImageId(null);
        setImage(null);
      } catch (error) {
        console.error('Error deleting image:', error);
        setError('Failed to delete image. Please try again.');
      }
    } else {
      setImagePreview(null);
      setImage(null);
    }
  };

  // Handles form submission to update the machine
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedMachineData = {
        name,
        model,
        series,
        description,
        category: customCategory || (categoryId ? categories.find(c => c.id === parseInt(categoryId))?.category_name : null),
        manufacturer: customManufacturer || (manufacturerId ? manufacturers.find(m => m.id === parseInt(manufacturerId))?.name : null),
        department: customDepartment || (departmentId ? departments.find(d => d.id === parseInt(departmentId))?.name : null),
        machine_type: customMachineType || (machineTypeId ? machineTypes.find(t => t.id === parseInt(machineTypeId))?.name : null)
      };
      await updateMachine(id, updatedMachineData);

      // If a new image is uploaded, delete the old one and upload the new one
      if (image) {
        if (existingImageId) {
          await deleteMachineImage(id, existingImageId);
        }
        const formData = new FormData();
        formData.append('image', image);
        try {
          await uploadMachineImage(id, formData);
          console.log('Image uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
        }
      }

      // Navigate to the updated machine's details page
      navigate(`/machines/${id}`);
    } catch (error) {
      setError('Failed to update machine. Please try again.');
    }
  };

  if (!machine) return <div>Loading...</div>;

  return (
    <div className="edit-machine">
      <h2>Edit Machine</h2>
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
          {imagePreview ? (
            <div>
              <img src={imagePreview} alt="Machine preview" className="image-preview" />
              <button 
                className="remove-image-btn" 
                type="button" 
                onClick={handleRemoveImage}
              >
                <FaTrash /> Remove Image
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="image-upload"
              />
              <label htmlFor="image-upload" className="image-upload-label">
                Upload Image
              </label>
            </>
          )}
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
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
          onChange={(e) => {
            setCustomCategory(e.target.value);
            setCategoryId('');
          }}
        />
        <select
          value={manufacturerId}
          onChange={(e) => setManufacturerId(e.target.value)}
          required
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
        <button type="submit">Update Machine</button>
      </form>
    </div>
  );
}

export default EditMachine;