import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { apiService, useAuth } from '../App';

const ProgressTracker = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [learningPath, setLearningPath] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [studySession, setStudySession] = useState({
    dayNumber: parseInt(searchParams.get('day')) || 1,
    videoId: searchParams.get('video') || '',
    studyTimeMinutes: 0,
    notes: '',
    completed: false
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pathData, progressData] = await Promise.all([
        apiService.getLearningPath(id),
        apiService.getProgress(id)
      ]);
      setLearningPath(pathData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    try {
      setUpdating(true);
      await apiService.updateProgress({
        learning_path_id: id,
        day_number: studySession.dayNumber,
        video_id: studySession.videoId,
        completed: studySession.completed,
        study_time_minutes: studySession.studyTimeMinutes,
        notes: studySession.notes
      });
      
      // Reload progress data
      await loadData();
      setActiveModal(null);
      resetStudySession();
    } catch (error) {
      console.error('Failed to update progress:', error);
      setError('Failed to update progress. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const resetStudySession = () => {
    setStudySession({
      dayNumber: 1,
      videoId: '',
      studyTimeMinutes: 0,
      notes: '',
      completed: false
    });
  };

  const openStudyModal = (dayNumber, videoId = '') => {
    setStudySession({
      dayNumber,
      videoId,
      studyTimeMinutes: 0,
      notes: '',
      completed: false
    });
    setActiveModal('study');
  };

  const getDayProgress = (dayNumber) => {
    if (!progress?.daily_progress) return null;
    return progress.daily_progress.find(day => day.day_number === dayNumber);
  };

  const getVideoProgress = (dayNumber, videoId) => {
    const dayProgress = getDayProgress(dayNumber);
    if (!dayProgress?.videos_completed) return null;
    return dayProgress.videos_completed.find(video => video.video_id === videoId);
  };

  const calculateOverallStats = () => {
    if (!progress || !learningPath) return { completedVideos: 0, totalVideos: 0, totalStudyTime: 0 };
    
    const totalVideos = learningPath.daily_schedule?.reduce((sum, day) => sum + day.videos.length, 0) || 0;
    const completedVideos = progress.daily_progress?.reduce((sum, day) => {
      return sum + (day.videos_completed?.filter(video => video.completed).length || 0);
    }, 0) || 0;
    
    return {
      completedVideos,
      totalVideos,
      totalStudyTime: progress.total_study_time_hours
    };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading progress data...</p>
      </div>
    );
  }

  if (error || !learningPath || !progress) {
    return (
      <div className="card">
        <div className="card-content text-center py-12">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-lg font-semibold mb-2">Progress Not Found</h3>
          <p className="text-secondary mb-6">{error || 'Progress data could not be loaded.'}</p>
          <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const stats = calculateOverallStats();
  const progressPercentage = stats.totalVideos > 0 ? (stats.completedVideos / stats.totalVideos) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Progress Tracker</h1>
            <p className="text-secondary">{learningPath.title}</p>
          </div>
          <Link to={`/learning-path/${id}`} className="btn btn-secondary">
            📖 View Learning Path
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Overall Progress */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">Overall Progress</h3>
          <p className="card-description">Your learning journey summary</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <div className="stat-value">{Math.round(progressPercentage)}%</div>
              <div className="stat-label">Completion</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.completedVideos}/{stats.totalVideos}</div>
              <div className="stat-label">Videos Watched</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round(stats.totalStudyTime * 10) / 10}</div>
              <div className="stat-label">Hours Studied</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{progress.current_day}</div>
              <div className="stat-label">Current Day</div>
            </div>
          </div>

          <div className="progress-bar mb-4">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="progress-text text-center">
            {progressPercentage === 100 
              ? '🎉 Congratulations! You have completed this learning path!'
              : `${Math.round(progressPercentage)}% complete - Keep going!`
            }
          </div>
        </div>
      </div>

      {/* Daily Progress */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Daily Progress</h3>
          <p className="card-description">Track your daily learning activities</p>
        </div>
        <div className="card-content">
          <div className="daily-schedule">
            {learningPath.daily_schedule?.map((day) => {
              const dayProgress = getDayProgress(day.day_number);
              const dayCompletionPercentage = dayProgress?.completion_percentage || 0;
              const isCurrentDay = day.day_number === progress.current_day;

              return (
                <div key={day.day_number} className={`day-card ${isCurrentDay ? 'ring-2 ring-primary' : ''}`}>
                  <div className="day-header">
                    <div>
                      <h4 className="day-title">
                        Day {day.day_number}: {day.topic}
                        {isCurrentDay && <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">Current</span>}
                      </h4>
                      <div className="text-sm text-secondary">
                        Target: {day.target_hours} hours • {day.videos.length} videos
                      </div>
                    </div>
                    <div className="day-meta">
                      <div>{Math.round(dayCompletionPercentage)}% complete</div>
                      <div>{dayProgress?.total_study_time_minutes || 0} minutes studied</div>
                    </div>
                  </div>

                  <div className="day-content">
                    <div className="progress-bar mb-4">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${dayCompletionPercentage}%` }}
                      ></div>
                    </div>

                    <div className="video-list">
                      {day.videos.map((video, index) => {
                        const videoProgress = getVideoProgress(day.day_number, video.id);
                        const isCompleted = videoProgress?.completed || false;
                        const studyTimeMinutes = videoProgress?.study_time_minutes || 0;

                        return (
                          <div key={video.id} className={`video-card ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="video-thumbnail"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA0Mkw3MiA1NC4yNTY0VjI5Ljc0MzZMNDggNDJaIiBmaWxsPSIjOUI5OUIzIi8+Cjwvc3ZnPgo=';
                              }}
                            />
                            <div className="video-content">
                              <h5 className="video-title flex items-center gap-2">
                                {isCompleted && <span className="text-green-600">✅</span>}
                                {video.title}
                              </h5>
                              <div className="video-channel">📺 {video.channel}</div>
                              <div className="video-meta">
                                <span>#{index + 1}</span>
                                {studyTimeMinutes > 0 && <span>📚 {studyTimeMinutes} min studied</span>}
                                {isCompleted && <span className="text-green-600">Completed ✅</span>}
                              </div>
                            </div>
                            <div className="video-actions">
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                              >
                                ▶️ Watch
                              </a>
                              <button
                                onClick={() => openStudyModal(day.day_number, video.id)}
                                className={`btn btn-sm ${isCompleted ? 'btn-success' : 'btn-primary'}`}
                              >
                                {isCompleted ? '✏️ Update' : '📚 Mark Complete'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {dayProgress?.notes && (
                      <div className="mt-4 p-3 bg-background-secondary rounded-lg">
                        <h6 className="font-semibold mb-2">Your Notes:</h6>
                        <p className="text-sm">{dayProgress.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Study Session Modal */}
      {activeModal === 'study' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">Record Study Session</h4>
              <button 
                className="modal-close"
                onClick={() => setActiveModal(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <form className="form">
                <div className="form-group">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={studySession.completed}
                      onChange={(e) => setStudySession({...studySession, completed: e.target.checked})}
                    />
                    <span>Mark as completed</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="studyTime" className="form-label">
                    Study Time (minutes)
                  </label>
                  <input
                    type="number"
                    id="studyTime"
                    value={studySession.studyTimeMinutes}
                    onChange={(e) => setStudySession({...studySession, studyTimeMinutes: parseInt(e.target.value) || 0})}
                    className="form-input"
                    min="0"
                    placeholder="How many minutes did you study?"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes" className="form-label">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={studySession.notes}
                    onChange={(e) => setStudySession({...studySession, notes: e.target.value})}
                    className="form-textarea"
                    placeholder="Any notes about this study session..."
                    rows="3"
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setActiveModal(null)}
                className="btn btn-secondary"
                disabled={updating}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProgress}
                className="btn btn-primary"
                disabled={updating}
              >
                {updating ? (
                  <>
                    <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }}></div>
                    Saving...
                  </>
                ) : (
                  'Save Progress'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;