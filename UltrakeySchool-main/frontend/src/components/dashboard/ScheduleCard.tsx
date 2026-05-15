import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../../api/client';
import '../common/LoadingSpinner.css';
import { toast } from 'react-toastify';

type ScheduleParticipant = {
  _id: string;
  user: {
    _id: string;
    name: string;
    photo?: string;
  };
  role: string;
};

type Schedule = {
  _id: string;
  title: string;
  description?: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  participants: ScheduleParticipant[];
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
};

type ScheduleItemProps = {
  schedule: Schedule;
};

const ScheduleItem = ({ schedule }: ScheduleItemProps) => {
  const getBorderColor = () => {
    switch (schedule.priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'primary';
    }
  };

  const getAvatarColor = () => {
    switch (schedule.priority) {
      case 'high':
        return 'bg-danger-transparent';
      case 'medium':
        return 'bg-warning-transparent';
      case 'low':
        return 'bg-info-transparent';
      default:
        return 'bg-primary-transparent';
    }
  };

  const getIconClass = () => {
    switch (schedule.type) {
      case 'meeting':
        return 'ti ti-users fs-20';
      case 'event':
        return 'ti ti-calendar-event fs-20';
      case 'exam':
        return 'ti ti-file-text fs-20';
      case 'holiday':
        return 'ti ti-beach fs-20';
      default:
        return 'ti ti-calendar fs-20';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    const formatTimeString = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };

    return `${formatTimeString(start)} - ${formatTimeString(end)}`;
  };

  return (
    <div className={`border-start border-${getBorderColor()} border-3 shadow-sm p-3 mb-3`}>
      <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
        <span className={`avatar p-1 me-2 ${getAvatarColor()} flex-shrink-0`}>
          <i className={getIconClass()} />
        </span>
        <div className="flex-fill">
          <h6 className="mb-1">{schedule.title}</h6>
          <p className="d-flex align-items-center mb-0">
            <i className="ti ti-calendar me-1" />
            {formatDate(schedule.date)}
          </p>
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between">
        <p className="mb-0">
          <i className="ti ti-clock me-1" />
          {formatTime(schedule.startTime, schedule.endTime)}
        </p>
        {schedule.location && (
          <p className="mb-0">
            <i className="ti ti-map-pin me-1" />
            {schedule.location}
          </p>
        )}
        {schedule.participants && schedule.participants.length > 0 && (
          <div className="avatar-list-stacked avatar-group-sm">
            {schedule.participants.slice(0, 3).map((participant) => (
              <span className="avatar border-0" key={participant._id}>
                {participant.user.photo ? (
                  <img 
                    src={participant.user.photo} 
                    className="rounded-circle" 
                    alt={participant.user.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/img/avatar/avatar-default.jpg';
                    }}
                  />
                ) : (
                  <span className="avatar-title rounded-circle bg-primary">
                    {participant.user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
            ))}
            {schedule.participants.length > 3 && (
              <span className="avatar border-0">
                <span className="avatar-title rounded-circle bg-secondary">
                  +{schedule.participants.length - 3}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ScheduleCard = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!isRealTimeEnabled) return;

    try {
      setConnectionStatus('connecting');
      
      // Get WebSocket URL from environment or fallback to localhost
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
      const ws = new WebSocket(`${wsUrl}/schedules`);
      
      ws.onopen = () => {
        console.log('WebSocket connected for real-time schedule updates');
        setConnectionStatus('connected');
        toast.success('Real-time updates enabled');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'SCHEDULE_CREATED':
              setSchedules(prev => [data.schedule, ...prev.slice(0, 9)]);
              toast.info(`New schedule added: ${data.schedule.title}`);
              break;
              
            case 'SCHEDULE_UPDATED':
              setSchedules(prev => 
                prev.map(schedule => 
                  schedule._id === data.schedule._id ? data.schedule : schedule
                )
              );
              toast.info(`Schedule updated: ${data.schedule.title}`);
              break;
              
            case 'SCHEDULE_DELETED':
              setSchedules(prev => 
                prev.filter(schedule => schedule._id !== data.scheduleId)
              );
              toast.info(`Schedule removed`);
              break;
              
            case 'SCHEDULE_STATUS_CHANGED':
              setSchedules(prev => 
                prev.map(schedule => 
                  schedule._id === data.scheduleId 
                    ? { ...schedule, status: data.status }
                    : schedule
                )
              );
              break;
              
            case 'INITIAL_SCHEDULES':
              setSchedules(data.schedules);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect after 5 seconds
        if (isRealTimeEnabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        toast.error('Real-time connection failed');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('disconnected');
      toast.error('Failed to enable real-time updates');
    }
  }, [isRealTimeEnabled]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  }, []);

  // Toggle real-time updates
  const toggleRealTime = () => {
    if (isRealTimeEnabled) {
      disconnectWebSocket();
      setIsRealTimeEnabled(false);
      toast.info('Real-time updates disabled');
    } else {
      setIsRealTimeEnabled(true);
      connectWebSocket();
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    fetchUpcomingSchedules();
  }, []);

  const fetchUpcomingSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/schedules/upcoming', {
        params: { limit: 10 }
      });

      if (response.data.success && response.data.data) {
        setSchedules(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching upcoming schedules:', err);
      setError(err.response?.data?.message || 'Failed to fetch upcoming schedules');
    } finally {
      setLoading(false);
    }
  };

  // Handle schedule creation
  const handleScheduleCreate = async (schedule: Schedule) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/schedules', schedule);

      if (response.data.success) {
        setSchedules(prev => [schedule, ...prev.slice(0, 9)]);
        toast.success('Schedule created successfully');
      }
    } catch (err: any) {
      console.error('Error creating schedule:', err);
      setError(err.response?.data?.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  // Handle schedule update
  const handleAddSchedule = () => {
    // Navigate to add schedule page or open modal
    window.location.href = '/schedules/add';
  };

  return (
    <div className="card flex-fill">
      <div className="card-header d-flex align-items-center justify-content-between">
        <div>
          <h4 className="card-title mb-0">Schedules</h4>
          {/* Real-time status indicator */}
          <div className="d-flex align-items-center mt-1">
            <span className={`badge bg-${connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'secondary'} me-2`}>
              <i className={`ti ti-${connectionStatus === 'connected' ? 'wifi' : connectionStatus === 'connecting' ? 'loader' : 'wifi-off'} me-1`}></i>
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
            <button 
              type="button" 
              className={`btn btn-sm ${isRealTimeEnabled ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={toggleRealTime}
              title={isRealTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
            >
              <i className={`ti ti-${isRealTimeEnabled ? 'pulse' : 'pulse-off'} me-1`}></i>
              {isRealTimeEnabled ? 'Real-time' : 'Manual'}
            </button>
          </div>
        </div>
        <button 
          type="button" 
          className="link-primary fw-medium me-2"
          onClick={handleAddSchedule}
        >
          <i className="ti ti-square-plus me-1" />
          Add New
        </button>
      </div>
      <div className="card-body">
        <div className="datepic mb-4" />
        <h5 className="mb-3">Upcoming Events</h5>
        <div className="event-wrapper event-scroll">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-warning mb-0" role="alert">
              {error}
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-4">
              <i className="ti ti-calendar-off fs-48 text-muted mb-2 d-block" />
              <p className="text-muted mb-0">No upcoming events scheduled</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <ScheduleItem key={schedule._id} schedule={schedule} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;