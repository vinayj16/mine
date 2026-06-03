import React, { useEffect, useState } from 'react';
import { useResultsStore } from '../../../store/resultsStore';
import AddResultForm from '../../../components/Results/AddResultForm';
import ConfirmModal from '../../../components/common/ConfirmModal';

const ResultsListPage: React.FC = () => {
  const { list, loading, fetchResults, removeResult } = useResultsStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleDelete = (id: string | undefined) => {
    if (id) {
      setDeleteTarget(id);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      removeResult(deleteTarget);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Results</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">Dashboard</li>
              <li className="breadcrumb-item active">Results</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <i className="ti ti-plus me-2"></i>Add New Result
          </button>
        </div>
      </div>

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleDeleteConfirm} message="Delete this result?" />

      {showAdd && <AddResultForm onClose={() => setShowAdd(false)} />}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="d-flex justify-content-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="thead-light">
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length > 0 ? (
                    list.map((r, idx) => (
                      <tr key={r.id}>
                        <td>{idx + 1}</td>
                        <td>{r.studentName}</td>
                        <td>{r.subject}</td>
                        <td>{r.score}</td>
                        <td>
                          <span className={`badge ${['A','A+','B+','B'].includes(r.grade) ? 'badge-soft-success' : 'badge-soft-warning'}`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}>
                            <i className="ti ti-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-muted">
                        No results found. Click 'Add New Result' to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ResultsListPage;
