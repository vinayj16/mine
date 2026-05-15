import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface NotificationPreferences {
  emailNotifications: boolean;
  newsAndUpdates: boolean;
  tipsAndTutorials: boolean;
  offersAndPromotions: boolean;
  moreActivity: boolean;
  allReminders: boolean;
  activityOnly: boolean;
  importantRemindersOnly: boolean;
}

const NotificationsSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: false,
    newsAndUpdates: false,
    tipsAndTutorials: false,
    offersAndPromotions: false,
    moreActivity: false,
    allReminders: false,
    activityOnly: false,
    importantRemindersOnly: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get('/settings/notification-preferences');
        
        if (response.data?.success) {
          const prefs = response.data.data?.preferences || {};
          setPreferences({
            emailNotifications: prefs.emailNotifications ?? false,
            newsAndUpdates: prefs.newsAndUpdates ?? false,
            tipsAndTutorials: prefs.tipsAndTutorials ?? false,
            offersAndPromotions: prefs.offersAndPromotions ?? false,
            moreActivity: prefs.moreActivity ?? false,
            allReminders: prefs.allReminders ?? false,
            activityOnly: prefs.activityOnly ?? false,
            importantRemindersOnly: prefs.importantRemindersOnly ?? false
          });
        }
      } catch {
        // Use demo data - already set as initial state
      }
    } catch (err: any) {
      console.error('Error fetching notification preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    try {
      setSaving(true);
      const response = await apiClient.put('/settings/notification-preferences', {
        preferences: updatedPreferences
      });
      
      if (response.data.success) {
        toast.success('Notification preferences updated');
      } else {
        toast.error(response.data.message || 'Failed to update preferences');
        setPreferences(preferences);
      }
    } catch (err: any) {
      console.error('Error updating notification preferences:', err);
      toast.error(err.response?.data?.message || 'Failed to update preferences');
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content bg-white">
      <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">General Settings</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">General Settings</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon" 
              data-bs-toggle="tooltip"
              data-bs-placement="top" 
              title="Refresh"
              onClick={fetchNotificationPreferences}
              disabled={loading || saving}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-xxl-2 col-xl-3">
          <div className="pt-3 d-flex flex-column list-group mb-4">
            <a href="/profile-settings" className="d-block rounded p-2">Profile Settings</a>
            <a href="/security-settings" className="d-block rounded p-2">Security Settings</a>
            <a href="/notifications-settings" className="d-block rounded active p-2">Notifications</a>
            <a href="/connected-apps" className="d-block rounded p-2">Connected Apps</a>
          </div>
        </div>
        <div className="col-xxl-10 col-xl-9">
          <div className="flex-fill border-start ps-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom mb-3 pt-3">
              <div className="mb-3">
                <h5>Notifications</h5>
                <p>Manage your notification preferences</p>
              </div>
              {saving && (
                <div className="mb-3">
                  <span className="badge bg-primary">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-danger mb-3">
                <i className="ti ti-alert-circle me-2" />
                {error}
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={fetchNotificationPreferences}
                >
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading notification preferences...</p>
              </div>
            ) : (
              <div className="d-block">
                <div className="card border-0 p-3 pb-0 mb-3 rounded">
                  <div className="d-flex justify-content-between align-items-center flex-wrap border-bottom mb-3">
                    <div className="mb-3">
                      <h6>Email Notifications</h6>
                      <p>Get emails to find out what's going on when you're not online</p>
                    </div>
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          role="switch" 
                          id="emailNotifications"
                          checked={preferences.emailNotifications}
                          onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap border-bottom mb-3">
                    <div className="mb-3">
                      <h6>News & Updates</h6>
                      <p>News about product and feature updates</p>
                    </div>
                    <div className="mb-3">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          id="newsAndUpdates"
                          checked={preferences.newsAndUpdates}
                          onChange={(e) => updatePreference('newsAndUpdates', e.target.checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap border-bottom mb-3">
                    <div className="mb-3">
                      <h6>Tips & Tutorials</h6>
                      <p>Tips & Tricks in order to improve your performance efficiency</p>
                    </div>
                    <div className="mb-3">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          id="tipsAndTutorials"
                          checked={preferences.tipsAndTutorials}
                          onChange={(e) => updatePreference('tipsAndTutorials', e.target.checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap mb-0">
                    <div className="mb-3">
                      <h6>Offers & Promotions</h6>
                      <p>Promotion about package prices and its latest discounts</p>
                    </div>
                    <div className="mb-3">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          id="offersAndPromotions"
                          checked={preferences.offersAndPromotions}
                          onChange={(e) => updatePreference('offersAndPromotions', e.target.checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card border-0 p-3 pb-0 mb-3 rounded">
                  <div className="d-flex justify-content-between align-items-center flex-wrap border-bottom mb-3">
                    <div className="mb-3">
                      <h6>More Activity</h6>
                      <p>System can send you email notifications for any new direct messages</p>
                    </div>
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          role="switch" 
                          id="moreActivity"
                          checked={preferences.moreActivity}
                          onChange={(e) => updatePreference('moreActivity', e.target.checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap border-bottom mb-3">
                    <div className="mb-3">
                      <h6>All Reminders & Activity</h6>
                      <p>Notify all system activities and reminders that have been created</p>
                    </div>
                    <div className="mb-3">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          id="allReminders"
                          checked={preferences.allReminders}
                          onChange={(e) => updatePreference('allReminders', e.target.checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap border-bottom mb-3">
                    <div className="mb-3">
                      <h6>Activity Only</h6>
                      <p>Only notify latest activity updates about increasing or decreasing data</p>
                    </div>
                    <div className="mb-3">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          id="activityOnly"
                          checked={preferences.activityOnly}
                          onChange={(e) => updatePreference('activityOnly', e.target.checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap mb-0">
                    <div className="mb-3">
                      <h6>Important Reminders Only</h6>
                      <p>Only notify all the reminders that have been made</p>
                    </div>
                    <div className="mb-3">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          id="importantRemindersOnly"
                          checked={preferences.importantRemindersOnly}
                          onChange={(e) => updatePreference('importantRemindersOnly', e.target.checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;
