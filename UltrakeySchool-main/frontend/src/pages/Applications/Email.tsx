import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import emailService, { type Email } from "../../services/emailService";
import crossAppCommunicationService from '../../services/crossApplicationCommunicationService';
import applicationPersistenceService from '../../services/applicationPersistenceService';

// User interface - adjust based on your auth system
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId?: string;
}

const EmailPage: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash' | 'important'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [, setUser] = useState<User | null>(null);
  const [, setVisibleUsers] = useState<any[]>([]);

  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    content: ''
  });

  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    // Get user from localStorage or auth context
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Load cross-app communication data
      const visible = crossAppCommunicationService.getVisibleUsers(parsedUser);
      setVisibleUsers(visible);
      
      // Load email messages from communication service
      const emailMessages = crossAppCommunicationService.getMessages(parsedUser.id, 'email');
      const enhancedEmails = emailMessages.map(msg => ({
        _id: msg.id,
        userId: parsedUser.id,
        folder: 'inbox' as 'inbox' | 'sent' | 'drafts' | 'trash' | 'important',
        sender: {
          name: msg.from,
          email: msg.from,
          userId: msg.from
        },
        recipients: Array.isArray(msg.to) ? msg.to.map((email: string) => ({
          name: email,
          email: email,
          type: 'to' as 'to' | 'cc' | 'bcc'
        })) : [{
          name: msg.to,
          email: msg.to,
          type: 'to' as 'to' | 'cc' | 'bcc'
        }],
        subject: msg.subject || 'No Subject',
        content: msg.content?.text || '',
        isStarred: false,
        isImportant: msg.priority === 'high',
        isRead: msg.read,
        hasAttachment: msg.content?.hasAttachment || false,
        createdAt: msg.timestamp,
        tags: [],
        labels: [],
        priority: ((msg.priority === 'medium' ? 'normal' : msg.priority) || 'low') as 'low' | 'normal' | 'high' | 'urgent',
        size: msg.content?.text?.length || 0,
        isEncrypted: false,
        isSigned: false,
        status: "delivered" as 'sent' | 'sending' | 'delivered' | 'failed' | 'draft',
        category: "primary" as 'primary' | 'social' | 'promotions' | 'updates' | 'forums',
        updatedAt: msg.timestamp
      }));
      
      setEmails([ ...enhancedEmails]);
    }
    
    // Only fetch if userId exists
    if (userId) {
      fetchEmails();
    } else {
      setLoading(false);
      setEmails([]);
    }
    
    // Update application last accessed
    if (userData) {
      const parsedUser = JSON.parse(userData);
      applicationPersistenceService.updateLastAccessed(parsedUser, 'email');
    }
    
    // Listen for new email messages
    const handleMessage = (message: any) => {
      if (message.type === 'email' && 
          (message.to === userId || 
           (Array.isArray(message.to) && message.to.includes(userId)))) {
        const newEmail = {
          _id: message.id,
          userId: userId,
          folder: 'inbox' as 'inbox' | 'sent' | 'drafts' | 'trash' | 'important',
          sender: {
            name: message.from,
            email: message.from,
            userId: message.from
          },
          recipients: Array.isArray(message.to) ? message.to.map((email: string) => ({
            name: email,
            email: email,
            type: 'to'
          })) : [{
            name: message.to,
            email: message.to,
            type: 'to'
          }],
          subject: message.subject || 'No Subject',
          content: message.content?.text || '',
          isStarred: false,
          isImportant: message.priority === 'high',
          isRead: false, // Communication messages start as unread
          hasAttachment: message.content?.hasAttachment || false,
          createdAt: message.timestamp,
          tags: [],
          labels: [],
          priority: ((message.priority === 'medium' ? 'normal' : message.priority) || 'low') as 'low' | 'normal' | 'high' | 'urgent',
          size: message.content?.text?.length || 0,
          isEncrypted: false,
          isSigned: false,
          status: "delivered" as 'sent' | 'sending' | 'delivered' | 'failed' | 'draft',
          category: "primary" as 'primary' | 'social' | 'promotions' | 'updates' | 'forums',
          updatedAt: message.timestamp
        };
        setEmails(prev => [newEmail, ...prev]);
      }
    };

    crossAppCommunicationService.addEventListener('message', handleMessage);

    return () => {
      crossAppCommunicationService.removeEventListener('message', handleMessage);
    };
  }, [currentFolder, userId]);

  const fetchEmails = async () => {
    // Don't fetch if no userId
    if (!userId) {
      setEmails([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params: any = { userId };
      
      if (currentFolder === 'important') {
        params.folder = 'inbox';
      } else {
        params.folder = currentFolder;
      }

      try {
        const response = await emailService.getAllEmails(params);
        let fetchedEmails = response.data || [];

        if (currentFolder === 'important') {
          fetchedEmails = fetchedEmails.filter((e: Email) => e.isStarred || e.isImportant);
        }

        setEmails(fetchedEmails);
      } catch {
        setEmails([]);
      }
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const folders = [
    { id: 'inbox' as const, name: 'Inbox', icon: 'download', count: emails.filter(e => e.folder === 'inbox').length },
    { id: 'important' as const, name: 'Important', icon: 'star', count: emails.filter(e => e.isStarred || e.isImportant).length },
    { id: 'sent' as const, name: 'Sent Mail', icon: 'send', count: emails.filter(e => e.folder === 'sent').length },
    { id: 'drafts' as const, name: 'Drafts', icon: 'file-database', count: emails.filter(e => e.folder === 'drafts').length },
    { id: 'trash' as const, name: 'Trash', icon: 'trash', count: emails.filter(e => e.folder === 'trash').length }
  ];

  const filteredEmails = emails.filter(email => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (email.sender?.name?.toLowerCase().includes(query) || false) ||
        (email.sender?.email?.toLowerCase().includes(query) || false) ||
        email.subject.toLowerCase().includes(query) ||
        email.content.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const currentFolderName = folders.find(f => f.id === currentFolder)?.name || 'Inbox';

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(e => e._id));
    }
    setSelectAll(!selectAll);
  };

  const handleStarEmail = async (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await emailService.toggleStar(emailId);
      setEmails(prev => prev.map(email => 
        email._id === emailId ? { ...email, isStarred: !email.isStarred } : email
      ));
      toast.success('Email starred status updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update star status');
    }
  };

  const handleMarkAsRead = async (emailIds: string[], isRead: boolean) => {
    try {
      await emailService.markAsRead(emailIds, isRead);
      setEmails(prev => prev.map(email => 
        emailIds.includes(email._id) ? { ...email, isRead } : email
      ));
      setSelectedEmails([]);
      setSelectAll(false);
      toast.success(`Marked as ${isRead ? 'read' : 'unread'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update read status');
    }
  };

  const handleDelete = async (emailIds: string[]) => {
    try {
      if (currentFolder === 'trash') {
        await emailService.permanentDelete(emailIds);
        toast.success('Emails permanently deleted');
      } else {
        await emailService.moveToFolder(emailIds, 'trash');
        toast.success('Emails moved to trash');
      }
      fetchEmails();
      setSelectedEmails([]);
      setSelectAll(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete emails');
    }
  };

  const handleArchive = async (emailIds: string[]) => {
    try {
      await emailService.moveToFolder(emailIds, 'archive');
      fetchEmails();
      setSelectedEmails([]);
      setSelectAll(false);
      toast.success('Emails archived');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to archive emails');
    }
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const recipients: Array<{ email: string; type: 'to' | 'cc' | 'bcc' }> = [];
      if (composeData.to) {
        composeData.to.split(',').forEach(email => {
          recipients.push({ email: email.trim(), type: 'to' as const });
        });
      }
      if (composeData.cc) {
        composeData.cc.split(',').forEach(email => {
          recipients.push({ email: email.trim(), type: 'cc' as const });
        });
      }
      if (composeData.bcc) {
        composeData.bcc.split(',').forEach(email => {
          recipients.push({ email: email.trim(), type: 'bcc' as const });
        });
      }

      await emailService.sendEmail({
        sender: {
          userId: userId,
          name: currentUser.name || 'Me',
          email: currentUser.email || 'me@example.com'
        },
        recipients,
        subject: composeData.subject,
        content: composeData.content,
        userId,
        folder: 'sent',
        status: 'sent'
      });

      toast.success('Email sent successfully');
      setShowCompose(false);
      setComposeData({ to: '', cc: '', bcc: '', subject: '', content: '' });
      if (currentFolder === 'sent') {
        fetchEmails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const recipients: Array<{ email: string; type: 'to' | 'cc' | 'bcc' }> = [];
      if (composeData.to) {
        composeData.to.split(',').forEach(email => {
          recipients.push({ email: email.trim(), type: 'to' as const });
        });
      }

      await emailService.saveDraft({
        sender: {
          userId: userId,
          name: currentUser.name || 'Me',
          email: currentUser.email || 'me@example.com'
        },
        recipients,
        subject: composeData.subject,
        content: composeData.content,
        userId,
        folder: 'drafts',
        status: 'draft'
      });

      toast.success('Draft saved successfully');
      setShowCompose(false);
      setComposeData({ to: '', cc: '', bcc: '', subject: '', content: '' });
      if (currentFolder === 'drafts') {
        fetchEmails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        await emailService.markAsRead([email._id], true);
        setEmails(prev => prev.map(e => 
          e._id === email._id ? { ...e, isRead: true } : e
        ));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all emails in trash?')) {
      return;
    }
    try {
      setLoading(true);
      await emailService.emptyTrash(userId);
      toast.success('Trash emptied successfully');
      fetchEmails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to empty trash');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="content">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="mb-1">{currentFolderName}</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="#">Dashboard</a>
              </li>
              <li className="breadcrumb-item">Application</li>
              <li className="breadcrumb-item active" aria-current="page">
                {currentFolderName}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-3 col-md-12">
          <div className="mb-4">
            <button 
              className="btn btn-primary w-100" 
              onClick={() => setShowCompose(true)}
            >
              <i className="ti ti-edit me-2" />
              Compose
            </button>
          </div>

          <div className="list-group list-group-flush mb-4">
            {folders.map(folder => (
              <button 
                key={folder.id}
                className={`list-group-item list-group-item-action ${currentFolder === folder.id ? 'active' : ''}`}
                onClick={() => setCurrentFolder(folder.id)}
              >
                <i className={`ti ti-${folder.icon} me-2`} /> {folder.name} ({folder.count})
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-9 col-md-12">
          <div className="card">
            <div className="card-body">
              <div className="email-header">
                <div className="row">
                  <div className="col-xl-9 col-sm-12">
                    <div className="float-start">
                      <div className="btn-group me-1 mb-2">
                        <button
                          type="button"
                          className="btn btn-outline-light dropdown-toggle"
                          data-bs-toggle="dropdown"
                        >
                          Select
                        </button>
                        <div className="dropdown-menu">
                          <button className="dropdown-item" onClick={handleSelectAll}>
                            {selectAll ? 'None' : 'All'}
                          </button>
                          <div className="dropdown-divider" />
                          <button className="dropdown-item" onClick={() => {
                            const readIds = filteredEmails.filter(e => e.isRead).map(e => e._id);
                            setSelectedEmails(readIds);
                          }}>Read</button>
                          <button className="dropdown-item" onClick={() => {
                            const unreadIds = filteredEmails.filter(e => !e.isRead).map(e => e._id);
                            setSelectedEmails(unreadIds);
                          }}>Unread</button>
                        </div>
                      </div>

                      <div className="btn-group me-1 mb-2">
                        <button
                          type="button"
                          className="btn btn-outline-light dropdown-toggle"
                          data-bs-toggle="dropdown"
                          disabled={selectedEmails.length === 0}
                        >
                          Actions
                        </button>
                        <div className="dropdown-menu">
                          <button className="dropdown-item" onClick={() => handleMarkAsRead(selectedEmails, true)}>
                            Mark As Read
                          </button>
                          <button className="dropdown-item" onClick={() => handleMarkAsRead(selectedEmails, false)}>
                            Mark As Unread
                          </button>
                          <button className="dropdown-item" onClick={() => handleArchive(selectedEmails)}>
                            Archive
                          </button>
                          <div className="dropdown-divider" />
                          <button className="dropdown-item text-danger" onClick={() => handleDelete(selectedEmails)}>
                            Delete
                          </button>
                        </div>
                      </div>

                      {currentFolder === 'trash' && (
                        <button
                          type="button"
                          className="btn btn-outline-danger me-1 mb-2"
                          onClick={handleEmptyTrash}
                        >
                          <i className="ti ti-trash me-2" />
                          Empty Trash
                        </button>
                      )}

                      <div className="btn-group mb-2">
                        <input
                          type="text"
                          placeholder="Search Messages"
                          className="form-control"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-xl-3 col-sm-12">
                    <div className="text-xl-end">
                      <button
                        type="button"
                        className="btn btn-outline-light d-none d-md-inline-block me-1 mb-2"
                        title="Refresh"
                        onClick={fetchEmails}
                      >
                        <i className="fas fa-sync-alt" />
                      </button>
                      <span className="text-muted d-none d-md-inline-block mb-2">
                        Showing {filteredEmails.length} of {emails.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="email-content">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="ti ti-inbox" style={{ fontSize: '48px' }} />
                    <p className="mt-3">No emails found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-inbox table-hover">
                      <thead>
                        <tr>
                          <th colSpan={6}>
                            <div className="form-check form-check-md">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={selectAll}
                                onChange={handleSelectAll}
                              />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmails.map(email => (
                          <tr 
                            key={email._id} 
                            className={`clickable-row ${!email.isRead ? 'fw-bold' : ''} ${selectedEmail?._id === email._id ? 'table-active' : ''}`}
                            onClick={() => handleEmailClick(email)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="form-check form-check-md">
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  checked={selectedEmails.includes(email._id)}
                                  onChange={() => handleSelectEmail(email._id)}
                                />
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <span className="mail-important">
                                <i 
                                  className={`fas fa-star ${email.isStarred ? 'starred text-warning' : ''}`} 
                                  style={{ cursor: 'pointer' }}
                                  onClick={(e) => handleStarEmail(email._id, e)}
                                />
                              </span>
                            </td>
                            <td className={email.isRead ? '' : 'fw-semibold'}>
                              {email.sender?.name || 'Unknown Sender'}
                            </td>
                            <td className={email.isRead ? '' : 'fw-semibold'}>
                              {email.subject}
                              {email.preview && (
                                <span className="text-muted ms-2">- {email.preview}</span>
                              )}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              {email.hasAttachment && <i className="fas fa-paperclip" />}
                            </td>
                            <td className={email.isRead ? '' : 'fw-semibold'}>
                              {formatDate(email.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCompose && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCompose(false); }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ti ti-edit me-2" />Compose Email
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCompose(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">To</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="recipient@example.com (comma separated)"
                    value={composeData.to}
                    onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">CC (Optional)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="cc@example.com (comma separated)"
                    value={composeData.cc}
                    onChange={(e) => setComposeData(prev => ({ ...prev, cc: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">BCC (Optional)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="bcc@example.com (comma separated)"
                    value={composeData.bcc}
                    onChange={(e) => setComposeData(prev => ({ ...prev, bcc: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Email subject"
                    value={composeData.subject}
                    onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea 
                    className="form-control" 
                    rows={8}
                    placeholder="Type your message here..."
                    value={composeData.content}
                    onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-light" 
                  onClick={handleSaveDraft}
                  disabled={loading || !composeData.subject}
                >
                  <i className="ti ti-device-floppy me-2" />
                  Save Draft
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompose(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSendEmail}
                  disabled={loading || !composeData.to || !composeData.subject || !composeData.content}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send me-2" />Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEmail && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedEmail(null); }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedEmail.subject}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEmail(null)} />
              </div>
              <div className="modal-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <strong>From:</strong> {selectedEmail.sender?.name || 'Unknown Sender'} ({selectedEmail.sender?.email || 'Unknown Email'})<br />
                    <strong>To:</strong> {selectedEmail.recipients.filter(r => r.type === 'to').map(r => r.email).join(', ')}<br />
                    {selectedEmail.recipients.some(r => r.type === 'cc') && (
                      <><strong>CC:</strong> {selectedEmail.recipients.filter(r => r.type === 'cc').map(r => r.email).join(', ')}<br /></>
                    )}
                    <strong>Date:</strong> {new Date(selectedEmail.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <button 
                      className="btn btn-sm btn-outline-warning me-2"
                      onClick={(e) => handleStarEmail(selectedEmail._id, e)}
                    >
                      <i className={`fas fa-star ${selectedEmail.isStarred ? 'text-warning' : ''}`} />
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => {
                        handleDelete([selectedEmail._id]);
                        setSelectedEmail(null);
                      }}
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>
                <div className="border-top pt-3" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedEmail.content}
                </div>
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="border-top pt-3 mt-3">
                    <strong>Attachments:</strong>
                    <ul className="list-unstyled mt-2">
                      {selectedEmail.attachments.map((att, idx) => (
                        <li key={idx}>
                          <i className="fas fa-paperclip me-2" />
                          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                            {att.fileName} ({(att.fileSize / 1024).toFixed(2)} KB)
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailPage;
