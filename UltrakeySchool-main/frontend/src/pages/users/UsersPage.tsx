import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import { API_ENDPOINTS } from '../../config/api';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  class?: string;
  section?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

const UsersPage = () => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setDeleting(userId);
      const response = await fetch(`${API_ENDPOINTS.SUPER_ADMIN.USERS}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        window.location.reload(); // Simple refresh for now
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.SUPER_ADMIN.USERS, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: selectedUsers.map(user => user._id)
        })
      });

      if (response.ok) {
        toast.success(`${selectedUsers.length} users deleted successfully`);
        setSelectedUsers([]);
        window.location.reload();
      } else {
        throw new Error('Failed to delete users');
      }
    } catch (err: any) {
      console.error('Error deleting users:', err);
      toast.error('Failed to delete users');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user: User) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-sm me-2">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="rounded-circle" />
            ) : (
              <div className="avatar-title rounded-circle bg-primary text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="fw-medium">{user.name}</div>
            <div className="text-muted small">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user: User) => (
        <span className={`badge bg-${user.role === 'admin' ? 'danger' : user.role === 'teacher' ? 'success' : 'primary'}`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      )
    },
    {
      key: 'class',
      header: 'Class',
      render: (user: User) => user.class || '-'
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user: User) => (
        <span className={`badge bg-${user.status === 'Active' ? 'success' : 'secondary'}`}>
          {user.status}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created At',
      sortable: true,
      render: (user: User) => new Date(user.createdAt).toLocaleDateString()
    }
  ];

  const renderActions = (user: User) => (
    <div className="dropdown">
      <button
        className="btn btn-sm btn-outline-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
      >
        <i className="ti ti-dots-vertical"></i>
      </button>
      <ul className="dropdown-menu">
        <li>
          <Link className="dropdown-item" to={`/users/${user._id}/edit`}>
            <i className="ti ti-edit me-2"></i>
            Edit
          </Link>
        </li>
        <li>
          <button 
            className="dropdown-item text-danger" 
            onClick={() => handleDelete(user._id)}
            disabled={deleting === user._id}
          >
            <i className="ti ti-trash me-2"></i>
            {deleting === user._id ? 'Deleting...' : 'Delete'}
          </button>
        </li>
      </ul>
    </div>
  );

  const renderBulkActions = (selected: User[]) => (
    <button 
      className="btn btn-sm btn-danger"
      onClick={handleBulkDelete}
    >
      <i className="ti ti-trash me-1"></i>
      Delete Selected ({selected.length})
    </button>
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="page-title">Users Management</h4>
            <p className="text-muted">Manage system users and their permissions</p>
          </div>
          <Link to="/users/create" className="btn btn-primary">
            <i className="ti ti-plus me-2"></i>
            Add User
          </Link>
        </div>

        <DataTable<User>
          endpoint={API_ENDPOINTS.SUPER_ADMIN.USERS}
          columns={columns}
          selectable={true}
          onSelectionChange={setSelectedUsers}
          actions={renderActions}
          bulkActions={renderBulkActions}
          searchable={true}
          sortable={true}
          exportable={true}
          refreshable={true}
          emptyMessage="No users found"
          className="users-table"
        />
      </div>
    </div>
  );
};

export default UsersPage;