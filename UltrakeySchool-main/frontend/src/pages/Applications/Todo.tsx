import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import todoService from "../../services/todoService";

const TodoDropdown: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="dropdown">
      <button className="btn btn-sm btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
        <i className="ti ti-dots-vertical"></i>
      </button>
      <ul className="dropdown-menu">
        {children}
      </ul>
    </div>
  );
};

interface Todo {
  _id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'pending' | 'inprogress' | 'done' | 'trash';
  completed: boolean;
  important: boolean;
  dueDate?: Date;
  userId: string;
  userName: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userAvatar?: string;
}

const getUserId = (): string => {
  const userData = localStorage.getItem('user');
  if (userData) {
    const parsed = JSON.parse(userData);
    return parsed.id || parsed._id || '';
  }
  return '';
};

const getUserName = (): string => {
  const userData = localStorage.getItem('user');
  if (userData) {
    const parsed = JSON.parse(userData);
    return parsed.name || 'User';
  }
  return 'User';
};

const TodoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("inbox");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState<Partial<Todo>>({
    title: "",
    description: "",
    priority: "medium",
    status: "new",
    important: false,
  });

  const userId = getUserId();
  const userName = getUserName();

  const loadTodosFromStorage = (userId: string): Todo[] => {
    try {
      const stored = localStorage.getItem(`todos_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      return [];
    }
    return [];
  };

  const saveTodosToStorage = (userId: string, todos: Todo[]) => {
    try {
      localStorage.setItem(`todos_${userId}`, JSON.stringify(todos));
    } catch (error) {
      console.error('Error saving todos to localStorage:', error);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(`todos_${userId}`);
    if (stored) {
      try {
        setTodos(JSON.parse(stored));
      } catch {
        setTodos([]);
      }
    }
  }, [userId]);

  const saveTodos = (newTodos: Todo[]) => {
    localStorage.setItem(`todos_${userId}`, JSON.stringify(newTodos));
    setTodos(newTodos);
  };

  const addTodo = () => {
    if (!newTodo.title?.trim()) {
      toast.error('Please enter a title');
      return;
    }
    const todo: Todo = {
      _id: `todo_${Date.now()}`,
      title: newTodo.title || '',
      description: newTodo.description || '',
      priority: (newTodo.priority as 'high' | 'medium' | 'low') || 'medium',
      status: 'new',
      completed: false,
      important: newTodo.important || false,
      userId,
      userName,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [todo, ...todos];
    saveTodos(updated);
    setNewTodo({ title: "", description: "", priority: "medium", status: "new", important: false });
    setShowAddModal(false);
    toast.success('Task added');
  };

  const currentFilteredTodos = todos.filter(t => {
    if (activeTab === 'inbox') return t.status !== 'trash';
    if (activeTab === 'important') return t.important && t.status !== 'trash';
    if (activeTab === 'completed') return t.completed;
    return true;
  });

  const fetchTodos = async () => {
    try {
      setLoading(true);
      
      // First try to load from localStorage
      if (userId) {
        const savedTodos = loadTodosFromStorage(userId);
        if (savedTodos.length > 0) {
          // Filter saved todos based on active tab
          let filteredTodos = savedTodos;
          if (activeTab === 'done') {
            filteredTodos = savedTodos.filter((t) => t.completed);
          } else if (activeTab === 'trash') {
            filteredTodos = savedTodos.filter((t) => t.status === "trash");
          } else if (activeTab === 'important') {
            filteredTodos = savedTodos.filter((t) => t.important && t.status !== "trash");
          } else {
            filteredTodos = savedTodos.filter((t) => t.status !== "trash" && !t.completed);
          }
          setTodos(filteredTodos);
          setLoading(false);
          return;
        }
      }
      
      // If no saved todos or userId not available, fetch from API
      const response = await todoService.getAllTodos({
        status: activeTab === 'done' ? 'completed' : activeTab === 'trash' ? 'trash' : undefined,
        important: activeTab === 'important' ? true : undefined,
        userId: userId
      });

      const fetchedTodos = (response.data?.todos || response.data || []).map((todo: any) => ({
        ...todo,
        status: todo.status as Todo['status']
      }));
      
      // Save fetched todos to localStorage
      if (userId && fetchedTodos.length > 0) {
        saveTodosToStorage(userId, fetchedTodos);
      }
      
      setTodos(fetchedTodos);
    } catch (error: any) {
      console.error('Error fetching todos:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "inbox":
        return todos.filter((t) => t.status !== "trash" && !t.completed).length;
      case "done":
        return todos.filter((t) => t.completed).length;
      case "important":
        return todos.filter((t) => t.important && t.status !== "trash").length;
      case "trash":
        return todos.filter((t) => t.status === "trash").length;
      default:
        return 0;
    }
  };

  const priorityBadgeColor = (priority: string) =>
    priority === "high" ? "danger" : priority === "medium" ? "success" : "warning";

  const statusBadgeColor = (status: string) =>
    status === "new" ? "secondary" : status === "pending" ? "info" : status === "inprogress" ? "warning" : "success";

  const toggleTodoSelection = (id: string) =>
    setSelectedTodos((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleDateExpansion = (date: string) =>
    setExpandedDates((prev) => prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]);

  const handleToggleComplete = async (id: string) => {
    try {
      await todoService.toggleComplete(id);
      
      // Update localStorage
      if (userId) {
        setTodos(prev => {
          const updatedTodos = prev.map(todo => 
            todo._id === id ? { ...todo, completed: !todo.completed } : todo
          );
          saveTodosToStorage(userId, updatedTodos);
          return updatedTodos;
        });
      }
      
      toast.success('Todo status updated');
      fetchTodos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update todo');
    }
  };

  const handleMoveToTrash = async (id: string) => {
    try {
      await todoService.moveToTrash(id);
      
      // Update localStorage
      if (userId) {
        setTodos(prev => {
          const updatedTodos = prev.map(todo => 
            todo._id === id ? { ...todo, status: 'trash' as const } : todo
          );
          saveTodosToStorage(userId, updatedTodos);
          return updatedTodos;
        });
      }
      
      toast.success('Todo moved to trash');
      fetchTodos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to move todo');
    }
  };

  const handleRestoreTodo = async (id: string) => {
    try {
      await todoService.restoreTodo(id);
      
      // Update localStorage
      if (userId) {
        setTodos(prev => {
          const updatedTodos = prev.map(todo => 
            todo._id === id ? { ...todo, status: 'new' as const } : todo
          );
          saveTodosToStorage(userId, updatedTodos);
          return updatedTodos;
        });
      }
      
      toast.success('Todo restored');
      fetchTodos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore todo');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this todo?')) return;
    try {
      await todoService.permanentDelete(id);
      toast.success('Todo permanently deleted');
      fetchTodos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete todo');
    }
  };

  const handleToggleImportant = async (id: string) => {
    try {
      await todoService.toggleImportant(id);
      toast.success('Todo importance updated');
      fetchTodos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update todo');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!action || selectedTodos.length === 0) return;
    try {
      setLoading(true);
      if (action === "delete") {
        await todoService.bulkDelete(selectedTodos);
        toast.success('Todos moved to trash');
      } else if (action === "markDone") {
        await todoService.bulkMarkDone(selectedTodos);
        toast.success('Todos marked as done');
      } else if (action === "markUndone") {
        await todoService.bulkMarkUndone(selectedTodos);
        toast.success('Todos marked as undone');
      }
      setSelectedTodos([]);
      fetchTodos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTodo = async () => {
    if (!selectedTodo) return;
    try {
      setLoading(true);
      await todoService.updateTodo(selectedTodo._id, selectedTodo);
      toast.success('Todo updated successfully');
      setShowEditModal(false);
      setSelectedTodo(null);
      fetchTodos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update todo');
    } finally {
      setLoading(false);
    }
  };

  const TodoRow: React.FC<{ todo: Todo; isTrash?: boolean; isDone?: boolean }> = ({ todo, isTrash = false, isDone = false }) => (
    <div className="card mb-3">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center flex-fill">
            <input className="form-check-input me-3" type="checkbox" checked={selectedTodos.includes(todo._id)} onChange={() => toggleTodoSelection(todo._id)} />
            <div className="flex-fill">
              <h5 className={`mb-1 ${todo.completed ? "text-decoration-line-through text-muted" : ""}`}>{todo.title}</h5>
              <p className="mb-0 text-muted small">{todo.description}</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className={`badge bg-outline-${priorityBadgeColor(todo.priority)}`}>{todo.priority}</span>
            {!isTrash && !isDone && <span className={`badge bg-outline-${statusBadgeColor(todo.status)}`}>{todo.status}</span>}
            {todo.important && !isTrash && <i className="ti ti-star text-warning"></i>}
            <img src={todo.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(todo.userName)}&background=random`} alt={todo.userName} className="rounded-circle" style={{ width: 32, height: 32 }} />
            <TodoDropdown>
              {isTrash ? (
                <>
                  <button className="dropdown-item" onClick={() => handleRestoreTodo(todo._id)}><i className="fas fa-undo me-2"></i>Restore</button>
                  <button className="dropdown-item text-danger" onClick={() => handlePermanentDelete(todo._id)}><i className="fas fa-trash me-2"></i>Delete Permanently</button>
                </>
              ) : isDone ? (
                <>
                  <button className="dropdown-item" onClick={() => handleToggleComplete(todo._id)}><i className="fas fa-undo me-2"></i>Mark Undone</button>
                  <button className="dropdown-item text-danger" onClick={() => { setSelectedTodo(todo); setShowDeleteModal(true); }}><i className="fas fa-trash me-2"></i>Delete</button>
                </>
              ) : (
                <>
                  <button className="dropdown-item" onClick={() => { setSelectedTodo(todo); setShowViewModal(true); }}><i className="fas fa-eye me-2"></i>View</button>
                  <button className="dropdown-item" onClick={() => { setSelectedTodo({ ...todo }); setShowEditModal(true); }}><i className="fas fa-edit me-2"></i>Edit</button>
                  <button className="dropdown-item" onClick={() => handleToggleComplete(todo._id)}><i className="fas fa-check me-2"></i>Mark Done</button>
                  <button className="dropdown-item" onClick={() => handleToggleImportant(todo._id)}><i className="fas fa-star me-2"></i>{todo.important ? "Remove Important" : "Mark Important"}</button>
                  <button className="dropdown-item text-danger" onClick={() => { setSelectedTodo(todo); setShowDeleteModal(true); }}><i className="fas fa-trash me-2"></i>Delete</button>
                </>
              )}
            </TodoDropdown>
          </div>
        </div>
      </div>
    </div>
  );

  const filteredTodos = currentFilteredTodos;
  const groupedTodos = filteredTodos.reduce((acc, todo) => {
    const date = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : new Date(todo.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  useEffect(() => {
    setExpandedDates(Object.keys(groupedTodos));
  }, [todos]);

  return (
    <div className="content pb-4">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3 pb-3 border-bottom">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Todo</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="#">Dashboard</a></li>
              <li className="breadcrumb-item">Application</li>
              <li className="breadcrumb-item active">Todo</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-1 mb-2" onClick={fetchTodos} title="Refresh"><i className="ti ti-refresh"></i></button>
          <button className="btn btn-primary d-flex align-items-center mb-2" onClick={() => setShowAddModal(true)}><i className="ti ti-square-rounded-plus me-2"></i>Add Task</button>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-3 col-md-12">
          <div className="border rounded-3 mt-4 bg-white p-3">
            <div className="mb-3 pb-3 border-bottom">
              <h4 className="d-flex align-items-center"><i className="ti ti-file-text me-2"></i>Todo List</h4>
            </div>
            <div className="nav flex-column nav-pills">
              {[
                { key: "inbox", icon: "ti-inbox", label: "Inbox" },
                { key: "done", icon: "ti-circle-check", label: "Done" },
                { key: "important", icon: "ti-star", label: "Important" },
                { key: "trash", icon: "ti-trash", label: "Trash" },
              ].map(({ key, icon, label }) => (
                <button key={key} className={`d-flex text-start align-items-center fw-medium fs-15 nav-link mb-1 ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>
                  <i className={`ti ${icon} me-2`}></i>{label}
                  <span className="ms-auto badge bg-light text-dark">{getTabCount(key)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xl-9">
          <div className="bg-white rounded-3 d-flex align-items-center justify-content-between my-4 p-3">
            <div className="d-flex align-items-center">
              <select className="form-select me-2" onChange={(e) => { handleBulkAction(e.target.value); e.target.value = ""; }} value="">
                <option value="" disabled>Bulk Actions</option>
                <option value="delete">Delete Marked</option>
                <option value="markDone">Mark All Done</option>
                <option value="markUndone">Unmark All</option>
              </select>
              {selectedTodos.length > 0 && <span className="text-muted small">{selectedTodos.length} selected</span>}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            </div>
          ) : (
            <div className="tab-content">
              {activeTab === "inbox" && (
                <div>
                  {Object.keys(groupedTodos).length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                      <h4 className="text-muted">Inbox is empty</h4>
                    </div>
                  ) : (
                    Object.entries(groupedTodos).map(([date, dateTodos]) => (
                      <div key={date} className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2 p-2 bg-light rounded" style={{ cursor: "pointer" }} onClick={() => toggleDateExpansion(date)}>
                          <div className="d-flex align-items-center">
                            <i className="ti ti-calendar-due me-2"></i>
                            <h5 className="mb-0">{date}</h5>
                            <span className="badge bg-primary ms-2">{dateTodos.length}</span>
                          </div>
                          <i className={`fas fa-chevron-${expandedDates.includes(date) ? "up" : "down"}`}></i>
                        </div>
                        {expandedDates.includes(date) && dateTodos.map((todo) => <TodoRow key={todo._id} todo={todo} />)}
                      </div>
                    ))
                  )}
                </div>
              )}
              {activeTab === "done" && (
                <div>
                  {filteredTodos.length > 0 ? filteredTodos.map((todo) => <TodoRow key={todo._id} todo={todo} isDone />) : (
                    <div className="text-center py-5">
                      <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                      <h4 className="text-muted">No completed tasks</h4>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "important" && (
                <div>
                  {filteredTodos.length > 0 ? filteredTodos.map((todo) => <TodoRow key={todo._id} todo={todo} />) : (
                    <div className="text-center py-5">
                      <i className="fas fa-star fa-3x text-warning mb-3"></i>
                      <h4 className="text-muted">No important tasks</h4>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "trash" && (
                <div>
                  {filteredTodos.length > 0 ? filteredTodos.map((todo) => <TodoRow key={todo._id} todo={todo} isTrash />) : (
                    <div className="text-center py-5">
                      <i className="fas fa-trash fa-3x text-danger mb-3"></i>
                      <h4 className="text-muted">Trash is empty</h4>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Task</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-control" value={newTodo.title} onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={newTodo.description} onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })} />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={newTodo.priority} onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as Todo["priority"] })}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={newTodo.status} onChange={(e) => setNewTodo({ ...newTodo, status: e.target.value as Todo["status"] })}>
                      <option value="new">New</option>
                      <option value="pending">Pending</option>
                      <option value="inprogress">In Progress</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="importantCheck" checked={newTodo.important} onChange={(e) => setNewTodo({ ...newTodo, important: e.target.checked })} />
                    <label className="form-check-label" htmlFor="importantCheck">Mark as Important</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={addTodo} disabled={loading || !newTodo.title?.trim()}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Adding...</> : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedTodo && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Task</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-control" value={selectedTodo.title} onChange={(e) => setSelectedTodo({ ...selectedTodo, title: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={selectedTodo.description} onChange={(e) => setSelectedTodo({ ...selectedTodo, description: e.target.value })} />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={selectedTodo.priority} onChange={(e) => setSelectedTodo({ ...selectedTodo, priority: e.target.value as Todo["priority"] })}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={selectedTodo.status} onChange={(e) => setSelectedTodo({ ...selectedTodo, status: e.target.value as Todo["status"] })}>
                      <option value="new">New</option>
                      <option value="pending">Pending</option>
                      <option value="inprogress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="editImportantCheck" checked={selectedTodo.important} onChange={(e) => setSelectedTodo({ ...selectedTodo, important: e.target.checked })} />
                    <label className="form-check-label" htmlFor="editImportantCheck">Mark as Important</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleEditTodo} disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedTodo && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={(e) => e.target === e.currentTarget && setShowViewModal(false)}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">View Task</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <h4 className="mb-2">{selectedTodo.title}</h4>
                <p className="text-muted mb-3">{selectedTodo.description}</p>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className={`badge bg-outline-${priorityBadgeColor(selectedTodo.priority)}`}>{selectedTodo.priority}</span>
                  <span className={`badge bg-outline-${statusBadgeColor(selectedTodo.status)}`}>{selectedTodo.status}</span>
                  {selectedTodo.important && <span className="text-warning"><i className="fas fa-star me-1"></i>Important</span>}
                </div>
                <div className="d-flex align-items-center">
                  <img src={selectedTodo.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTodo.userName)}&background=random`} alt={selectedTodo.userName} className="rounded-circle me-2" style={{ width: 36, height: 36 }} />
                  <span>{selectedTodo.userName}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={() => { setShowViewModal(false); setSelectedTodo({ ...selectedTodo }); setShowEditModal(true); }}>
                  <i className="fas fa-edit me-1"></i>Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedTodo && (
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
                <h5 className="mb-1">Delete Task?</h5>
                <p className="text-muted small mb-0">"{selectedTodo.title}" will be moved to trash.</p>
              </div>
              <div className="modal-footer border-0 justify-content-center gap-2 pt-0">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={() => { handleMoveToTrash(selectedTodo._id); setShowDeleteModal(false); }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoPage;



