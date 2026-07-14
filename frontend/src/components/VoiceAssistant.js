import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const VoiceAssistant = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en-US');
  const [translationMode, setTranslationMode] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('es-ES');
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const languages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
    { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' }
  ];

  useEffect(() => {
    initializeSpeechRecognition();
    initializeSpeechSynthesis();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = currentLanguage;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          processVoiceCommand(finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setResponse(`Error: ${event.error}. Please try again.`);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const initializeSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.lang = currentLanguage;
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text, language = currentLanguage) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synthRef.current.getVoices();
      
      // Find appropriate voice for the language
      const voice = voices.find(v => v.lang.startsWith(language.split('-')[0])) || voices[0];
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      synthRef.current.speak(utterance);
    }
  };

  const processVoiceCommand = async (command) => {
    const lowerCommand = command.toLowerCase().trim();
    let responseText = '';
    
    addToHistory('user', command);
    
    if (translationMode) {
      // Translation mode
      const translation = await translateText(command, currentLanguage, targetLanguage);
      responseText = `Translation: ${translation}`;
      speak(translation, targetLanguage);
    } else {
      // Command processing mode
      if (lowerCommand.includes('dashboard') || lowerCommand.includes('home')) {
        navigate('/dashboard');
        responseText = 'Navigating to dashboard';
      } else if (lowerCommand.includes('student') && lowerCommand.includes('list')) {
        navigate('/students');
        responseText = 'Opening student list';
      } else if (lowerCommand.includes('learning path')) {
        navigate('/learning-paths');
        responseText = 'Opening learning paths';
      } else if (lowerCommand.includes('qr') || lowerCommand.includes('scanner')) {
        navigate('/qr-scanner');
        responseText = 'Opening QR scanner';
      } else if (lowerCommand.includes('attendance')) {
        navigate('/attendance');
        responseText = 'Opening attendance section';
      } else if (lowerCommand.includes('what') && lowerCommand.includes('time')) {
        const currentTime = new Date().toLocaleTimeString();
        responseText = `The current time is ${currentTime}`;
      } else if (lowerCommand.includes('what') && lowerCommand.includes('date')) {
        const currentDate = new Date().toLocaleDateString();
        responseText = `Today's date is ${currentDate}`;
      } else if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
        responseText = `Hello ${user?.name || 'there'}! How can I help you navigate the EduTrack Pro platform?`;
      } else if (lowerCommand.includes('help')) {
        responseText = 'I can help you navigate the platform. Try saying: "Show dashboard", "Open student list", "Go to learning paths", or "Open QR scanner"';
      } else if (lowerCommand.includes('translate')) {
        setTranslationMode(true);
        responseText = 'Translation mode activated. I will now translate what you say.';
      } else if (lowerCommand.includes('stop translate')) {
        setTranslationMode(false);
        responseText = 'Translation mode deactivated. Back to navigation mode.';
      } else {
        responseText = `I heard "${command}". Try commands like: "Show dashboard", "Open students", "Go to learning paths", "Start QR scanner", or "Help"`;
      }
      
      speak(responseText);
    }
    
    setResponse(responseText);
    addToHistory('assistant', responseText);
  };

  const translateText = async (text, fromLang, toLang) => {
    // Simple mock translation for demo
    // In production, use Google Translate API or similar service
    const translations = {
      'hello': { 'es-ES': 'hola', 'fr-FR': 'bonjour', 'de-DE': 'hallo' },
      'goodbye': { 'es-ES': 'adiós', 'fr-FR': 'au revoir', 'de-DE': 'auf wiedersehen' },
      'thank you': { 'es-ES': 'gracias', 'fr-FR': 'merci', 'de-DE': 'danke' },
      'how are you': { 'es-ES': 'cómo estás', 'fr-FR': 'comment allez-vous', 'de-DE': 'wie geht es dir' }
    };
    
    const lowerText = text.toLowerCase();
    for (const [english, translationMap] of Object.entries(translations)) {
      if (lowerText.includes(english)) {
        return translationMap[toLang] || `[Translation of "${text}" to ${toLang}]`;
      }
    }
    
    return `[Translation of "${text}" to ${toLang}]`;
  };

  const addToHistory = (sender, message) => {
    setConversationHistory(prev => [...prev.slice(-10), {
      id: Date.now(),
      sender,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  const clearHistory = () => {
    setConversationHistory([]);
    setResponse('');
    setTranscript('');
  };

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return null; // Don't render if speech recognition is not supported
  }

  return (
    <>
      {/* Floating Voice Assistant Button */}
      {isMinimized && (
        <button
          onClick={toggleMinimized}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple-primary), var(--blue-accent))',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            animation: isListening ? 'pulse 1s infinite' : 'none',
            transition: 'var(--transition)'
          }}
          title="Voice Assistant"
        >
          🎤
        </button>
      )}

      {/* Voice Assistant Panel */}
      {!isMinimized && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
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
            background: 'linear-gradient(135deg, var(--purple-primary), var(--blue-accent))',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  🎤 Voice Assistant
                </h3>
                <p style={{ fontSize: '0.875rem', opacity: '0.9' }}>
                  {translationMode ? 'Translation Mode' : 'Navigation Mode'}
                </p>
              </div>
              <button
                onClick={toggleMinimized}
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

          {/* Language Selection */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setTranslationMode(!translationMode)}
                className={`btn btn-sm ${translationMode ? 'btn-success' : 'btn-secondary'}`}
                title="Toggle Translation Mode"
              >
                🌐
              </button>
            </div>
            
            {translationMode && (
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                {languages.filter(lang => lang.code !== currentLanguage).map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} Translate to {lang.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Conversation History */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {conversationHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎙️</div>
                <p>Start speaking to interact with the voice assistant!</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Try: "Show dashboard", "Open students", "Help"
                </p>
              </div>
            ) : (
              conversationHistory.map(item => (
                <div
                  key={item.id}
                  style={{
                    alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: item.sender === 'user' 
                      ? 'var(--blue-accent)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    color: item.sender === 'user' ? 'white' : 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <div>{item.message}</div>
                  <div style={{
                    fontSize: '0.75rem',
                    opacity: '0.7',
                    marginTop: '0.25rem'
                  }}>
                    {item.timestamp}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Current Transcript */}
          {transcript && (
            <div style={{
              padding: '1rem',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(116, 185, 255, 0.1)',
              color: 'var(--blue-accent)',
              fontSize: '0.875rem'
            }}>
              <strong>Listening:</strong> {transcript}
            </div>
          )}

          {/* Controls */}
          <div style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
              style={{ flex: 1 }}
            >
              {isListening ? '⏹️ Stop' : '🎤 Listen'}
            </button>
            <button
              onClick={clearHistory}
              className="btn btn-secondary"
              title="Clear History"
            >
              🗑️
            </button>
          </div>
        </div>
      )}

      {/* Pulse animation for listening state */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default VoiceAssistant;