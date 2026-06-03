import React, { useState } from 'react';
import { useResultsStore } from '../../store/resultsStore';

type Props = { onClose: () => void };

const AddResultForm: React.FC<Props> = ({ onClose }) => {
  const addResult = useResultsStore(state => state.addResult);
  const [form, setForm] = useState({ studentName: '', subject: '', score: '', grade: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addResult({
      studentName: form.studentName,
      subject: form.subject,
      score: form.score,
      grade: form.grade
    });
    onClose();
  };

  return (
    <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content shadow-lg" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title">Add New Result</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Student Name</label>
              <input className="form-control" name="studentName" value={form.studentName} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Subject</label>
              <input className="form-control" name="subject" value={form.subject} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Score</label>
              <input type="number" className="form-control" name="score" value={form.score} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Grade</label>
              <input className="form-control" name="grade" value={form.grade} onChange={handleChange} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Result</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResultForm;
