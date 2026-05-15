import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import noteService, { type Note } from "../../services/noteService";
import crossAppCommunicationService from '../../services/crossApplicationCommunicationService';
import applicationPersistenceService from '../../services/applicationPersistenceService';
import type { User } from "../../utils/permissions";

const NoteDropdown: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="btn btn-link text-decoration-none p-1"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        type="button"
      >
        <i className="fas fa-ellipsis-v"></i>
      </button>
      {open && (
        <div className="dropdown-menu notes-menu dropdown-menu-end show" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
};

const NotesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [newNote, setNewNote] = useState<Partial<Note>>({
    title: "",
    description: "",
    priority: "medium",
    tag: "personal",
    important: false,
  });

  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    // Get user from localStorage or auth context
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
            
      // Load note messages from communication service
      const noteMessages = crossAppCommunicationService.getMessages(parsedUser.id, 'note');
      const enhancedNotes = noteMessages.map(msg => ({
        _id: msg.id,
        userId: parsedUser.id,
        title: msg.subject || 'Shared Note',
        description: msg.content?.text || '',
        status: 'active' as 'active' | 'trash',
        important: msg.priority === 'high',
        tag: msg.content?.tag || 'personal',
        color: msg.metadata?.color || '#fef3c7',
        priority: (msg.priority === 'urgent' ? 'high' : msg.priority) || 'medium',
        userName: parsedUser.name,
        createdAt: msg.timestamp,
        updatedAt: msg.timestamp
      }));
      
      setNotes(enhancedNotes);
    }
    
    fetchNotes();
    
    // Update application last accessed
    if (userData) {
      const parsedUser = JSON.parse(userData);
      applicationPersistenceService.updateLastAccessed(parsedUser, 'notes');
    }
    
    // Listen for new note messages
    const handleMessage = (message: any) => {
      if (message.type === 'note' && 
          (message.to === userId || 
           (Array.isArray(message.to) && message.to.includes(userId)))) {
        const newNote = {
          _id: message.id,
          userId: userId,
          title: message.subject || 'Shared Note',
          description: message.content?.text || '',
          status: 'active' as 'active' | 'trash',
          important: message.priority === 'high',
          tag: message.content?.tag || 'personal',
          priority: (message.priority === 'urgent' ? 'high' : message.priority) || 'medium',
          userName: user?.name || 'Agent',
          color: message.metadata?.color || '#fef3c7',
          createdAt: message.timestamp,
          updatedAt: message.timestamp
        };
        setNotes(prev => [newNote, ...prev]);
      }
    };

    crossAppCommunicationService.addEventListener('message', handleMessage);

    return () => {
      crossAppCommunicationService.removeEventListener('message', handleMessage);
    };
  }, [activeTab]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params: any = { userId };
      
      if (activeTab === 'important') {
        params.important = true;
        params.status = 'active';
      } else if (activeTab === 'trash') {
        params.status = 'trash';
      } else {
        params.status = 'active';
      }

      const response = await noteService.getAllNotes(params);
      setNotes(response.data || []);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "all":
        return notes.filter((n) => n.status !== "trash").length;
      case "important":
        return notes.filter((n) => n.important && n.status !== "trash").length;
      case "trash":
        return notes.filter((n) => n.status === "trash").length;
      default:
        return 0;
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "personal": return "text-info";
      case "work": return "text-success";
      case "social": return "text-warning";
      default: return "text-info";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-outline-success";
      case "medium": return "bg-outline-warning";
      case "low": return "bg-outline-danger";
      default: return "bg-outline-secondary";
    }
  };

  const handleToggleImportant = async (id: string) => {
    try {
      await noteService.toggleImportant(id);
      setNotes(prev => prev.map(n => n._id === id ? { ...n, important: !n.important } : n));
      toast.success('Note importance updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update note');
    }
  };

  const handleMoveToTrash = async (id: string) => {
    try {
      await noteService.moveToTrash(id);
      toast.success('Note moved to trash');
      fetchNotes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to move note');
    }
  };

  const handleRestoreNote = async (id: string) => {
    try {
      await noteService.restoreNote(id);
      toast.success('Note restored');
      fetchNotes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore note');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this note?')) return;
    try {
      await noteService.permanentDelete(id);
      toast.success('Note permanently deleted');
      fetchNotes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete note');
    }
  };

  const handleRestoreAll = async () => {
    try {
      setLoading(true);
      await noteService.restoreAllNotes(userId);
      toast.success('All notes restored');
      fetchNotes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      await noteService.createNote({
        title: newNote.title || "New Note",
        description: newNote.description || "",
        priority: newNote.priority || "medium",
        tag: newNote.tag || "personal",
        important: newNote.important || false,
        userId,
        userName: currentUser.name || 'User',
        userAvatar: currentUser.avatar,
        status: 'active'
      });

      toast.success('Note created successfully');
      setNewNote({ title: "", description: "", priority: "medium", tag: "personal", important: false });
      setShowAddModal(false);
      fetchNotes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = async () => {
    if (!selectedNote) return;
    try {
      setLoading(true);
      await noteService.updateNote(selectedNote._id, {
        title: selectedNote.title,
        description: selectedNote.description,
        priority: selectedNote.priority,
        tag: selectedNote.tag,
        important: selectedNote.important
      });
      toast.success('Note updated successfully');
      setShowEditModal(false);
      setSelectedNote(null);
      fetchNotes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const NoteCard: React.FC<{ note: Note; isTrash?: boolean }> = ({ note, isTrash = false }) => (
    <div className="col-md-4 d-flex">
      <div className="card rounded-3 mb-4 flex-fill">
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between">
            <span className={`badge ${getPriorityColor(note.priority)} d-inline-flex align-items-center`}>
              <i className="fas fa-circle fs-6 me-1"></i>
              {note.priority ? note.priority.charAt(0).toUpperCase() + note.priority.slice(1) : 'Normal'}
            </span>
            <NoteDropdown>
              {isTrash ? (
                <>
                  <button className="dropdown-item" onClick={() => handleRestoreNote(note._id)}>
                    <i className="fas fa-undo me-2"></i>Restore
                  </button>
                  <button className="dropdown-item text-danger" onClick={() => handlePermanentDelete(note._id)}>
                    <i className="fas fa-trash me-2"></i>Delete Permanently
                  </button>
                </>
              ) : (
                <>
                  <button className="dropdown-item" onClick={() => { setSelectedNote(note); setShowViewModal(true); }}>
                    <i className="fas fa-eye me-2"></i>View
                  </button>
                  <button className="dropdown-item" onClick={() => { setSelectedNote({ ...note }); setShowEditModal(true); }}>
                    <i className="fas fa-edit me-2"></i>Edit
                  </button>
                  <button className="dropdown-item" onClick={() => handleToggleImportant(note._id)}>
                    <i className="fas fa-star me-2"></i>
                    {note.important ? "Remove Important" : "Mark Important"}
                  </button>
                  <button className="dropdown-item text-danger" onClick={() => { setSelectedNote(note); setShowDeleteModal(true); }}>
                    <i className="fas fa-trash me-2"></i>Delete
                  </button>
                </>
              )}
            </NoteDropdown>
          </div>
          <div className="my-3">
            <h5 className="text-truncate mb-1">
              <button className="btn btn-link text-decoration-none p-0" onClick={() => !isTrash && (setSelectedNote(note), setShowViewModal(true))} style={isTrash ? { color: "#6c757d" } : {}}>
                {note.title}
              </button>
            </h5>
            <p className="mb-3 d-flex align-items-center text-dark">
              <i className="ti ti-calendar me-1"></i>
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
            <p className="text-truncate line-clamb-2 text-wrap" style={isTrash ? { color: "#6c757d" } : {}}>
              {note.description}
            </p>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <div className="d-flex align-items-center">
              <span className="avatar avatar-md me-2">
                <img src={note.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(note.userName)}&background=random`} alt={note.userName} className="img-fluid rounded-circle" />
              </span>
              <span className={`${getTagColor(note.tag)} d-flex align-items-center`}>
                <i className="fas fa-square square-rotate fs-10 me-1"></i>
                {note.tag ? note.tag.charAt(0).toUpperCase() + note.tag.slice(1) : 'General'}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              {isTrash ? (
                <>
                  <button className="btn btn-sm btn-link p-0 text-success" title="Restore" onClick={() => handleRestoreNote(note._id)}>
                    <i className="fas fa-undo"></i>
                  </button>
                  <button className="btn btn-sm btn-link p-0 text-danger" title="Delete permanently" onClick={() => handlePermanentDelete(note._id)}>
                    <i className="ti ti-trash"></i>
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-sm btn-link p-0" title={note.important ? "Remove from important" : "Mark as important"} onClick={() => handleToggleImportant(note._id)}>
                    <i className={`fas fa-star ${note.important ? "text-warning" : "text-muted"}`}></i>
                  </button>
                  <button className="btn btn-sm btn-link p-0 text-danger" title="Delete" onClick={() => { setSelectedNote(note); setShowDeleteModal(true); }}>
                    <i className="ti ti-trash"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const filteredNotes = Array.isArray(notes) ? notes : [];
  const importantNotes = filteredNotes.filter(n => n.important && n.status !== "trash");

  return (
    <div className="pb-4">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3 pb-3 border-bottom">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Notes</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="#">Dashboard</a></li>
              <li className="breadcrumb-item">Application</li>
              <li className="breadcrumb-item active">Notes</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-1 mb-2" onClick={fetchNotes} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary d-flex align-items-center mb-2" onClick={() => setShowAddModal(true)}>
            <i className="ti ti-square-rounded-plus me-2"></i>Add Notes
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-3 col-md-12">
          <div className="border rounded-3 mt-4 bg-white p-3">
            <div className="mb-3 pb-3 border-bottom">
              <h4 className="d-flex align-items-center">
                <i className="ti ti-file-text me-2"></i>Notes
              </h4>
            </div>
            <div className="border-bottom pb-3">
              <div className="nav flex-column nav-pills">
                {(["all", "important", "trash"] as const).map((tab) => (
                  <button key={tab} className={`d-flex text-start align-items-center fw-medium fs-15 nav-link mb-1 ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                    <i className={`ti ${tab === "all" ? "ti-inbox" : tab === "important" ? "ti-star" : "ti-trash"} me-2`}></i>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab !== "trash" && <span className="ms-auto badge bg-light text-dark">{getTabCount(tab)}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-9">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="tab-content">
              <div className={`tab-pane fade ${activeTab === "all" ? "active show" : ""}`}>
                {importantNotes.length > 0 && activeTab === "all" && (
                  <div className="border-bottom mb-4 pb-4">
                    <h4 className="mb-3">Important Notes</h4>
                    <div className="row">
                      {importantNotes.slice(0, 6).map((note) => <NoteCard key={note._id} note={note} />)}
                    </div>
                  </div>
                )}
                <div className="row">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => <NoteCard key={note._id} note={note} />)
                  ) : (
                    <div className="col-12 text-center py-5">
                      <i className="fas fa-sticky-note fa-3x text-muted mb-3"></i>
                      <h4 className="text-muted">No notes yet</h4>
                      <p className="text-muted">Click "Add Notes" to create your first note</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={`tab-pane fade ${activeTab === "important" ? "active show" : ""}`}>
                <div className="row">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => <NoteCard key={note._id} note={note} />)
                  ) : (
                    <div className="col-12 text-center py-5">
                      <i className="fas fa-star fa-3x text-warning mb-3"></i>
                      <h4 className="text-muted">No important notes</h4>
                    </div>
                  )}
                </div>
              </div>

              <div className={`tab-pane fade ${activeTab === "trash" ? "active show" : ""}`}>
                {filteredNotes.length > 0 && (
                  <div className="row mb-2">
                    <div className="col-12 d-flex justify-content-end">
                      <button className="btn btn-success mb-4" onClick={handleRestoreAll}>
                        <i className="fas fa-undo me-2"></i>Restore All
                      </button>
                    </div>
                  </div>
                )}
                <div className="row">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => <NoteCard key={note._id} note={note} isTrash />)
                  ) : (
                    <div className="col-12 text-center py-5">
                      <i className="fas fa-trash fa-3x text-danger mb-3"></i>
                      <h4 className="text-muted">Trash is empty</h4>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Note</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-control" placeholder="Enter note title" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} placeholder="Enter note description" value={newNote.description} onChange={(e) => setNewNote({ ...newNote, description: e.target.value })} />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={newNote.priority} onChange={(e) => setNewNote({ ...newNote, priority: e.target.value as Note["priority"] })}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Tag</label>
                    <select className="form-select" value={newNote.tag} onChange={(e) => setNewNote({ ...newNote, tag: e.target.value as Note["tag"] })}>
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="social">Social</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="importantCheck" checked={newNote.important} onChange={(e) => setNewNote({ ...newNote, important: e.target.checked })} />
                    <label className="form-check-label" htmlFor="importantCheck">Mark as Important</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleAddNote} disabled={loading || !newNote.title?.trim()}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Adding...</> : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedNote && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Note</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-control" value={selectedNote.title} onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={selectedNote.description} onChange={(e) => setSelectedNote({ ...selectedNote, description: e.target.value })} />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={selectedNote.priority} onChange={(e) => setSelectedNote({ ...selectedNote, priority: e.target.value as Note["priority"] })}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Tag</label>
                    <select className="form-select" value={selectedNote.tag} onChange={(e) => setSelectedNote({ ...selectedNote, tag: e.target.value as Note["tag"] })}>
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="social">Social</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="editImportantCheck" checked={selectedNote.important} onChange={(e) => setSelectedNote({ ...selectedNote, important: e.target.checked })} />
                    <label className="form-check-label" htmlFor="editImportantCheck">Mark as Important</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleEditNote} disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedNote && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={(e) => e.target === e.currentTarget && setShowViewModal(false)}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">View Note</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <h4 className="mb-2">{selectedNote.title}</h4>
                <p className="text-muted mb-3">{selectedNote.description}</p>
                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                  <span className={`badge ${getPriorityColor(selectedNote.priority)} d-inline-flex align-items-center`}>
                    <i className="fas fa-circle fs-6 me-1"></i>
                    {selectedNote.priority ? selectedNote.priority.charAt(0).toUpperCase() + selectedNote.priority.slice(1) : 'Normal'}
                  </span>
                  <span className={`${getTagColor(selectedNote.tag)} d-inline-flex align-items-center`}>
                    <i className="fas fa-square square-rotate fs-10 me-1"></i>
                    {selectedNote.tag ? selectedNote.tag.charAt(0).toUpperCase() + selectedNote.tag.slice(1) : 'General'}
                  </span>
                  {selectedNote.important && (
                    <span className="text-warning d-inline-flex align-items-center">
                      <i className="fas fa-star me-1"></i>Important
                    </span>
                  )}
                </div>
                <small className="text-muted d-flex align-items-center mb-3">
                  <i className="ti ti-calendar me-1"></i>
                  {new Date(selectedNote.createdAt).toLocaleDateString()}
                </small>
                <div className="d-flex align-items-center">
                  <img src={selectedNote.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedNote.userName)}&background=random`} alt={selectedNote.userName} className="rounded-circle me-2" style={{ width: 36, height: 36 }} />
                  <span>{selectedNote.userName}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={() => { setShowViewModal(false); setSelectedNote({ ...selectedNote }); setShowEditModal(true); }}>
                  <i className="fas fa-edit me-1"></i>Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedNote && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body text-center px-4 pb-2">
                <div className="mb-3">
                  <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10" style={{ width: 56, height: 56 }}>
                    <i className="fas fa-trash text-danger fs-4"></i>
                  </span>
                </div>
                <h5 className="mb-1">Delete Note?</h5>
                <p className="text-muted small mb-0">"{selectedNote.title}" will be moved to trash.</p>
              </div>
              <div className="modal-footer border-0 justify-content-center gap-2 pt-0">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={() => { handleMoveToTrash(selectedNote._id); setShowDeleteModal(false); }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;


