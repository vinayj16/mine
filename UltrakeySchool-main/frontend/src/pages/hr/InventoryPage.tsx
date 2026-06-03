import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import type { InventoryItem } from '../../services/inventoryService';
import { toast } from 'react-toastify';

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('stationery');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<string>('pcs');
  const [minStockLevel, setMinStockLevel] = useState<number>(5);
  const [location, setLocation] = useState<string>('');
  
  // Adjust Form State
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  const categories = [
    { value: 'stationery', label: 'Stationery' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'electronics', label: 'Electronics & Computers' },
    { value: 'lab-equipment', label: 'Lab Equipment' },
    { value: 'sports-gear', label: 'Sports Gear' },
    { value: 'hostel-supplies', label: 'Hostel Supplies' },
    { value: 'other', label: 'Other supplies' }
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data: any = await inventoryService.getAll();
      setItems(data.data?.items || data.data || []);
    } catch (error: any) {
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setName('');
    setCategory('stationery');
    setQuantity(0);
    setUnit('pcs');
    setMinStockLevel(5);
    setLocation('');
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setIsEditing(true);
    setCurrentId(item._id || null);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setMinStockLevel(item.minStockLevel);
    setLocation(item.location || '');
    setShowModal(true);
  };

  const openAdjustModal = (item: InventoryItem) => {
    setCurrentId(item._id || null);
    setAdjustAmount(1);
    setAdjustType('in');
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.warn('Please input a valid item name');
      return;
    }
    const payload: InventoryItem = {
      name,
      category,
      quantity,
      unit,
      minStockLevel,
      location
    };

    try {
      if (isEditing && currentId) {
        await inventoryService.update(currentId, payload);
        toast.success('Inventory item updated successfully');
      } else {
        await inventoryService.create(payload);
        toast.success('Inventory item created successfully');
      }
      setShowModal(false);
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentId || adjustAmount <= 0) return;

    try {
      await inventoryService.adjust(currentId, adjustAmount, adjustType, adjustNotes);
      toast.success('Stock adjusted successfully');
      setShowAdjustModal(false);
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Stock adjustment failed');
    }
  };

  return (
    <div className="container-fluid py-4" style={{ minHeight: '85vh' }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>Inventory Management</h2>
          <p className="text-muted mb-0">Track and manage institution assets, equipment, and classroom stock levels.</p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4 py-2"
          style={{ borderRadius: '10px', fontWeight: 500 }}
          onClick={openAddModal}
        >
          <i className="ti ti-plus fs-5"></i> Add Inventory Item
        </button>
      </div>

      {/* Inventory List */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-semibold text-dark">Institutional Assets</h5>
          <span className="badge bg-indigo-soft text-indigo px-3 py-2 rounded-pill fw-medium">
            {items.length} Items Total
          </span>
        </div>
        
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary uppercase fs-7">
              <tr>
                <th className="px-4 py-3">Item Name</th>
                <th className="py-3">Category</th>
                <th className="py-3">Quantity</th>
                <th className="py-3">Unit</th>
                <th className="py-3">Min Stock Level</th>
                <th className="py-3">Location</th>
                <th className="py-3">Stock Status</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted mb-0">Loading inventory...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <i className="ti ti-package-off fs-1 d-block mb-3 opacity-40"></i>
                    No inventory items created yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLowStock = item.quantity <= item.minStockLevel;

                  return (
                    <tr key={item._id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className="avatar avatar-md bg-light-soft text-indigo rounded d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                            <i className="ti ti-archive fs-4"></i>
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold text-dark">{item.name}</h6>
                            <span className="text-muted fs-7">ID: {item._id?.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-capitalize text-dark fw-medium">{item.category}</td>
                      <td className="fw-semibold text-dark">{item.quantity}</td>
                      <td className="text-secondary fs-7">{item.unit}</td>
                      <td className="text-dark">{item.minStockLevel}</td>
                      <td className="text-secondary fw-medium">{item.location || 'Not Specified'}</td>
                      <td>
                        {isLowStock ? (
                          <span className="badge bg-danger-soft text-danger px-3 py-1.5 rounded-pill fs-7">
                            Low Stock
                          </span>
                        ) : (
                          <span className="badge bg-success-soft text-success px-3 py-1.5 rounded-pill fs-7">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                            className="btn btn-icon btn-light-soft border-0 rounded-circle" 
                            title="Adjust Stock"
                            onClick={() => openAdjustModal(item)}
                          >
                            <i className="ti ti-settings text-primary"></i>
                          </button>
                          <button 
                            className="btn btn-icon btn-light-soft border-0 rounded-circle" 
                            title="Edit"
                            onClick={() => openEditModal(item)}
                          >
                            <i className="ti ti-pencil text-secondary"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Modal Dialog */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark">{isEditing ? 'Edit Asset Record' : 'Create Asset Record'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Name */}
                    <div className="col-12">
                      <label className="form-label fw-medium text-secondary">Asset Name</label>
                      <input 
                        type="text" 
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                      />
                    </div>

                    {/* Category */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Category</label>
                      <select 
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {categories.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Unit */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Unit (e.g. pcs, boxes)</label>
                      <input 
                        type="text" 
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={unit} 
                        onChange={(e) => setUnit(e.target.value)} 
                        required 
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Initial Quantity</label>
                      <input 
                        type="number" 
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={quantity} 
                        onChange={(e) => setQuantity(Number(e.target.value))} 
                        disabled={isEditing}
                        required 
                      />
                    </div>

                    {/* Minimum Stock Level */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Min Alert Stock Level</label>
                      <input 
                        type="number" 
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={minStockLevel} 
                        onChange={(e) => setMinStockLevel(Number(e.target.value))} 
                        required 
                      />
                    </div>

                    {/* Location */}
                    <div className="col-12">
                      <label className="form-label fw-medium text-secondary">Storage Location / Rack</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Science Lab Cabinet 3"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light p-3 px-4 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light shadow-sm px-4 py-2 border" style={{ borderRadius: '10px' }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary shadow-sm px-4 py-2" style={{ borderRadius: '10px' }}>{isEditing ? 'Save Changes' : 'Create Item'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal Dialog */}
      {showAdjustModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark">Stock Adjustment</h5>
                <button type="button" className="btn-close" onClick={() => setShowAdjustModal(false)}></button>
              </div>
              <form onSubmit={handleAdjustSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Adjustment Type */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Adjustment Type</label>
                      <select 
                        className="form-select border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={adjustType} 
                        onChange={(e) => setAdjustType(e.target.value as any)}
                      >
                        <option value="in">Restock (+)</option>
                        <option value="out">Disburse / Consume (-)</option>
                      </select>
                    </div>

                    {/* Adjust Amount */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-secondary">Adjustment Quantity</label>
                      <input 
                        type="number" 
                        min="1"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={adjustAmount} 
                        onChange={(e) => setAdjustAmount(Number(e.target.value))} 
                        required 
                      />
                    </div>

                    {/* Notes */}
                    <div className="col-12">
                      <label className="form-label fw-medium text-secondary">Reason / Transaction Notes</label>
                      <textarea 
                        rows={3}
                        placeholder="e.g. Distributed 5 pcs to Grade 4 Teacher"
                        className="form-control border-light-soft bg-light-soft py-2.5 px-3"
                        style={{ borderRadius: '10px' }}
                        value={adjustNotes} 
                        onChange={(e) => setAdjustNotes(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light p-3 px-4 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light shadow-sm px-4 py-2 border" style={{ borderRadius: '10px' }} onClick={() => setShowAdjustModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary shadow-sm px-4 py-2" style={{ borderRadius: '10px' }}>Apply Adjustment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
