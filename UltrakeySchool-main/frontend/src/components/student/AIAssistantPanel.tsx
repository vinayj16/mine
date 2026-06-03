import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { apiClient } from '../../api/client';

interface AIAssistantPanelProps {
  onClose?: () => void;
  userName?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const tabs = [
  { id: 'career' as const, label: 'Career Guidance', icon: 'ti ti-briefcase' },
  { id: 'doubts' as const, label: 'Doubt Clarification', icon: 'ti ti-message' },
];

type TabId = (typeof tabs)[number]['id'];

const WELCOME_MESSAGES: Record<TabId, string> = {
  career: "Get expert career guidance! Explore career paths, learn about educational requirements, job prospects, and get personalized advice to plan your future.",
  doubts: "I'm here to help clarify your academic doubts! Ask me about any subject, concept, or topic you're struggling with.",
};

const GET_STARTED_QUESTIONS: Record<TabId, string[]> = {
  career: [
    'What career is best for a science student?',
    'How do I become an engineer?',
    'What are the top career options in India?',
    'Which stream should I choose after 10th?',
  ],
  doubts: [
    'Explain the water cycle',
    'How does photosynthesis work?',
    'What is the Pythagorean theorem?',
    'Help me with algebra',
  ],
};

const CAREER_CHATBOT_URL = 'https://cdn.botpress.cloud/webchat/v3.6/shareable.html?configUrl=https://files.bpcontent.cloud/2026/06/02/05/20260602051531-13R4TUSH.json';

const BRAND_COLOR_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const BRAND_COLOR = '#667eea';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ onClose, userName = 'User' }) => {
  const [activeTab, setActiveTab] = useState<TabId>('career');
  const [isMinimized, setIsMinimized] = useState(false);
  const { isDarkMode } = useThemeStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleTabChange = (tabId: TabId) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      setMessages([]);
    }
  };

  const sendToGrok = async (message: string): Promise<string> => {
    try {
      const response = await apiClient.post('/ai/chat', {
        message,
        tab: activeTab,
      });
      const reply = response.data?.data?.reply;
      if (reply) return reply;
      // Try direct fetch as fallback
      const token = localStorage.getItem('accessToken');
      const fetchRes = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message, tab: activeTab }),
      });
      const fetchData = await fetchRes.json();
      if (fetchData?.success && fetchData?.data?.reply) {
        return fetchData.data.reply;
      }
      throw new Error(fetchData?.message || 'No reply');
    } catch (error: any) {
      console.error('[AIAssistant] API error:', error);
      return 'Sorry, I encountered an error connecting to the AI service. Please make sure the backend is running and try again later.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setIsTyping(true);

    const reply = await sendToGrok(userMsg);
    setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  if (isMinimized) {
    return (
      <div className="position-fixed bottom-0 end-0 m-3" style={{ zIndex: 1050 }}>
        <button
          className="btn btn-lg rounded-circle shadow-lg border-0"
          onClick={() => setIsMinimized(false)}
          style={{
            width: '60px',
            height: '60px',
            background: BRAND_COLOR_GRADIENT,
            boxShadow: `0 4px 15px rgba(102, 126, 234, 0.4)`,
          }}
        >
          <i className="ti ti-sparkles fs-4 text-white"></i>
        </button>
      </div>
    );
  }

  const renderChatArea = () => {
    if (activeTab === 'career') {
      return (
        <div style={{ height: '460px', overflow: 'hidden' }}>
          <iframe
            src={CAREER_CHATBOT_URL}
            title="Career Guidance Chatbot"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      );
    }

    return (
      <>
        {/* Chat Messages */}
        <div
          style={{
            height: '380px',
            overflowY: 'auto',
            background: isDarkMode ? '#1a1a20' : '#f8f9fa',
          }}
        >
          <div className="p-3 d-flex flex-column gap-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted py-4">
                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{
                    background: BRAND_COLOR_GRADIENT,
                    width: '72px',
                    height: '72px',
                  }}
                >
                  <i className="ti ti-message fs-3 text-white"></i>
                </div>
                <h6 className="fw-bold mb-2" style={{ color: BRAND_COLOR }}>
                  {getGreeting()}, {userName}!
                </h6>
                <p className="mb-3 small px-3">{WELCOME_MESSAGES[activeTab]}</p>
                <div className="d-flex flex-wrap justify-content-center gap-2 px-3">
                  {GET_STARTED_QUESTIONS[activeTab].map((q, i) => (
                    <button
                      key={i}
                      className="btn btn-sm"
                      style={{
                        background: isDarkMode ? '#2a2a32' : '#f0f0ff',
                        border: `1px solid ${isDarkMode ? '#3a3a42' : '#d0d0f0'}`,
                        color: isDarkMode ? '#a1a1aa' : '#6366f1',
                        borderRadius: '20px',
                        fontSize: '12px',
                        padding: '6px 14px',
                      }}
                      onClick={() => {
                        setMessages(prev => [...prev, { role: 'user', content: q, timestamp: new Date() }]);
                        setIsTyping(true);
                        sendToGrok(q).then(reply => {
                          setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
                          setIsTyping(false);
                        });
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 ${msg.role === 'user' ? 'text-white ms-auto' : 'shadow-sm me-auto'}`}
                  style={{
                    maxWidth: '85%',
                    background: msg.role === 'user'
                      ? BRAND_COLOR_GRADIENT
                      : isDarkMode ? '#25252b' : '#ffffff',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}
                >
                  <div className="d-flex align-items-center mb-1">
                    <i className={`ti ti-${msg.role === 'user' ? 'user' : 'robot'} me-2 ${msg.role === 'user' ? '' : ''}`}
                      style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : BRAND_COLOR }}></i>
                    <small className="fw-bold" style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : (isDarkMode ? '#e4e4e7' : '#667eea') }}>
                      {msg.role === 'user' ? userName : 'AI Assistant'}
                    </small>
                    <small className="ms-auto opacity-75" style={{ fontSize: '11px', color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : (isDarkMode ? '#71717a' : '#6b7280') }}>
                      {formatTime(msg.timestamp)}
                    </small>
                  </div>
                  <p className="mb-0" style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap', color: msg.role === 'user' ? '#ffffff' : (isDarkMode ? '#e4e4e7' : '#374151') }}>
                    {msg.content}
                  </p>
                </div>
              ))
            )}

            {isTyping && (
              <div
                className="shadow-sm p-3 me-auto"
                style={{
                  maxWidth: '85%',
                  borderRadius: '18px 18px 18px 4px',
                  background: isDarkMode ? '#25252b' : '#ffffff',
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" role="status" style={{ color: BRAND_COLOR }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <small className="text-muted">AI is thinking...</small>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3" style={{ background: isDarkMode ? '#18181c' : '#ffffff', borderTop: `1px solid ${isDarkMode ? '#2a2a32' : '#e5e7eb'}` }}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              style={{
                borderRadius: '25px 0 0 25px',
                border: `2px solid ${isDarkMode ? '#2a2a32' : '#e9ecef'}`,
                padding: '12px 20px',
                background: isDarkMode ? '#1e1e24' : '#f8f9fa',
                color: isDarkMode ? '#e4e4e7' : '#1e293b',
              }}
              placeholder="Ask your doubt..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isTyping}
            />
            <button
              className="btn"
              style={{
                borderRadius: '0 25px 25px 0',
                padding: '0 25px',
                background: BRAND_COLOR_GRADIENT,
                border: 'none',
                color: '#fff',
              }}
              onClick={handleSendMessage}
              disabled={isTyping || !inputValue.trim()}
            >
              {isTyping ? (
                <div className="spinner-border spinner-border-sm text-white" role="status">
                  <span className="visually-hidden">Sending...</span>
                </div>
              ) : (
                <i className="ti ti-send"></i>
              )}
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="position-fixed bottom-0 end-0 m-3" style={{ width: '420px', maxWidth: '95vw', zIndex: 1050 }}>
      <div
        className="border-0 overflow-hidden shadow-lg"
        style={{
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          background: isDarkMode ? '#18181c' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#2a2a32' : 'rgba(0,0,0,0.08)'}`,
        }}
      >
        {/* Header */}
        <div
          className="text-white d-flex align-items-center justify-content-between p-3"
          style={{
            background: BRAND_COLOR_GRADIENT,
          }}
        >
          <div className="d-flex align-items-center">
            <div
              className="d-flex align-items-center justify-content-center me-3"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <i className="ti ti-sparkles fs-5"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold" style={{ color: '#ffffff', fontSize: '14px' }}>AI Assistant</h6>
              <small style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>
                {activeTab === 'career' ? 'Career Guidance Bot' : 'Powered by Grok (xAI)'}
              </small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm rounded-circle p-0 border-0"
              onClick={() => setIsMinimized(true)}
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
              }}
              title="Minimize"
            >
              <i className="ti ti-minus" style={{ fontSize: '16px' }}></i>
            </button>
            <button
              className="btn btn-sm rounded-circle p-0 border-0"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
              }}
              title="Close"
            >
              <i className="ti ti-x" style={{ fontSize: '16px' }}></i>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: `1px solid ${isDarkMode ? '#2a2a32' : '#e5e7eb'}` }}>
          <div className="d-flex" style={{ borderBottom: 'none' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className="flex-fill py-2 px-3 border-0"
                onClick={() => handleTabChange(tab.id)}
                style={{
                  background: 'transparent',
                  borderBottom: activeTab === tab.id ? `3px solid ${BRAND_COLOR}` : '3px solid transparent',
                  color: activeTab === tab.id ? BRAND_COLOR : (isDarkMode ? '#a1a1aa' : '#6b7280'),
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  transition: 'all 0.2s',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <i className={`${tab.icon} me-1`} style={{ fontSize: '14px' }}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {renderChatArea()}
      </div>
    </div>
  );
};

export default AIAssistantPanel;
