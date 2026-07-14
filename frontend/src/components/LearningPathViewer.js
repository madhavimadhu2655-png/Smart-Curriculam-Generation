import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService, useAuth } from '../App';

const LearningPathViewer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState(1);

  // Mock learning paths data when API call fails
  const mockLearningPaths = {
    '1': {
      id: '1',
      title: 'JavaScript Fundamentals',
      topic: 'JavaScript Programming',
      creator_name: 'Demo Teacher',
      duration_days: 7,
      difficulty_level: 'beginner',
      status: 'active',
      created_at: new Date().toISOString(),
      total_estimated_hours: 21,
      daily_schedule: [
        {
          day_number: 1,
          topic: 'Variables and Data Types',
          videos: [
            {
              id: 'js-var-1',
              title: 'JavaScript Variables Explained',
              url: 'https://www.youtube.com/watch?v=9WIJQDvt4Us',
              channel: 'Programming with Mosh',
              duration: 'PT15M30S',
              description: 'Learn about JavaScript variables, let, const, and var keywords',
              thumbnail: 'https://img.youtube.com/vi/9WIJQDvt4Us/maxresdefault.jpg',
              quality_score: 9.5
            },
            {
              id: 'js-var-2',
              title: 'Data Types in JavaScript',
              url: 'https://www.youtube.com/watch?v=Hrd3SfCCXZw',
              channel: 'Traversy Media',
              duration: 'PT12M45S',
              description: 'Understanding primitive and non-primitive data types in JavaScript',
              thumbnail: 'https://img.youtube.com/vi/Hrd3SfCCXZw/maxresdefault.jpg',
              quality_score: 9.2
            }
          ],
          estimated_duration_minutes: 28,
          target_hours: 3,
          notes: 'Focus on understanding variable declarations and different data types'
        },
        {
          day_number: 2,
          topic: 'Functions and Scope',
          videos: [
            {
              id: 'js-func-1',
              title: 'JavaScript Functions Tutorial',
              url: 'https://www.youtube.com/watch?v=N8ap4k_1QEQ',
              channel: 'freeCodeCamp',
              duration: 'PT18M20S',
              description: 'Complete guide to JavaScript functions, parameters, and return values',
              thumbnail: 'https://img.youtube.com/vi/N8ap4k_1QEQ/maxresdefault.jpg',
              quality_score: 9.8
            }
          ],
          estimated_duration_minutes: 18,
          target_hours: 3,
          notes: 'Practice creating and calling functions'
        },
        {
          day_number: 3,
          topic: 'Arrays and Objects',
          videos: [
            {
              id: 'js-arr-1',
              title: 'JavaScript Arrays - Complete Guide',
              url: 'https://www.youtube.com/watch?v=7W4pQQ20nJg',
              channel: 'Web Dev Simplified',
              duration: 'PT22M15S',
              description: 'Master JavaScript arrays with methods and best practices',
              thumbnail: 'https://img.youtube.com/vi/7W4pQQ20nJg/maxresdefault.jpg',
              quality_score: 9.3
            }
          ],
          estimated_duration_minutes: 22,
          target_hours: 3,
          notes: 'Work with array methods and object properties'
        }
      ]
    },
    '2': {
      id: '2',
      title: 'Algebra Basics',
      topic: 'Mathematics',
      creator_name: 'Math Teacher',
      duration_days: 5,
      difficulty_level: 'beginner',
      status: 'active',
      created_at: new Date().toISOString(),
      total_estimated_hours: 15,
      daily_schedule: [
        {
          day_number: 1,
          topic: 'Linear Equations',
          videos: [
            {
              id: 'alg-lin-1',
              title: 'Linear Equations Made Easy',
              url: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
              channel: 'Khan Academy',
              duration: 'PT16M30S',
              description: 'Understanding and solving linear equations step by step',
              thumbnail: 'https://img.youtube.com/vi/WUvTyaaNkzM/maxresdefault.jpg',
              quality_score: 9.7
            }
          ],
          estimated_duration_minutes: 16,
          target_hours: 3,
          notes: 'Master solving single-variable linear equations'
        }
      ]
    }
  };

  useEffect(() => {
    loadLearningPath();
  }, [id]);

  const loadLearningPath = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to get from API first
      try {
        const path = await apiService.getLearningPath(id);
        setLearningPath(path);
      } catch (apiError) {
        console.log('API call failed, using mock data');
        // Fallback to mock data
        const mockPath = mockLearningPaths[id];
        if (mockPath) {
          setLearningPath(mockPath);
        } else {
          throw new Error('Learning path not found');
        }
      }
    } catch (error) {
      console.error('Failed to load learning path:', error);
      setError('Failed to load learning path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (durationStr) => {
    // Parse ISO 8601 duration (PT15M30S) to readable format
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0 min';
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  const openYouTubeVideo = (video) => {
    // Open the actual YouTube video
    window.open(video.url, '_blank');
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading learning path...</p>
        </div>
      </div>
    );
  }

  if (error || !learningPath) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card">
          <div className="card-content text-center" style={{ padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Learning Path Not Found
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {error || 'The learning path you requested could not be found.'}
            </p>
            <Link to="/dashboard" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentDay = learningPath.daily_schedule?.find(day => day.day_number === activeDay);

  return (
    <div className="animate-fade-in">
      {/* Learning Path Header */}
      <div className="glass-card mb-4">
        <div style={{ 
          background: 'linear-gradient(135deg, var(--purple-primary), var(--blue-accent))',
          padding: '2rem',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: 'white', 
            marginBottom: '0.5rem' 
          }}>
            {learningPath.title}
          </h1>
          <div style={{ 
            display: 'flex', 
            gap: '2rem', 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '1rem' 
          }}>
            <span>📖 {learningPath.topic}</span>
            <span>⏱️ {learningPath.duration_days} days</span>
            <span>🎯 {learningPath.difficulty_level}</span>
            <span>⏰ {Math.round(learningPath.total_estimated_hours)} hours total</span>
          </div>
        </div>
        
        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Created by {learningPath.creator_name} on{' '}
              {new Date(learningPath.created_at).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/learning-paths" className="btn btn-secondary">
                ← Back to Paths
              </Link>
              {user?.role === 'student' && (
                <Link to={`/progress/${learningPath.id}`} className="btn btn-primary">
                  📊 Track Progress
                </Link>
              )}
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div className="stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--blue-accent)' }}>
                {learningPath.daily_schedule?.reduce((sum, day) => sum + day.videos.length, 0) || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Videos</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--green-accent)' }}>
                {learningPath.duration_days}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Days</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--orange-accent)' }}>
                {Math.round(learningPath.total_estimated_hours)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Hours</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--purple-primary)' }}>
                {Math.round(learningPath.total_estimated_hours / learningPath.duration_days * 10) / 10}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Hours/Day</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Day Navigator */}
        <div className="glass-card" style={{ height: 'fit-content', position: 'sticky', top: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Daily Schedule
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Navigate through your learning journey
            </p>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {learningPath.daily_schedule?.map((day) => (
                <button
                  key={day.day_number}
                  onClick={() => setActiveDay(day.day_number)}
                  className={`btn ${activeDay === day.day_number ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    width: '100%', 
                    textAlign: 'left', 
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>Day {day.day_number}</div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    opacity: '0.8',
                    fontWeight: '400'
                  }}>
                    {day.topic}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    opacity: '0.7',
                    fontWeight: '400'
                  }}>
                    {day.videos.length} videos • {day.estimated_duration_minutes} min
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Day Content */}
        <div>
          {currentDay && (
            <div className="glass-card">
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid var(--border-color)',
                background: 'linear-gradient(135deg, rgba(116, 185, 255, 0.1), rgba(0, 184, 148, 0.1))'
              }}>
                <h2 style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  color: 'var(--text-primary)', 
                  marginBottom: '0.5rem' 
                }}>
                  Day {currentDay.day_number}: {currentDay.topic}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {currentDay.notes}
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: '2rem', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.9rem' 
                }}>
                  <div>🎯 Target: {currentDay.target_hours} hours</div>
                  <div>⏱️ Estimated: {currentDay.estimated_duration_minutes} minutes</div>
                  <div>📺 {currentDay.videos.length} videos</div>
                </div>
              </div>
              
              <div style={{ padding: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)', 
                  marginBottom: '1.5rem' 
                }}>
                  Today's Videos
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {currentDay.videos.map((video, index) => (
                    <div 
                      key={video.id} 
                      className="glass-card"
                      style={{ 
                        display: 'flex', 
                        gap: '1.5rem', 
                        padding: '1.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        transition: 'var(--transition)'
                      }}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        style={{
                          width: '200px',
                          height: '120px',
                          borderRadius: 'var(--radius-md)',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA3MEwxMjAgODUuMjU2NFY1NC43NDM2TDgwIDcwWiIgZmlsbD0iIzlCOTlCMyIvPgo8L3N2Zz4K';
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)', 
                          marginBottom: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          {video.title}
                        </h4>
                        <div style={{ 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.9rem', 
                          marginBottom: '0.5rem' 
                        }}>
                          📺 {video.channel}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '1rem', 
                          fontSize: '0.8rem', 
                          color: 'var(--text-muted)',
                          marginBottom: '1rem'
                        }}>
                          <span>⏱️ {formatDuration(video.duration)}</span>
                          <span>⭐ {video.quality_score.toFixed(1)}/10</span>
                          <span>#{index + 1}</span>
                        </div>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)', 
                          lineHeight: '1.5',
                          marginBottom: '1.5rem'
                        }}>
                          {video.description}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button
                            onClick={() => openYouTubeVideo(video)}
                            className="btn btn-watch"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            ▶️ Watch Video
                          </button>
                          {user?.role === 'student' && (
                            <Link
                              to={`/progress/${learningPath.id}?day=${currentDay.day_number}&video=${video.id}`}
                              className="btn btn-secondary"
                            >
                              ✅ Mark Complete
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {currentDay.videos.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📺</div>
                    <p>No videos available for this day.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '2rem' 
          }}>
            <button
              onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
              disabled={activeDay === 1}
              className="btn btn-secondary"
            >
              ← Previous Day
            </button>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              Day {activeDay} of {learningPath.duration_days}
            </div>
            <button
              onClick={() => setActiveDay(Math.min(learningPath.duration_days, activeDay + 1))}
              disabled={activeDay === learningPath.duration_days}
              className="btn btn-secondary"
            >
              Next Day →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathViewer;