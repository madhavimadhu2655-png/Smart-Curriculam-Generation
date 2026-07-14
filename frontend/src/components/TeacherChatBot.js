import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';

const TeacherChatBot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([
    { id: '1', name: 'Alice Johnson', rollNo: 'CS001', email: 'alice@student.com', online: true },
    { id: '2', name: 'Bob Wilson', rollNo: 'CS002', email: 'bob@student.com', online: false },
    { id: '3', name: 'Carol Davis', rollNo: 'CS003', email: 'carol@student.com', online: true },
    { id: '4', name: 'David Brown', rollNo: 'CS004', email: 'david@student.com', online: true },
    { id: '5', name: 'Emma Taylor', rollNo: 'CS005', email: 'emma@student.com', online: false },
    { id: '6', name: 'Mahesh', rollNo: '219', email: 'mahesh@student.com', online: true }
  ]);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const messageTemplates = [
    "Please check your learning path assignments for today.",
    "Don't forget to complete your daily video lessons.",
    "Great progress on your learning journey! Keep it up!",
    "Reminder: Submit your progress reports by end of day.",
    "New learning materials have been added to your path."
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    const recipients = selectedStudents.length > 0 ? selectedStudents : allStudents;
    
    const messageData = {
      id: Date.now(),
      content: newMessage,
      attachments: [...attachments],
      sender: {
        id: user?.id || 'teacher-1',
        name: user?.name || 'Demo Teacher',
        role: 'teacher'
      },
      recipients: recipients.map(student => ({
        id: student.id,
        name: student.name,
        read: false
      })),
      timestamp: new Date(),
      type: 'outgoing'
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setAttachments([]);
    setSelectedStudents([]);
    setShowStudentSelector(false);

    // Simulate message delivery and responses
    simulateDelivery(messageData);
  };

  const simulateDelivery = (messageData) => {
    // Simulate typing indicator
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      // Simulate some students reading the message
      messageData.recipients.forEach((recipient, index) => {
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageData.id 
              ? {
                  ...msg,
                  recipients: msg.recipients.map(r => 
                    r.id === recipient.id ? { ...r, read: true } : r
                  )
                }
              : msg
          ));
          
          // Simulate auto-replies from some students
          if (Math.random() > 0.6) {
            setTimeout(() => {
              addStudentReply(recipient, messageData);
            }, 1000 + Math.random() * 3000);
          }
        }, index * 500);
      });
    }, 2000);
  };

  const addStudentReply = (student, originalMessage) => {
    const replies = [
      "Thank you for the reminder, teacher!",
      "I will complete this today.",
      "Got it! Working on it now.",
      "Thanks for the update!",
      "Will check the learning path right away.",
      "Understood, thank you!"
    ];
    
    const replyMessage = {
      id: Date.now() + Math.random(),
      content: replies[Math.floor(Math.random() * replies.length)],
      attachments: [],
      sender: {
        id: student.id,
        name: student.name,
        role: 'student'
      },
      recipients: [{
        id: user?.id || 'teacher-1',
        name: user?.name || 'Demo Teacher',
        read: false
      }],
      timestamp: new Date(),
      type: 'incoming',
      replyTo: originalMessage.id
    };

    setMessages(prev => [...prev, replyMessage]);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudents(prev => {
      const isSelected = prev.find(s => s.id === student.id);
      if (isSelected) {
        return prev.filter(s => s.id !== student.id);
      } else {
        return [...prev, student];
      }
    });
  };

  const selectAllStudents = () => {
    setSelectedStudents([...allStudents]);
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const useTemplate = (template) => {
    setNewMessage(template);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('document') || type.includes('word')) return '📝';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    return '📎';
  };

  if (user?.role !== 'teacher') {
    return null;
  }

  return (
    <>
      {/* Chat Bot Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '2rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--green-accent), var(--blue-accent))',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999,
            transition: 'var(--transition)'
          }}
          title="Teacher Chat Bot"
        >
          💬
        </button>
      )}

      {/* Chat Bot Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '2rem',
            width: '450px',
            height: '650px',
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
            background: 'linear-gradient(135deg, var(--green-accent), var(--blue-accent))',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  💬 Teacher Chat Bot
                </h3>
                <p style={{ fontSize: '0.875rem', opacity: '0.9' }}>
                  Send messages to students
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

          {/* Student Selection */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <button
                onClick={() => setShowStudentSelector(!showStudentSelector)}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
              >
                👥 Recipients ({selectedStudents.length || 'All'})
              </button>
              <button
                onClick={selectAllStudents}
                className="btn btn-primary btn-sm"
                disabled={selectedStudents.length === allStudents.length}
              >
                All
              </button>
              <button
                onClick={clearSelection}
                className="btn btn-secondary btn-sm"
                disabled={selectedStudents.length === 0}
              >
                Clear
              </button>
            </div>

            {showStudentSelector && (
              <div style={{
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem'
              }}>
                {allStudents.map(student => (
                  <label
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.find(s => s.id === student.id) !== undefined}
                      onChange={() => toggleStudentSelection(student)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {student.rollNo}
                      </div>
                    </div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: student.online ? 'var(--green-accent)' : 'var(--text-muted)'
                    }} />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
                <p>Start messaging your students!</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Send assignments, reminders, or announcements
                </p>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  style={{
                    alignSelf: message.type === 'outgoing' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: message.type === 'outgoing' 
                      ? 'var(--blue-accent)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    color: message.type === 'outgoing' ? 'white' : 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}>
                    {message.type === 'incoming' && (
                      <div style={{ fontWeight: '600', marginBottom: '0.5rem', opacity: '0.8' }}>
                        {message.sender.name}
                      </div>
                    )}
                    
                    <div>{message.content}</div>
                    
                    {/* Attachments */}
                    {message.attachments.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        {message.attachments.map(attachment => (
                          <div
                            key={attachment.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: 'var(--radius-sm)',
                              marginBottom: '0.5rem'
                            }}
                          >
                            <span>{getFileIcon(attachment.type)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '500', truncate: true }}>
                                {attachment.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', opacity: '0.7' }}>
                                {formatFileSize(attachment.size)}
                              </div>
                            </div>
                            <a
                              href={attachment.url}
                              download={attachment.name}
                              style={{
                                color: 'inherit',
                                textDecoration: 'none',
                                padding: '0.25rem'
                              }}
                            >
                              ⬇️
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div style={{
                      fontSize: '0.75rem',
                      opacity: '0.7',
                      marginTop: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.type === 'outgoing' && (
                        <span>
                          Read by {message.recipients.filter(r => r.read).length}/{message.recipients.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem'
                }}>
                  Students are typing...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Templates */}
          <div style={{
            padding: '0.5rem 1rem',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem'
            }}>
              {messageTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => useTemplate(template)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.color = 'var(--text-secondary)';
                  }}
                >
                  {template.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div style={{
              padding: '1rem',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Attachments:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <span>{getFileIcon(attachment.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                        {attachment.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatFileSize(attachment.size)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--red-accent)',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message to students..."
                style={{
                  flex: 1,
                  minHeight: '40px',
                  maxHeight: '100px',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  fontSize: '0.875rem'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary btn-sm"
                  title="Attach Files"
                >
                  📎
                </button>
                <button
                  onClick={sendMessage}
                  className="btn btn-primary btn-sm"
                  disabled={!newMessage.trim() && attachments.length === 0}
                >
                  📤
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherChatBot;