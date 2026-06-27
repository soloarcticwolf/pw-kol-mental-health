'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { 
  Heart, 
  Wind, 
  Sparkles, 
  Lightbulb, 
  MessageCircle, 
  Calendar, 
  Flame, 
  Send,
  X,
  AlertCircle
} from 'lucide-react';

// --- Mock Data ---
const EXAMS = ['NEET', 'JEE', 'UPSC', 'CUET', 'CAT', 'GATE'];
const MOOD_HISTORY = [
  { day: 'Mon', score: 3 },
  { day: 'Tue', score: 2 },
  { day: 'Wed', score: 4 },
  { day: 'Thu', score: 3 },
  { day: 'Fri', score: 3 },
  { day: 'Sat', score: 2 },
  { day: 'Sun', score: 4 }
];

const FALLBACK_RESPONSE = {
  detected_trigger: "fear of falling behind",
  validation: "It's completely normal to feel like you're not doing enough when everyone else seems to be sprinting.",
  coping_action: "Close your books right now, splash some cold water on your face, and listen to one song you love without thinking about studying.",
  why_this_helps: "Breaking the cycle of rumination resets your nervous system and gives your brain a micro-break to process.",
  encouragement: "You've survived 100% of your bad study days. Keep going."
};

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { role: 'ai', content: "Hey there. I'm Sahay. Studying for exams can be really tough. How are you holding up today?" }
];

// --- Types ---
type MoodScore = 1 | 2 | 3 | 4 | 5 | null;

interface AIResponse {
  detected_trigger: string;
  validation: string;
  coping_action: string;
  why_this_helps: string;
  encouragement: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

// --- Components ---

export default function SahayApp() {
  // State
  const [exam, setExam] = useState('NEET');
  const [mood, setMood] = useState<MoodScore>(null);
  const [journal, setJournal] = useState('');
  const [streak, setStreak] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // Handlers
  const handleMoodSelect = (score: MoodScore) => {
    setMood(score);
    // If they just want a quick log and no journal, we could trigger something here, 
    // but for the demo we'll encourage journaling
  };

  const isCrisisText = (text: string) => {
    const crisisKeywords = ['suicide', 'kill myself', 'end it', 'hopeless', 'harm myself', 'don\'t want to live'];
    return crisisKeywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  const handleSubmit = async () => {
    if (!mood || !journal.trim()) return;

    if (isCrisisText(journal)) {
      setAiResponse({
        detected_trigger: "severe distress",
        validation: "I hear how much pain you're in right now, and I want you to know you're not alone.",
        coping_action: "Please put everything down and call iCall (9152987821) or Vandrevala Foundation (1860-2662-345) immediately. They are trained to help.",
        why_this_helps: "Sometimes we need more support than an app can provide, and talking to a trained human can make a huge difference.",
        encouragement: "Please reach out. Your life is more important than any exam."
      });
      return;
    }

    setIsLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          journal,
          examName: exam,
          moodHistory: MOOD_HISTORY.slice(-5).map(m => m.score)
        })
      });

      if (!res.ok) throw new Error('API failed');
      
      const data = await res.json();
      setAiResponse(data);
      setStreak(prev => prev + 1); // Increment streak on successful log
    } catch (error) {
      console.error('Failed to fetch AI response:', error);
      // Fallback for demo
      setTimeout(() => {
        setAiResponse(FALLBACK_RESPONSE);
        setStreak(prev => prev + 1);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          examName: exam
        })
      });

      if (!res.ok) throw new Error('Chat API failed');
      
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      console.error('Chat failed:', error);
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: "I'm having a little trouble connecting right now, but I'm here. Take a deep breath." 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] sm:flex sm:items-center sm:justify-center sm:py-8">
      <main className="w-full max-w-md mx-auto relative overflow-hidden bg-[var(--bg-primary)] sm:rounded-[32px] sm:shadow-2xl sm:border-[6px] sm:border-white sm:h-[850px] sm:max-h-[90vh] sm:overflow-y-auto min-h-screen pb-24 shadow-none">
      
      {/* Header section */}
      <header className="p-6 pt-10 stagger-children">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">Hi, Arjun 👋</h1>
            <p className="text-[var(--text-secondary)]">Let's check in on how you're doing.</p>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <div className="countdown-badge">
              <Calendar size={14} />
              47 days to go
            </div>
            <div className="streak-badge animate-float" style={{ animationDelay: '1s' }}>
              <Flame size={14} className="text-[#d4a86a]" />
              {streak} day streak
            </div>
          </div>
        </div>

        {/* Exam Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {EXAMS.map(e => (
            <button
              key={e}
              onClick={() => setExam(e)}
              className={`exam-chip ${exam === e ? 'selected' : ''}`}
            >
              {e}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 flex flex-col gap-8 stagger-children">
        
        {/* Mood Tracker */}
        <section className="card p-6">
          <h2 className="text-lg font-bold mb-4">How are you feeling today?</h2>
          <div className="flex justify-between gap-2">
            {[
              { score: 1, emoji: '😫', label: 'Awful' },
              { score: 2, emoji: '😔', label: 'Bad' },
              { score: 3, emoji: '😐', label: 'Okay' },
              { score: 4, emoji: '🙂', label: 'Good' },
              { score: 5, emoji: '🤩', label: 'Great' }
            ].map((item) => (
              <button
                key={item.score}
                onClick={() => handleMoodSelect(item.score as MoodScore)}
                className={`emoji-btn flex-1 ${mood === item.score ? 'selected' : ''}`}
              >
                <span className="emoji">{item.emoji}</span>
                <span className="label">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Journal Section */}
        <section className="card p-6" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-bold mb-2">What's on your mind?</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Be specific. What exactly is stressing you out about {exam}?
          </p>
          
          <textarea
            className="journal-textarea mb-4"
            placeholder={`e.g. I bombed today's ${exam} mock test and I keep thinking about how far behind I am compared to my friends...`}
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
          />
          
          <button 
            className="btn-primary w-full"
            onClick={handleSubmit}
            disabled={!mood || !journal.trim() || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Sparkles size={18} className="animate-pulse" />
                Reading your entry...
              </span>
            ) : (
              'Get Support'
            )}
          </button>
        </section>

        {/* AI Response Card */}
        {aiResponse && (
          <section className={`response-card animate-slide-up ${aiResponse.detected_trigger === 'severe distress' ? 'border-[var(--accent-amber)] border-2' : ''}`}>
            <div className={`response-card-header ${aiResponse.detected_trigger === 'severe distress' ? 'bg-[var(--accent-amber)]' : ''}`}>
              <div className="flex items-center gap-2 mb-1 opacity-90 text-sm font-semibold uppercase tracking-wider">
                <Sparkles size={14} />
                Insights for you
              </div>
              <h3 className="text-xl font-bold leading-tight">
                Trigger: {aiResponse.detected_trigger}
              </h3>
            </div>
            
            <div className="flex flex-col">
              <div className="response-item">
                <div className="response-icon bg-[var(--accent-rose-light)] text-[var(--accent-rose)]">
                  <Heart size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-1">Validation</h4>
                  <p className="text-[var(--text-primary)] leading-relaxed">{aiResponse.validation}</p>
                </div>
              </div>
              
              <div className="response-item">
                <div className="response-icon bg-[var(--accent-teal-light)] text-white shadow-sm">
                  <Wind size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--accent-teal-dark)] mb-1">Action (under 5 mins)</h4>
                  <p className="font-semibold text-[var(--text-primary)] leading-relaxed">{aiResponse.coping_action}</p>
                </div>
              </div>
              
              <div className="response-item">
                <div className="response-icon bg-[var(--accent-sage-light)] text-[var(--accent-sage)]">
                  <Lightbulb size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-1">Why this helps</h4>
                  <p className="text-[var(--text-primary)] leading-relaxed text-sm">{aiResponse.why_this_helps}</p>
                </div>
              </div>
              
              <div className="response-item bg-[var(--bg-secondary)]">
                <div className="response-icon bg-[var(--accent-amber-light)] text-[var(--accent-amber)]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] italic">"{aiResponse.encouragement}"</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Skeleton Loader */}
        {isLoading && (
          <section className="card p-6 animate-pulse-gentle">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] animate-shimmer"></div>
              <div className="flex-1">
                <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/3 mb-2 animate-shimmer"></div>
                <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/2 animate-shimmer"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] shrink-0 animate-shimmer"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-[var(--bg-secondary)] rounded w-full animate-shimmer"></div>
                    <div className="h-3 bg-[var(--bg-secondary)] rounded w-5/6 animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mood Trend Chart */}
        <section className="card p-6 mb-8" style={{ animationDelay: '300ms' }}>
          <h2 className="text-lg font-bold mb-6">Your week at a glance</h2>
          
          <div className="h-[200px] w-full ml-[-10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOOD_HISTORY} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-teal)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                  dy={10}
                />
                <YAxis 
                  domain={[1, 5]} 
                  ticks={[1, 2, 3, 4, 5]} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                  labelStyle={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="var(--accent-teal)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* FAB for Chat */}
      {!isChatOpen && (
        <button 
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--text-primary)] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-30 animate-fade-in-up"
          style={{ animationDelay: '500ms' }}
          onClick={() => setIsChatOpen(true)}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Overlay */}
      {isChatOpen && (
        <>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setIsChatOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[75%] bg-[var(--bg-card)] rounded-t-[var(--radius-xl)] shadow-[0_-4px_30px_rgba(45,58,46,0.15)] z-50 flex flex-col animate-slide-up">
            <div className="flex justify-between items-center p-4 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-sage-light)] flex items-center justify-center text-[var(--accent-teal-dark)]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold leading-tight">Talk it out</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Sahay is here to listen</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-secondary)]"
              >
                <X size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>
            
            <div className="chat-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {isChatLoading && (
                <div className="chat-bubble ai opacity-70 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse-gentle"></span>
                  <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse-gentle" style={{ animationDelay: '200ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse-gentle" style={{ animationDelay: '400ms' }}></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="chat-input-row">
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              />
              <button 
                className="chat-send-btn"
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isChatLoading}
              >
                <Send size={18} className="ml-[-2px] mt-[2px]" />
              </button>
            </div>
          </div>
        </>
      )}

      </main>
    </div>
  );
}
