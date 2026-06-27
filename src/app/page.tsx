'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Heart, Wind, Sparkles, Lightbulb, MessageCircle, Calendar, Flame, Send, X, BookOpen, BarChart2, Mic, Settings } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────
const EXAMS = ['NEET','JEE','UPSC','CUET','CAT','GATE'];
const INITIAL_MOOD_HISTORY = [
  {day:'Mon',score:3},{day:'Tue',score:2},{day:'Wed',score:4},
  {day:'Thu',score:3},{day:'Fri',score:3},{day:'Sat',score:2},{day:'Sun',score:4}
];
const FALLBACK = {
  detected_trigger:'fear of falling behind',
  validation:"It's completely normal to feel like you're not doing enough when everyone else seems to be sprinting.",
  coping_action:'Close your books, splash cold water on your face, and listen to one song you love — no studying.',
  why_this_helps:'Breaking the cycle of rumination resets your nervous system and gives your brain a micro-break.',
  encouragement:"You've survived 100% of your bad study days. Keep going."
};
const INIT_CHAT: ChatMessage[] = [{role:'ai',content:"Hey there. I'm Sahay. Studying for exams can be really tough. How are you holding up today?"}];

// ─── Sign-In Gate ─────────────────────────────────────────────
function SignInGate() {
  return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-page)'}}>
      <div style={{textAlign:'center',maxWidth:400,padding:'0 24px'}}>
        <div style={{width:56,height:56,borderRadius:16,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)',margin:'0 auto 20px'}}>
          <Sparkles size={26}/>
        </div>
        <h1 style={{fontSize:28,fontWeight:800,marginBottom:10,letterSpacing:'-0.02em'}}>Welcome to Sahay</h1>
        <p style={{color:'var(--text-secondary)',fontSize:15,lineHeight:1.65,marginBottom:32}}>Your calm AI companion through exam season. Sign in to start tracking your mood and get personalized support.</p>
        <SignInButton mode="modal">
          <button className="btn-primary" style={{width:'100%',justifyContent:'center'}}>
            <Sparkles size={16}/> Sign in to get started
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
const CRISIS_WORDS = ['suicide','kill myself','end it all','hopeless','harm myself','don\'t want to live'];

// ─── Types ───────────────────────────────────────────────────
type MoodScore = 1|2|3|4|5|null;
interface AIResponse { detected_trigger:string; validation:string; coping_action:string; why_this_helps:string; encouragement:string; }
interface ChatMessage { role:'user'|'ai'; content:string; }


// ─── Setup Screen ─────────────────────────────────────────────
function SetupScreen({ onSave }: { onSave: (date: string, name: string) => void }) {
  const [tempExam, setTempExam] = useState(EXAMS[0]);
  const [tempDate, setTempDate] = useState('');

  return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-page)'}}>
      <div className="card" style={{padding:'40px',maxWidth:460,width:'100%',margin:'0 24px'}}>
        <h2 style={{fontSize:24,fontWeight:800,marginBottom:8}}>Let's set up your profile</h2>
        <p style={{color:'var(--text-secondary)',marginBottom:24,fontSize:15}}>Tell Sahay what you are preparing for so we can tailor your experience.</p>
        
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div>
            <label style={{fontSize:13,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:8}}>Which exam?</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {EXAMS.map(e=>(
                <button key={e} className={`exam-chip ${tempExam===e?'active':''}`} onClick={()=>setTempExam(e)}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:8}}>Target Date</label>
            <input type="date" className="login-input" value={tempDate} onChange={e=>setTempDate(e.target.value)} />
          </div>
          <button className="btn-primary" style={{marginTop:12,width:'100%',justifyContent:'center'}} disabled={!tempDate} onClick={()=>onSave(tempDate, tempExam)}>
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Main Dashboard ───────────────────────────────────────────
export default function SahayApp() {
  const { user, isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [exam, setExam] = useState('NEET');
  const [examDate, setExamDate] = useState<string | null>(null);
  
  const [mood, setMood] = useState<MoodScore>(null);
  const [journal, setJournal] = useState('');
  const [streak, setStreak] = useState(4);
  const [moodHistory, setMoodHistory] = useState(INITIAL_MOOD_HISTORY);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse|null>(null);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INIT_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Voice state
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(()=>{
    if(isChatOpen) chatEndRef.current?.scrollIntoView({behavior:'smooth'});
  },[chatMessages,isChatOpen]);

  // Load Setup from LocalStorage
  useEffect(() => {
    const savedExam = localStorage.getItem('sahay_examName');
    const savedDate = localStorage.getItem('sahay_examDate');
    if (savedExam && savedDate) {
      setExam(savedExam);
      setExamDate(savedDate);
      setIsSetupComplete(true);
    } else {
      setIsSetupComplete(false);
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        await handleVoiceChat(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, [exam, journal]);

  if (!isLoaded || isSetupComplete === null) return null;
  if (!user) return <SignInGate />;
  
  if (!isSetupComplete) {
    return <SetupScreen onSave={(date, name) => {
      localStorage.setItem('sahay_examDate', date);
      localStorage.setItem('sahay_examName', name);
      setExam(name);
      setExamDate(date);
      setIsSetupComplete(true);
    }}/>;
  }

  const firstName = user.firstName || user.username || 'there';
  const daysLeft = examDate ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const isCrisis = (t:string) => CRISIS_WORDS.some(w=>t.toLowerCase().includes(w));

  const handleSubmit = async () => {
    if (!mood || !journal.trim()) return;
    if (isCrisis(journal)) {
      setAiResponse({detected_trigger:'severe distress',validation:"I hear how much pain you're in right now. You are not alone.",coping_action:'Please call iCall (9152987821) or Vandrevala Foundation (1860-2662-345) right now. They are trained to help.',why_this_helps:'Sometimes we need more support than an app can provide — a trained human can make a real difference.',encouragement:'Please reach out. Your life is more important than any exam.'});
      return;
    }
    setIsLoading(true); setAiResponse(null);
    try {
      const res = await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mood,journal,examName:exam,moodHistory:moodHistory.slice(-5).map(m=>m.score)})});
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setAiResponse(data);
      setStreak(p=>p+1);
      setMoodHistory(p=>[...p.slice(1),{day:'Today',score:mood as number}]);
    } catch {
      setTimeout(()=>{
        setAiResponse(FALLBACK);
        setStreak(p=>p+1);
        setMoodHistory(p=>[...p.slice(1),{day:'Today',score:mood as number}]);
      },1200);
    } finally { setIsLoading(false); }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const msg = chatInput.trim(); setChatInput('');
    setChatMessages(p=>[...p,{role:'user',content:msg}]); setIsChatLoading(true);
    try {
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,examName:exam})});
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChatMessages(p=>[...p,{role:'ai',content:data.reply}]);
    } catch {
      setChatMessages(p=>[...p,{role:'ai',content:"I'm having a little trouble right now. Take a breath — I'm here."}]);
    } finally { setIsChatLoading(false); }
  };

  // ─── Voice Logic ─────────────────────────────────────────────
  const startListening = () => {
    if (isSpeaking) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert("Speech recognition not supported in this browser. Please try Chrome or Edge.");
    }
  };

  const handleVoiceChat = async (msg: string) => {
    try {
      const res = await fetch('/api/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        // Send journal as context so the AI knows why the user is low
        body:JSON.stringify({message: msg, examName: exam, voiceContext: journal })
      });
      if (res.ok) {
        const data = await res.json();
        speakResponse(data.reply);
      }
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const speakResponse = (text: string) => {
    if (typeof window === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(text);
    // Remove emojis/markdown for TTS
    utterance.text = text.replace(/[*#]/g, '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    utterance.rate = 1.05;
    
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const openVoiceSession = () => {
    setIsVoiceOpen(true);
    // AI initiates the conversation based on the journal context
    const greeting = journal 
      ? `Hey ${firstName}. I read your journal. I'm so sorry you're feeling this way about ${exam}. Tell me what's going on.`
      : `Hey ${firstName}, I'm here. What's on your mind?`;
    speakResponse(greeting);
  };

  const closeVoiceSession = () => {
    setIsVoiceOpen(false);
    if (isSpeaking) window.speechSynthesis.cancel();
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    setIsSpeaking(false);
    setIsListening(false);
  };

  const MOODS = [{s:1,e:'😫',l:'Awful'},{s:2,e:'😔',l:'Bad'},{s:3,e:'😐',l:'Okay'},{s:4,e:'🙂',l:'Good'},{s:5,e:'🤩',l:'Great'}];

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <header className="app-topbar">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)'}}>
            <Sparkles size={17}/>
          </div>
          <span style={{fontWeight:800,fontSize:17,letterSpacing:'-0.01em'}}>Sahay</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div className="badge badge-teal"><Calendar size={12}/>{daysLeft} days to {exam}</div>
          <div className="badge badge-amber" style={{animation:'float 3s ease-in-out infinite'}}><Flame size={12}/>{streak} day streak</div>
          <div style={{width:1,height:22,background:'var(--border)',margin:'0 4px'}}/>
          <UserButton appearance={{elements:{avatarBox:{width:32,height:32}}}}/>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="app-sidebar">
        <div>
          <p className="section-label">Your Exam</p>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--bg-card)',padding:'12px 16px',borderRadius:'var(--r-md)',border:'1px solid var(--border)'}}>
            <span style={{fontWeight:700,fontSize:14}}>{exam}</span>
            <button onClick={()=>setIsSetupComplete(false)} style={{background:'transparent',border:'none',color:'var(--text-muted)',cursor:'pointer'}}>
              <Settings size={15}/>
            </button>
          </div>
        </div>

        <div>
          <p className="section-label">Actions</p>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <button className="nav-item active">
              <BookOpen size={16}/> Daily Check-in
            </button>
            <button className="nav-item" onClick={()=>setIsChatOpen(true)}>
              <MessageCircle size={16}/> Chat via text
            </button>
            <button className="nav-item" onClick={openVoiceSession}>
              <Mic size={16}/> Talk to Sahay
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-main">
        <div className="stagger">
          {/* Greeting */}
          <div style={{marginBottom:36}}>
            <h1 style={{fontSize:32,fontWeight:800,letterSpacing:'-0.02em',marginBottom:6}}>
              Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, {firstName} 👋
            </h1>
            <p style={{color:'var(--text-secondary)',fontSize:16}}>How are you doing today? Let's check in.</p>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:24}}>
            {/* Mood tracker */}
            <div className="card" style={{padding:'28px 32px'}}>
              <h2 style={{fontSize:16,fontWeight:800,marginBottom:6}}>How are you feeling right now?</h2>
              <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:20}}>Pick the emoji that best matches your current state.</p>
              <div style={{display:'flex',gap:12}}>
                {MOODS.map(item=>(
                  <button key={item.s} className={`mood-btn ${mood===item.s?'active':''}`} onClick={()=>setMood(item.s as MoodScore)}>
                    <span className="m-emoji">{item.e}</span>
                    <span className="m-label">{item.l}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Journal */}
            <div className="card" style={{padding:'28px 32px'}}>
              <h2 style={{fontSize:16,fontWeight:800,marginBottom:4}}>What's on your mind?</h2>
              <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:18}}>Be specific — the more detail you share, the more tailored your support will be.</p>
              <textarea
                className="journal-textarea"
                style={{marginBottom:18}}
                placeholder={`e.g. I bombed today's ${exam} mock test and I keep thinking about how far behind I am compared to my friends...`}
                value={journal}
                onChange={e=>setJournal(e.target.value)}
              />
              <button className="btn-primary" onClick={handleSubmit} disabled={!mood||!journal.trim()||isLoading} style={{width:'auto',minWidth:180}}>
                {isLoading
                  ? <><Sparkles size={16} style={{animation:'pulse-soft 1.5s infinite'}}/> Reading your entry...</>
                  : <><Sparkles size={16}/> Get Support</>
                }
              </button>
            </div>

            {/* Skeleton */}
            {isLoading && (
              <div className="card animate-pulse-soft" style={{padding:'28px 32px'}}>
                <div style={{display:'flex',gap:14,marginBottom:20}}>
                  <div style={{width:42,height:42,borderRadius:'50%'}} className="animate-shimmer"/>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:8,paddingTop:4}}>
                    <div style={{height:14,borderRadius:7,width:'40%'}} className="animate-shimmer"/>
                    <div style={{height:12,borderRadius:6,width:'60%'}} className="animate-shimmer"/>
                  </div>
                </div>
                {[1,2,3].map(i=>(
                  <div key={i} style={{display:'flex',gap:12,marginBottom:16}}>
                    <div style={{width:36,height:36,borderRadius:10,flexShrink:0}} className="animate-shimmer"/>
                    <div style={{flex:1,display:'flex',flexDirection:'column',gap:7,paddingTop:4}}>
                      <div style={{height:12,borderRadius:6}} className="animate-shimmer"/>
                      <div style={{height:12,borderRadius:6,width:'75%'}} className="animate-shimmer"/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Response */}
            {aiResponse && (
              <div className="result-card animate-slide-up">
                <div className="result-header" style={aiResponse.detected_trigger==='severe distress'?{background:'linear-gradient(135deg,#c49a52,#d4b06a)'}:{}}>
                  <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',opacity:0.85,display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                    <Sparkles size={13}/> Insights for you
                  </div>
                  <h3 style={{fontSize:20,fontWeight:800,lineHeight:1.25}}>Trigger: {aiResponse.detected_trigger}</h3>
                </div>
                <div>
                  {[
                    {icon:<Heart size={17}/>,bg:'var(--rose-bg)',color:'var(--rose)',label:"You're heard",text:aiResponse.validation},
                    {icon:<Wind size={17}/>,bg:'var(--accent-bg)',color:'var(--accent)',label:'Action (under 5 mins)',text:aiResponse.coping_action,bold:true},
                    {icon:<Lightbulb size={17}/>,bg:'var(--sage-light)',color:'var(--accent-dark)',label:'Why this helps',text:aiResponse.why_this_helps,small:true},
                    {icon:<Sparkles size={17}/>,bg:'var(--amber-bg)',color:'var(--amber)',label:'',text:`"${aiResponse.encouragement}"`,italic:true},
                  ].map((row,i)=>(
                    <div key={i} className="result-row">
                      <div className="result-icon" style={{background:row.bg,color:row.color}}>{row.icon}</div>
                      <div style={{paddingTop:2}}>
                        {row.label && <p style={{fontSize:12,fontWeight:700,color:'var(--text-muted)',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>{row.label}</p>}
                        <p style={{fontSize:row.small?14:15,lineHeight:1.65,fontWeight:row.bold?700:row.italic?700:400,fontStyle:row.italic?'italic':'normal'}}>{row.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Voice CTA for low mood */}
                {(mood === 1 || mood === 2) && (
                  <div style={{padding:'20px 28px',background:'var(--bg-input)',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <p style={{fontSize:15,fontWeight:800,marginBottom:2}}>You seem really stressed.</p>
                      <p style={{fontSize:14,color:'var(--text-secondary)'}}>Would you like to talk it out with Sahay?</p>
                    </div>
                    <button className="btn-primary" onClick={openVoiceSession} style={{padding:'10px 18px',fontSize:14}}>
                      <Mic size={15}/> Voice Call
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Weekly Trend Chart (Moved to Main Dashboard) */}
            <div className="card" style={{padding:'32px 36px',marginTop:24}}>
              <h2 style={{fontSize:18,fontWeight:800,marginBottom:6}}>Your week at a glance</h2>
              <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:28}}>Stress points and mood logged over the last 7 days (1 = awful, 5 = great)</p>
              <div style={{height:280}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodHistory} margin={{top:5,right:10,left:-15,bottom:0}}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.28}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:13,fill:'var(--text-muted)'}} dy={8}/>
                    <YAxis domain={[1,5]} ticks={[1,2,3,4,5]} axisLine={false} tickLine={false} tick={{fontSize:12,fill:'var(--text-muted)'}}/>
                    <Tooltip contentStyle={{borderRadius:12,border:'none',boxShadow:'var(--shadow-md)',fontFamily:'Nunito'}}/>
                    <Area type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={3} fill="url(#cg)" animationDuration={1400}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Text Chat Overlay */}
      {isChatOpen && (
        <>
          <div className="chat-overlay" onClick={()=>setIsChatOpen(false)}/>
          <div className="chat-panel">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)'}}>
                  <Sparkles size={17}/>
                </div>
                <div>
                  <p style={{fontWeight:800,fontSize:14,lineHeight:1.2}}>Talk it out</p>
                  <p style={{fontSize:12,color:'var(--text-muted)'}}>Sahay is here to listen</p>
                </div>
              </div>
              <button onClick={()=>setIsChatOpen(false)} style={{width:32,height:32,borderRadius:'50%',border:'none',background:'var(--bg-input)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)'}}>
                <X size={16}/>
              </button>
            </div>
            <div className="chat-msgs">
              {chatMessages.map((m,i)=>(
                <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
              ))}
              {isChatLoading && (
                <div className="chat-bubble ai" style={{display:'flex',gap:5,alignItems:'center'}}>
                  {[0,150,300].map(d=>(
                    <span key={d} style={{width:8,height:8,borderRadius:'50%',background:'var(--text-muted)',display:'block',animation:`pulse-soft 1.6s ease ${d}ms infinite`}}/>
                  ))}
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <div className="chat-input-bar">
              <input className="chat-input" placeholder="Type a message..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendChat()}/>
              <button className="chat-send" onClick={handleSendChat} disabled={!chatInput.trim()||isChatLoading}>
                <Send size={17} style={{marginLeft:2}}/>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Voice Chat Modal */}
      {isVoiceOpen && (
        <div className="voice-modal">
          <button onClick={closeVoiceSession} style={{position:'absolute',top:32,right:32,background:'var(--bg-input)',border:'none',width:48,height:48,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-muted)'}}>
            <X size={24}/>
          </button>
          
          <h2 style={{fontSize:32,fontWeight:800,marginBottom:12,letterSpacing:'-0.02em'}}>Voice Call with Sahay</h2>
          <p style={{color:'var(--text-secondary)',fontSize:16,marginBottom:80}}>
            {isSpeaking ? "Sahay is speaking..." : isListening ? "Listening... Speak now." : "Press the mic to talk"}
          </p>
          
          <div className="orb-container">
            <div className={`orb user ${isListening ? 'active' : ''}`}>
              <Mic size={32} />
            </div>
            <div className={`orb ai ${isSpeaking ? 'active' : ''}`}>
              <Sparkles size={32} />
            </div>
          </div>

          {!isListening && !isSpeaking && (
            <button className="btn-primary" onClick={startListening} style={{padding:'16px 32px',fontSize:18,borderRadius:30}}>
              <Mic size={20}/> Tap to Speak
            </button>
          )}
          {isListening && (
            <div style={{padding:'16px 32px',fontSize:18,fontWeight:700,color:'var(--accent)'}}>
              Recording...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
