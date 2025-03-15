import React, { useState, useEffect } from 'react';
import { format, addMinutes } from 'date-fns';
import { FaPlus, FaTrash, FaBell, FaCheck, FaPencilAlt } from 'react-icons/fa';
import { fetchNotes, createNote, updateNote, deleteNote } from '@/services/api';

// Component for managing notes and reminders
const NotesAndReminders = () => {
  // State variables to manage notes, loading status, errors, and form visibility
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    is_reminder: false,
    reminder_date: '',
  });

  // Function to fetch the list of notes from the API
  const fetchNotesList = async () => {
    try {
      setIsLoading(true);
      const response = await fetchNotes();
      setNotes(response.data);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotesList();
  }, []);

  // Function to handle adding a new note
  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      const noteData = {
        ...newNote,
        // Convert the reminder date to ISO format if it's set
        reminder_date: newNote.is_reminder 
          ? new Date(newNote.reminder_date).toISOString()
          : null
      };

      const response = await createNote(noteData); // API call to create the note
      setNotes(prevNotes => [response.data, ...prevNotes]); // Add new note to the list
      setShowAddForm(false); // Close the add form
      // Reset the new note form fields
      setNewNote({
        title: '',
        content: '',
        priority: 'MEDIUM',
        is_reminder: false,
        reminder_date: ''
      });
    } catch (err) {
      console.error('Error creating note:', err);
      setError(err.response?.data?.message || 'Failed to create note');
    }
  };

  const handleDateTimeChange = (e) => {
    const selectedDateTime = e.target.value;
    setNewNote(prev => ({
      ...prev,
      reminder_date: selectedDateTime
    }));
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    }
  };


  const handleToggleComplete = async (noteId) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      // Only send the completion status
      const response = await updateNote(noteId, { 
        is_completed: !note.is_completed 
      }, 'PATCH');

      if (response.data) {
        setNotes(prevNotes => 
          prevNotes.map(n => 
            n.id === noteId 
              ? { ...n, is_completed: !n.is_completed }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note');
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
    }
  };



  // CSS classes for different priority levels
  const priorityColors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  };

  // Loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="notes-section">
      <div className="notes-header">
        <h2>Notes & Reminders</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="add-note-button">
          <FaPlus /> Add New
        </button>
      </div>
  
      {error && <div className="error-message">{error}</div>}
  
      {showAddForm && (
        <div className="note-form-overlay" onClick={() => setShowAddForm(false)}>
            <form 
            className="note-form" 
            onSubmit={handleAddNote}
            onClick={(e) => e.stopPropagation()}
            >
            <div className="note-form-header">
                <h3>Add New Note</h3>
                <button 
                type="button" 
                className="close-button"
                onClick={() => setShowAddForm(false)}
                aria-label="Close"
                >
                ×
                </button>
            </div>
            
            <input
                type="text"
                placeholder="Title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="note-input"
                required
            />
            
            <textarea
                placeholder="Content"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="note-textarea"
                required
            />
            
            <div className="form-row">
                <select
                value={newNote.priority}
                onChange={(e) => setNewNote({ ...newNote, priority: e.target.value })}
                className="priority-select"
                >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                </select>
                
                <label className="reminder-label">
                <input
                    type="checkbox"
                    checked={newNote.is_reminder}
                    onChange={(e) => setNewNote({ ...newNote, is_reminder: e.target.checked })}
                />
                Set as Reminder
                </label>
            </div>
            
            {newNote.is_reminder && (
                <div>
                <input
                    type="datetime-local"
                    value={newNote.reminder_date}
                    onChange={(e) => setNewNote({ ...newNote, reminder_date: e.target.value })}
                    className="date-input"
                    min={format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:mm")}
                    required
                />
                <small className="text-gray-500">
                    Please select a time at least 5 minutes in the future
                </small>
                </div>
            )}
            
            <div className="form-actions">
                <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="cancel-button"
                >
                Cancel
                </button>
                <button type="submit" className="save-button">
                Save
                </button>
            </div>
            </form>
        </div>
        )}
  
      <div className="notes-list">
        {notes.length === 0 ? (
          <p className="no-notes">No notes or reminders</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="note-item"
            >
              <div className={`note-content ${note.is_completed ? 'completed' : ''}`}>
                <div className="note-header">
                  <h3>
                    {note.title}
                    {note.is_completed && (
                      <span className="completed-badge">
                        <FaCheck size={10} />
                        Completed
                      </span>
                    )}
                  </h3>
                  <span className={`priority-badge ${note.priority.toLowerCase()}`}>
                    {note.priority}
                  </span>
                  {note.is_reminder && <FaBell className="reminder-icon" />}
                </div>
                <p>
                  {note.content}
                </p>
                {note.reminder_date && (
                  <p className="reminder-date">
                    Reminder: {format(new Date(note.reminder_date), 'PPp')}
                  </p>
                )}
              </div>
              <div className="note-actions">
                <button
                  onClick={() => handleToggleComplete(note.id)}
                  className={`action-button complete ${note.is_completed ? 'active' : ''}`}
                  title={note.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  <FaCheck />
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="action-button delete"
                  title="Delete note"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export default NotesAndReminders;
