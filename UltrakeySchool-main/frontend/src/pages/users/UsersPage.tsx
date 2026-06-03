import { Link } from 'react-router-dom';
// import DataTable from '../../components/common/DataTable';

const UsersPage = () => {
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

        {/* DataTable component needs to be implemented - currently using hook only */}
        <div className="alert alert-info">
          DataTable component needs to be implemented. The current DataTable exports a hook (useDataTable) not a component.
        </div>
      </div>
    </div>
  );
};

export default UsersPage;