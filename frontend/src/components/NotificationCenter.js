import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    message: '',
    time: '',
    type: 'learning_path',
    recurring: false
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    initializeNotifications();
    requestNotificationPermission();
    loadMockNotifications();
    setupReminderChecks();
    
    return () => {
      // Cleanup any active timers
    };
  }, []);

  const initializeNotifications = () => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
    }
  };

  const loadMockNotifications = () => {
    const mockNotifications = [
      {
        id: 1,
        title: 'New Learning Path Available',
        message: 'JavaScript Fundamentals - Day 3 videos are ready',
        type: 'learning_path',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        icon: '🎯'
      },
      {
        id: 2,
        title: 'Teacher Message',
        message: 'Please check your learning path assignments for today.',
        type: 'message',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        icon: '💬'
      },
      {
        id: 3,
        title: 'Study Reminder',
        message: 'Time to watch your scheduled videos for today!',
        type: 'reminder',
        read: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        icon: '⏰'
      },
      {
        id: 4,
        title: 'Progress Update',
        message: 'You completed 3 out of 4 videos today. Great job!',
        type: 'progress',
        read: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        icon: '📊'
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const setupReminderChecks = () => {
    // Check for reminders every minute
    const interval = setInterval(() => {
      checkScheduledReminders();
    }, 60000);

    return () => clearInterval(interval);
  };

  const checkScheduledReminders = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    reminders.forEach(reminder => {
      if (reminder.time === currentTime && reminder.active) {
        triggerReminder(reminder);
      }
    });
  };

  const triggerReminder = (reminder) => {
    // Show browser notification
    if (hasPermission) {
      new Notification(reminder.title, {
        body: reminder.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    // Add to notifications list
    const notificationData = {
      id: Date.now(),
      title: reminder.title,
      message: reminder.message,
      type: 'reminder',
      read: false,
      timestamp: new Date(),
      icon: '⏰'
    };

    setNotifications(prev => [notificationData, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show in-app notification
    showInAppNotification(reminder);
  };

  const showInAppNotification = (reminder) => {
    // Create a temporary notification overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: linear-gradient(135deg, var(--purple-primary), var(--blue-accent));
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 9999;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    overlay.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.5rem;">⏰ ${reminder.title}</div>
      <div style="font-size: 0.875rem; opacity: 0.9;">${reminder.message}</div>
    `;

    document.body.appendChild(overlay);

    // Remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        overlay.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => document.body.removeChild(overlay), 300);
      }
    }, 5000);
  };

  const createReminder = () => {
    if (!newReminder.title || !newReminder.time) return;

    const reminder = {
      id: Date.now(),
      ...newReminder,
      active: true,
      createdAt: new Date()
    };

    setReminders(prev => [...prev, reminder]);
    setNewReminder({
      title: '',
      message: '',
      time: '',
      type: 'learning_path',
      recurring: false
    });
    setShowReminderModal(false);

    // Show success notification
    const successNotification = {
      id: Date.now(),
      title: 'Reminder Created',
      message: `Reminder "${reminder.title}" scheduled for ${reminder.time}`,
      type: 'system',
      read: false,
      timestamp: new Date(),
      icon: '✅'
    };

    setNotifications(prev => [successNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const newNotifications = prev.filter(n => n.id !== notificationId);
      
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return newNotifications;
    });
  };

  const deleteReminder = (reminderId) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const toggleReminder = (reminderId) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === reminderId 
          ? { ...reminder, active: !reminder.active }
          : reminder
      )
    );
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const reminderTemplates = [
    { title: 'Daily Learning', message: 'Time to watch your scheduled learning videos!', time: '09:00' },
    { title: 'Study Break', message: 'Take a 15-minute break from studying', time: '15:00' },
    { title: 'Evening Review', message: 'Review what you learned today', time: '18:00' },
    { title: 'Assignment Deadline', message: 'Don\'t forget to submit your assignments', time: '20:00' }
  ];

  return (
    <>
      {/* Notification Bell Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: '6rem',
            right: '2rem',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--orange-accent), var(--red-accent))',
            border: 'none',
            color: 'white',
            fontSize: '1.25rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999,
            transition: 'var(--transition)',
            position: 'relative'
          }}
          title="Notifications & Reminders"
        >
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'var(--red-accent)',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Notification Center Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            width: '400px',
            height: '600px',
            background: 'var(--surface)',
            backdropFilter: 'var(--backdrop-blur)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-heavy)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, var(--orange-accent), var(--red-accent))',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  🔔 Notifications
                </h3>
                <p style={{ fontSize: '0.875rem', opacity: '0.9' }}>
                  {unreadCount} unread notifications
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            padding: '1rem', 
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => setShowReminderModal(true)}
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              ⏰ New Reminder
            </button>
            <button
              onClick={markAllAsRead}
              className="btn btn-secondary btn-sm"
              disabled={unreadCount === 0}
            >
              Mark All Read
            </button>
          </div>

          {/* Notifications List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem'
          }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔔</div>
                <p>No notifications yet</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Notifications will appear here
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    style={{
                      padding: '1rem',
                      background: notification.read 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: notification.read 
                        ? '1px solid var(--border-color)' 
                        : '1px solid var(--blue-accent)',
                      borderRadius: 'var(--radius-lg)',
                      transition: 'var(--transition)',
                      cursor: 'pointer'
                    }}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ fontSize: '1.25rem' }}>{notification.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontWeight: notification.read ? '500' : '600',
                          color: 'var(--text-primary)',
                          marginBottom: '0.25rem',
                          fontSize: '0.9rem'
                        }}>
                          {notification.title}
                        </h4>
                        <p style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.8rem',
                          lineHeight: '1.4',
                          marginBottom: '0.5rem'
                        }}>
                          {notification.message}
                        </p>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)'
                          }}>
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Reminders */}
          {reminders.length > 0 && (
            <div style={{
              borderTop: '1px solid var(--border-color)',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h4 style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                marginBottom: '0.75rem',
                color: 'var(--text-primary)'
              }}>
                ⏰ Active Reminders ({reminders.filter(r => r.active).length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto' }}>
                {reminders.map(reminder => (
                  <div
                    key={reminder.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: reminder.active ? 'rgba(0, 184, 148, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                        {reminder.title} - {reminder.time}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: reminder.active ? 'var(--green-accent)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {reminder.active ? '🔔' : '🔕'}
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reminder Creation Modal */}
      {showReminderModal && (
        <div className="modal-overlay" onClick={() => setShowReminderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">⏰ Create Reminder</h4>
              <button 
                className="modal-close"
                onClick={() => setShowReminderModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form">
                <div className="form-group">
                  <label className="form-label">Reminder Title</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Study Time"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    value={newReminder.message}
                    onChange={(e) => setNewReminder({...newReminder, message: e.target.value})}
                    className="form-textarea"
                    placeholder="e.g., Time to watch your scheduled learning videos!"
                    rows="3"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      value={newReminder.type}
                      onChange={(e) => setNewReminder({...newReminder, type: e.target.value})}
                      className="form-select"
                    >
                      <option value="learning_path">Learning Path</option>
                      <option value="assignment">Assignment</option>
                      <option value="break">Study Break</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                    Quick Templates:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {reminderTemplates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => setNewReminder({
                          ...newReminder,
                          title: template.title,
                          message: template.message,
                          time: template.time
                        })}
                        className="btn btn-secondary btn-sm"
                        type="button"
                      >
                        {template.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowReminderModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={createReminder}
                className="btn btn-primary"
                disabled={!newReminder.title || !newReminder.time}
              >
                ⏰ Create Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for notification sounds */}
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbIeNhGyHjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNiY2JfYeNhGyHjYeNhY2JjYmNgKqF"
      />

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default NotificationCenter;