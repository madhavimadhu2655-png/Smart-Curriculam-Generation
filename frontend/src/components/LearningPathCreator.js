import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, useAuth } from '../App';

const LearningPathCreator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    duration_days: 7,
    difficulty_level: 'beginner',
    max_videos_per_day: 3,
    target_hours_per_day: 2.0,
    assigned_student_ids: []
  });
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (user?.role === 'teacher') {
      loadStudents();
    }
  }, [user]);

  const loadStudents = async () => {
    try {
      const studentsData = await apiService.getStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
    if (error) setError('');
  };

  const handleStudentSelection = (studentId) => {
    const currentIds = formData.assigned_student_ids;
    if (currentIds.includes(studentId)) {
      setFormData({
        ...formData,
        assigned_student_ids: currentIds.filter(id => id !== studentId)
      });
    } else {
      setFormData({
        ...formData,
        assigned_student_ids: [...currentIds, studentId]
      });
    }
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        if (!formData.title.trim()) {
          setError('Please enter a title for your learning path');
          return false;
        }
        if (!formData.topic.trim()) {
          setError('Please enter a topic to learn');
          return false;
        }
        break;
      case 2:
        if (formData.duration_days < 1 || formData.duration_days > 30) {
          setError('Duration must be between 1 and 30 days');
          return false;
        }
        if (formData.target_hours_per_day < 0.5 || formData.target_hours_per_day > 8) {
          setError('Target hours per day must be between 0.5 and 8 hours');
          return false;
        }
        break;
      default:
        break;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      const createdPath = await apiService.createLearningPath(formData);
      navigate(`/learning-path/${createdPath.id}`);
    } catch (error) {
      console.error('Failed to create learning path:', error);
      setError(
        error.response?.data?.detail || 
        'Failed to create learning path. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const topicSuggestions = [
    'Python Programming',
    'JavaScript Fundamentals',
    'React Development',
    'Data Science with Python',
    'Machine Learning Basics',
    'Web Development',
    'Mobile App Development',
    'Database Design',
    'DevOps and CI/CD',
    'Cybersecurity Basics'
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNum) => (
        <React.Fragment key={stepNum}>
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              stepNum <= step 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {stepNum}
          </div>
          {stepNum < 3 && (
            <div 
              className={`w-12 h-0.5 ${
                stepNum < step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="form">
      <div className="form-group">
        <label htmlFor="title" className="form-label">
          Learning Path Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="form-input"
          placeholder="e.g., Complete Python Programming Course"
          required
        />
        <div className="form-help">
          Give your learning path a clear, descriptive title
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="topic" className="form-label">
          What do you want to learn? *
        </label>
        <input
          type="text"
          id="topic"
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          className="form-input"
          placeholder="e.g., Python Programming, JavaScript, Data Science"
          required
        />
        <div className="form-help">
          Popular topics: 
          <div className="flex flex-wrap gap-2 mt-2">
            {topicSuggestions.slice(0, 5).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setFormData({...formData, topic: suggestion})}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="difficulty_level" className="form-label">
          Difficulty Level
        </label>
        <select
          id="difficulty_level"
          name="difficulty_level"
          value={formData.difficulty_level}
          onChange={handleChange}
          className="form-select"
        >
          <option value="beginner">Beginner - No prior experience needed</option>
          <option value="intermediate">Intermediate - Some experience required</option>
          <option value="advanced">Advanced - Extensive experience required</option>
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="duration_days" className="form-label">
            Duration (Days)
          </label>
          <input
            type="number"
            id="duration_days"
            name="duration_days"
            value={formData.duration_days}
            onChange={handleChange}
            className="form-input"
            min="1"
            max="30"
            required
          />
          <div className="form-help">
            How many days do you want this learning path to span?
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="target_hours_per_day" className="form-label">
            Target Hours per Day
          </label>
          <input
            type="number"
            id="target_hours_per_day"
            name="target_hours_per_day"
            value={formData.target_hours_per_day}
            onChange={handleChange}
            className="form-input"
            min="0.5"
            max="8"
            step="0.5"
            required
          />
          <div className="form-help">
            Recommended study time per day
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="max_videos_per_day" className="form-label">
          Maximum Videos per Day
        </label>
        <input
          type="number"
          id="max_videos_per_day"
          name="max_videos_per_day"
          value={formData.max_videos_per_day}
          onChange={handleChange}
          className="form-input"
          min="1"
          max="10"
          required
        />
        <div className="form-help">
          Maximum number of video lessons per day
        </div>
      </div>

      {/* Preview */}
      <div className="card mt-6">
        <div className="card-header">
          <h4 className="card-title">Learning Path Preview</h4>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Total Duration:</strong> {formData.duration_days} days
            </div>
            <div>
              <strong>Daily Study Time:</strong> {formData.target_hours_per_day} hours
            </div>
            <div>
              <strong>Total Study Time:</strong> ~{(formData.duration_days * formData.target_hours_per_day).toFixed(1)} hours
            </div>
            <div>
              <strong>Videos per Day:</strong> Up to {formData.max_videos_per_day}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form">
      {user?.role === 'teacher' ? (
        <>
          <div className="form-group">
            <label className="form-label">
              Assign to Students (Optional)
            </label>
            <div className="form-help mb-4">
              Select which students should have access to this learning path. 
              Leave empty to create for yourself only.
            </div>
            
            {students.length === 0 ? (
              <div className="text-center py-8 text-secondary">
                <p>No students found in your account.</p>
                <p className="text-sm mt-2">Students will need to register first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={formData.assigned_student_ids.includes(student.id)}
                      onChange={() => handleStudentSelection(student.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-secondary">{student.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            {formData.assigned_student_ids.length > 0 && (
              <div className="mt-3 text-sm text-secondary">
                Selected {formData.assigned_student_ids.length} student{formData.assigned_student_ids.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <h4 className="text-lg font-semibold mb-2">Ready to Create Your Learning Path!</h4>
          <p className="text-secondary">
            Your personalized learning journey will be generated with curated YouTube videos 
            and organized into a day-by-day schedule.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="card mt-6">
        <div className="card-header">
          <h4 className="card-title">Summary</h4>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Title:</span>
              <span>{formData.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Topic:</span>
              <span>{formData.topic}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Duration:</span>
              <span>{formData.duration_days} days</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Daily Study Time:</span>
              <span>{formData.target_hours_per_day} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Difficulty:</span>
              <span className="capitalize">{formData.difficulty_level}</span>
            </div>
            {user?.role === 'teacher' && (
              <div className="flex justify-between">
                <span className="font-medium">Assigned Students:</span>
                <span>{formData.assigned_student_ids.length} students</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-2">Create Learning Path</h1>
        <p className="text-secondary">
          Generate a personalized learning journey with curated YouTube content
        </p>
      </div>

      {renderStepIndicator()}

      {error && (
        <div className="alert alert-error mb-6">
          <span>⚠️</span>
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Step {step}: {
              step === 1 ? 'Basic Information' :
              step === 2 ? 'Learning Schedule' :
              'Assignment & Review'
            }
          </h3>
        </div>
        
        <div className="card-content">
          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  ← Previous
                </button>
              )}
              
              <div className="ml-auto">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }}></div>
                        Creating Path...
                      </>
                    ) : (
                      '🚀 Create Learning Path'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LearningPathCreator;