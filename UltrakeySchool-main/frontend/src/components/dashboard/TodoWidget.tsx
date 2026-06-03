import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface TodoItem {
  _id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  completed: boolean;
  important: boolean;
  dueDate?: string;
}

const TodoWidget = ({ limit = 5 }: { limit?: number }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) { setLoading(false); return; }
        const user = JSON.parse(userStr);
        const userId = user.id || user._id;
        if (!userId) { setLoading(false); return; }
        const res = await apiClient.get('/todos', {
          params: { userId, limit: 30 }
        });
        const data = res.data?.data?.todos || res.data?.data || [];
        setTodos((Array.isArray(data) ? data : []).filter((t: any) => !t.completed && t.status !== 'trash').slice(0, limit));
      } catch { /* */ } finally { setLoading(false); }
    };
    fetchTodos();
  }, [limit]);

  const priorityColor = (p: string) => {
    if (p === 'high') return 'danger';
    if (p === 'medium') return 'warning';
    return 'info';
  };

  return (
    <div className="card flex-fill">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h4 className="card-title">To-Do List</h4>
        <Link to="/dashboard/applications/todo" className="btn btn-sm btn-outline-light">
          View All
        </Link>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-3"><div className="spinner-border spinner-border-sm" /></div>
        ) : todos.length === 0 ? (
          <p className="text-muted text-center py-3">No pending tasks</p>
        ) : (
          <ul className="list-group list-group-flush">
            {todos.map(todo => (
              <li key={todo._id} className="list-group-item px-0 d-flex align-items-center">
                <span className={`badge bg-${priorityColor(todo.priority)} me-2`} style={{ width: 8, height: 8, padding: 0, borderRadius: '50%' }} />
                <span className={todo.completed ? 'text-decoration-line-through text-muted' : ''}>
                  {todo.title}
                </span>
                {todo.important && <i className="ti ti-star-filled text-warning ms-2 fs-12" />}
                {todo.dueDate && (
                  <small className="text-muted ms-auto">
                    {new Date(todo.dueDate).toLocaleDateString()}
                  </small>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TodoWidget;
