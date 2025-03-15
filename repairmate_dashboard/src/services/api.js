import axios from 'axios';
import { formatISO } from 'date-fns';
import { toDate, formatInTimeZone } from 'date-fns-tz';


const API_URL = '/';  // nos permite
//const API_URL = 'http://127.0.0.1:8000/'; Sí permite entrar con solo Django
//const API_URL = 'http://localhost:8000/';
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuración global para incluir el token en todas las solicitudes
api.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
    console.log('Auth token set:', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.log('Auth token removed');
  }
};

export const login = (username, password) => {
  return api.post('api-token-auth/', { username, password });
};

// User profile
export const fetchUserProfile = async () => {
  try {
    //console.log('Fetching user profile...');
    const response = await api.get('api/user/profile/');
    //console.log('User profile response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('api/user/profile/', userData);
    return response.data;
  } catch (error) {
    if (error.response) {
    }
    throw error;
  }
};

// New for user preferences
export const fetchUserPreferences = async () => {
  try {
    console.log('Fetching user preferences...');
    const response = await api.get('/api/preferences/');
    console.log('Preferences response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    throw error;
  }
};

export const updateUserPreferences = async (preferences) => {
  try {
    console.log('Updating preferences:', preferences);
    let response;
    
    if (preferences.id) {
      console.log(`Using PUT to update preferences with id ${preferences.id}`);
      response = await api.put(`/api/preferences/${preferences.id}/`, preferences);
    } else {
      console.log('Using POST to create new preferences');
      response = await api.post('/api/preferences/', preferences);
    }
    
    console.log('Update response:', response);
    return response;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};


// Notes API endpoints
export const fetchNotes = async () => {
  return api.get('api/notes/');
};

export const createNote = async (noteData) => {
  let processedData = { ...noteData };
  
  if (noteData.is_reminder && noteData.reminder_date) {
    try {
      // Obtener la zona horaria de las preferencias del usuario
      const userPreferences = await api.get('api/preferences/');
      const userTimezone = userPreferences.data.length > 0 
        ? userPreferences.data[0].timezone 
        : 'America/Puerto_Rico';

      // Convertir la fecha a UTC
      const date = toDate(new Date(noteData.reminder_date));
      processedData.reminder_date = formatInTimeZone(date, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX");
    } catch (error) {
      console.error('Error processing date:', error);
      throw error;
    }
  }

  return api.post('api/notes/', processedData);
};

export const updateNote = async (noteId, noteData, method = 'PUT') => {
  try {
    console.log(`Sending ${method} request with data:`, noteData);
    
    const response = await (method === 'PATCH' 
      ? api.patch(`api/notes/${noteId}/`, noteData)
      : api.put(`api/notes/${noteId}/`, noteData)
    );
    
    return response;
  } catch (error) {
    console.error('Update request failed:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteNote = async (noteId) => {
  return api.delete(`api/notes/${noteId}/`);
};

// Activity logs API endpoints
export const fetchActivityLogs = async () => {
  return api.get('api/activity-logs/');
};

// -----
// Edited, if problems look at this
export const fetchMachines = async () => {
  try {
    const response = await api.get('api/machines/');
    return response;
  } catch (error) {
    console.error('Error fetching machines:', error);
    throw error;
  }
};

// Important do not Change, it breaks
export const fetchMachineDetails = (id) => {
  return api.get(`api/machines/${id}/`);
};

export const fetchTroubleshootingGuide = (machineId, guideId) => {
  return api.get(`api/machines/${machineId}/guides/${guideId}/`);
};

// fix the endpoint so it can bring the specific machine
export const fetchAllIssues = async () => {
  try {
    const response = await api.get('api/issues/');
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];  // Return an empty array if the response is not as expected
    }
  } catch (error) {
    throw error;
  }
};

export const fetchDepartments = () => {
  return api.get('api/departments/');
};

export const fetchMachineTypes = () => {
  return api.get('api/machine-types/');
};

// create machines
export const createMachine = (machineData) => {
  return api.post('api/machines/', machineData);
};

export const updateMachine = (id, machineData) => {
  return api.put(`api/machines/${id}/`, machineData);
};

// DeleteMachine (api.js)
export const deleteMachine = async (id) => {
  try {
    const response = await api.delete(`api/machines/${id}/`);
    return response;
  } catch (error) {
    throw error;
  }
};

// New for copy template *****
export const copyMachineTemplate = async (templateId) => {
  try {
    const response = await api.post(`api/machines/${templateId}/copy_template/`);
    return response;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

export const uploadMachineImage = (machineId, imageData) => {
  return api.post(`api/machines/${machineId}/upload_image/`, imageData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export const getMachineImages = (machineId) => {
  return api.get(`api/machines/${machineId}/images/`);
};


// La modificamos para que solo borre imagenes
export const deleteMachineImage = (machineId, imageId) => {
  return api.delete(`/api/machines/${machineId}/delete_image/`, { 
    data: { 
      file_id: imageId,
      file_type: 'IMAGE'  // Especificar que solo queremos borrar imágenes
    } 
  });
};

// New Feature
export const uploadIssueImage = (issueId, imageData) => {
  return api.post(`api/issues/${issueId}/upload_image/`, imageData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export const getIssueImages = (issueId) => {
  return api.get(`api/issues/${issueId}/images/`);
};

export const deleteIssueImage = (issueId, fileId) => {
  return api.delete(`/api/issues/${issueId}/delete_image/`, { data: { file_id: fileId } });
};


// funcionanaba - se cambió para hacerla mas robusta.
export const uploadStepImage = async (stepId, imageData) => {
  try {
    console.log('Starting step image upload:', { stepId });
    
    const response = await api.post(`api/steps/${stepId}/upload_image/`, imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    console.log('Server response:', response.data);
    
    if (!response.data?.url) {
      const error = new Error('Server response missing URL');
      error.response = response;
      throw error;
    }
    
    return response;
    
  } catch (error) {
    console.error('Upload failed:', {
      error,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// funciona --- funcionaba...
//export const getStepImages = (stepId) => {
//  return api.get(`api/steps/${stepId}/images/`);
//};
export const getStepImages = (stepId) => {
  return api.get(`api/steps/${stepId}/images/`);
};



//This function is working
export const deleteStepImage = async (stepId, imageFileName) => {
  try {
    const response = await api.delete(`api/steps/${stepId}/delete_image/`, {
      data: { file_name: imageFileName }
    });
    return response;
  } catch (error) {
    throw error;
  }
};
// <-----------

// New - Manual
export const uploadMachineManual = async (machineId, formData) => {
  const token = localStorage.getItem('token');
  
  console.log('Starting manual upload...'); // Debug log
  
  try {
    const response = await api.post(`api/machines/${machineId}/manual/upload/`, formData, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });
    
    console.log('Upload successful:', response); // Debug log
    return response;
  } catch (error) {
    console.error('Upload error in API:', error); // Debug log
    if (error.response?.status === 401) {
      // Log the token state
      console.log('Token present:', !!token);
      throw new Error('Authentication failed');
    }
    throw error;
  }
};

//export const getMachineManual = (machineId) => {
//  return api.get(`api/machines/${machineId}/manual/`);
//};

export const getMachineManual = async (machineId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await api.get(`api/machines/${machineId}/manual/`, {
      headers: {
        'Authorization': `Token ${token}`
      },
      responseType: 'blob' // Importante: solicita el archivo como blob
    });
    
    // Crear URL del blob
    const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    return { data: { url: pdfUrl } };
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Authentication failed');
    }
    throw error;
  }
};

export const deleteMachineManual = (machineId) => {
  return api.delete(`api/machines/${machineId}/manual/delete/`);
};
//<---------------

export const fetchManufacturers = () => {
  return api.get('api/manufacturers/');
};

export const fetchCategories = () => {
  return api.get('api/categories/');
};

export const matchIssues = (machineId, description) => {
  return api.post('api/match-issues/', { machine_id: machineId, description });
};

// functions for managing issues, refactored to fix problems
export const fetchIssuesForMachine = async (machineId) => {
  try {
    const response = await api.get(`api/machines/${machineId}/issues/`);
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
};


export const submitTroubleshootingRequest = async (machineId, description) => {
  try {
    const response = await api.post('api/match-issues/', { machine_id: machineId, description });
    return response.data;  // This should directly return the data with matching_issues
  } catch (error) {
    throw error;
  }
};

// Present in component: IssuePage(Used)
export const fetchIssueDetails = async (issueId) => {
  try {
    const response = await api.get(`api/issues/${issueId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// This was fixed for ManageIssue
export const createIssue = (machineId, issueData) => {
  return api.post(`api/machines/${machineId}/issues/`, issueData);
};


export const updateIssue = async (issueId, issueData) => {
  try {
    const response = await api.put(`/api/issues/${issueId}/`, issueData);
    return response.data;
  } catch (error) {
    if (error.response) {
    }
    throw error;
  }
};

export const deleteIssue = (machineId, issueId) => {
  return axios.delete(`${API_URL}/machines/${machineId}/issues/${issueId}/`);
};

//
// New function 10/2/2024
export const fetchIssueSolutions = async (issueId) => {
  try {
    const response = await api.get(`/api/issues/${issueId}/solutions/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return []; // Return an empty array if there's an error
  }
};

// Works in the IssuePage to edit the title of the TroubleshootGuide with solutionID
export const updateSolution = async (solutionId, solutionData) => {
  try {
    console.log('Sending data to update solution:', JSON.stringify(solutionData, null, 2));
    const response = await api.put(`/api/solutions/${solutionId}/`, solutionData);
    console.log('Received response from update solution:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error updating solution:', error);
    throw error;
  }
};

// Check this - Need testing - endpoint
export const createGuide = async (solutionId, guideData) => {
  try {
    const response = await api.post(`/api/solutions/${solutionId}/guide/`, guideData);
    return response.data;
  } catch (error) {
    console.error('Error creating guide:', error);
    throw error;
  }
};

export const updateGuide = async (guideId, guideData) => {
  try {
    const response = await api.put(`/api/guides/${guideId}/`, guideData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Estamos verificando esto
export const createSolution = async (issueId, solutionData) => {
  console.log(`Attempting to create solution for issue ${issueId}`, solutionData);
  return api.post(`/api/issues/${issueId}/solutions/`, solutionData)
    .then(response => {
      console.log('Solution created successfully', response.data);
      return response;
    })
    .catch(error => {
      console.error('Error creating solution:', error.response || error);
      throw error;
    });
};

// New functions for Step Guide
export const fetchSolutionGuide = async (solutionId) => {
  try {
    const response = await api.get(`/api/solutions/${solutionId}/guide/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createSolutionGuide = async (solutionId, guideData) => {
  try {
    const response = await api.post(`/api/solutions/${solutionId}/guide/`, guideData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSolutionGuide = async (guideId, guideData) => {
  try {
    const response = await api.put(`/api/guides/${guideId}/`, guideData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// New for deleting Posible solutions in SolutionEditor.js
export const deleteSolution = async (solutionId) => {
  try {
    const response = await api.delete(`/api/solutions/${solutionId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting solution:', error);
    throw error;
  }
};


//  Training/Workspace section**

// Fetch all training workspaces
export const fetchWorkspaces = () => {
  return api.get('/api/training/workspaces/');
};

// Create a new workspace
export const createWorkspace = (workspaceData) => {
  return api.post('/api/training/workspaces/', workspaceData);
};

// Upload a document to a workspace
export const uploadWorkspaceDocument = (workspaceId, formData) => {
  return api.post(`/api/training/workspaces/${workspaceId}/upload_document/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Delete a workspace
export const deleteWorkspace = (workspaceId) => {
  return api.delete(`/api/training/workspaces/${workspaceId}/`);
};

// Update a workspace
export const updateWorkspace = (workspaceId, workspaceData) => {
  return api.put(`/api/training/workspaces/${workspaceId}/`, workspaceData);
};

// Delete a document
export const deleteWorkspaceDocument = async (workspaceId, documentId) => {
  try {
    const response = await api.delete(`/api/training/workspaces/${workspaceId}/documents/${documentId}/`);
    return response;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Get a single workspace
export const getWorkspace = (workspaceId) => {
  return api.get(`/api/training/workspaces/${workspaceId}/`);
};

export default api;

// New - CustomizationWizard
export const saveFullMachineConfiguration = async (machineId, configData) => {
  return api.post(`/api/machines/${machineId}/full-configuration`, configData);
};
