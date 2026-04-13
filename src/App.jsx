import { useState, useEffect, useRef } from 'react';
import { Upload, Camera, Sparkles, CheckCircle2, RefreshCw, Wand2, KeyRound, Loader2, ArrowRight, MessageCircle, X, Send } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './App.css';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

function App() {
  // Main App State
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [view, setView] = useState(apiKey ? 'home' : 'settings'); // 'settings', 'home', 'processing', 'result'
  
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [processingStatus, setProcessingStatus] = useState('');
  const [errorStatus, setErrorStatus] = useState('');
  
  const [designAdvice, setDesignAdvice] = useState([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

  // Chat Widget State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI Interior Design Assistant. How can I help you design your dream room today?" }
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  // Main UI Functions
  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setView('home');
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setView('settings');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setView('processing');
      processImageWithGemini(file);
    }
  };

  const handleStartOver = () => {
    setView('home');
    setSelectedImage(null);
    setErrorStatus('');
    setGeneratedImageUrl('');
  };

  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }

  const processImageWithGemini = async (file) => {
    try {
      setErrorStatus('');
      setProcessingStatus('Connecting to Gemini AI...');
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      setProcessingStatus('Analyzing room structure...');
      const imagePart = await fileToGenerativePart(file);
      
      const promptText = `
        You are an expert AI interior designer. Analyze the uploaded photo of a room.
        Create a gorgeous new interior design plan adding beautiful flower pots, stunning picture frames, and neatly arranging a modern bed and wardrobe.
        Respond STRICTLY with a valid JSON format (no markdown code blocks, just raw JSON) containing:
        {
          "prompt": "A highly detailed, intricate, ultra-realistic aesthetic image generation prompt describing the final newly redesigned room. Make sure it includes flower pots, picture frames on walls, neat bed, and a stylish wardrobe. No people. Cozy modern lighting.",
          "advice": ["Sentence 1 about what you added/changed", "Sentence 2", "Sentence 3"]
        }
      `;

      setProcessingStatus('Generating design ideas...');
      const result = await model.generateContent([promptText, imagePart]);
      const text = result.response.text();
      
      const cleanJsonStr = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsedData = JSON.parse(cleanJsonStr);

      if (parsedData.prompt && parsedData.advice) {
        setProcessingStatus('Creating visual render...');
        setDesignAdvice(parsedData.advice);
        
        const safePrompt = encodeURIComponent(parsedData.prompt);
        const renderUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=800&height=1000&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
        
        setGeneratedImageUrl(renderUrl);
        setView('result');
      } else {
        throw new Error("Invalid format received from AI.");
      }

    } catch (err) {
      console.error(err);
      setErrorStatus('Failed to process image. Please check your API key and try again.');
      setProcessingStatus('');
    }
  };

  // Chat Functions
  const handleChatSubmit = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsChatLoading(true);

    try {
      // Map 'assistant' to model role dynamically for OpenRouter API
      const apiMessages = [
        { role: 'system', content: 'You are an expert AI interior design assistant for the RoomAI app. Be helpful, concise, and friendly. Answer questions about home decor, furniture, color palettes, and room layout.' },
        ...newMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-oss-120b",
          messages: apiMessages,
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        setMessages([...newMessages, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages([...newMessages, { role: 'assistant', content: "Oops, I had trouble connecting. Could you try asking that again?" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="header-title flex-center gap-2" style={{ margin: 0 }}>
          <Wand2 size={24} /> RoomAI
        </h1>
        {view !== 'settings' && (
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={clearApiKey}>
            <KeyRound size={14} /> Reset Key
          </button>
        )}
      </header>

      <main className="main-content">
        {view === 'settings' && (
          <div className="hero-section animate-fade-in">
            <div className="flex-center" style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
              <KeyRound size={48} />
            </div>
            <h2>Setup Gemini API Mode</h2>
            <p style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
              To enable real AI processing, please provide your Google Gemini API Key. It will be stored locally on your device.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none' }}
              />
              <summary style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Get it free from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{color: 'var(--primary)'}}>Google AI Studio</a>.
              </summary>
            </div>

            <button className="btn btn-primary btn-block" onClick={saveApiKey} disabled={!apiKey.trim()}>
              Save & Start <ArrowRight size={20} />
            </button>
          </div>
        )}

        {view === 'home' && (
          <div className="hero-section animate-fade-in">
            <h2>Design Your Dream Room</h2>
            <p style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
              Upload a photo of your empty or messy room and let Gemini AI intelligently design and render a beautiful space.
            </p>

            <div className="upload-area">
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              <div className="flex-col flex-center">
                <Upload size={48} className="upload-icon" />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Upload Photo</h3>
                <p>Tap here to select an image from your gallery</p>
              </div>
            </div>

            <div className="flex-center" style={{ marginTop: '1.5rem', gap: '1rem', color: 'var(--text-muted)' }}>
              <span>or</span>
            </div>

            <button className="btn btn-secondary btn-block" style={{ marginTop: '1.5rem' }}>
              <Camera size={20} />
              Open Camera
            </button>
          </div>
        )}

        {view === 'processing' && (
          <div className="processing-container animate-fade-in">
            <div className="scanner-box">
              <img src={selectedImage} alt="Scanning room" />
              <div className="scanner-line"></div>
            </div>
            
            <h2 style={{ marginBottom: '1rem' }}>AI is Working...</h2>
            
            {errorStatus ? (
              <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                <p>{errorStatus}</p>
                <button className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }} onClick={handleStartOver}>
                  Try Again
                </button>
              </div>
            ) : (
              <div className="step active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Loader2 size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>{processingStatus}</span>
                <style>{`
                  @keyframes spin { 100% { transform: rotate(360deg); } }
                `}</style>
              </div>
            )}
          </div>
        )}

        {view === 'result' && (
          <div className="result-container animate-fade-in">
             <h2 style={{ marginBottom: '0.25rem' }}>Your New Room</h2>
             <p style={{ marginBottom: '1rem' }}>Designed by Gemini AI.</p>

             <div className="glass-panel" style={{ padding: '0.5rem', marginBottom: '1.5rem' }}>
                <div className="image-comparison" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb' }}>
                  {!generatedImageUrl ? (
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  ) : (
                    <>
                      <div className="badge">AI Render</div>
                      <img src={generatedImageUrl} alt="Designed Room" />
                    </>
                  )}
                </div>
             </div>

             <div className="design-details">
               <h3>Gemini's Design Choices</h3>
               <ul>
                 {designAdvice.map((advice, idx) => (
                   <li key={idx}><CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }}/> <span>{advice}</span></li>
                 ))}
               </ul>
             </div>

             <div className="action-buttons">
               <button className="btn btn-primary btn-block">
                 Save Design
               </button>
               <button className="btn btn-secondary btn-block" onClick={handleStartOver}>
                 <RefreshCw size={20} /> Try Another Photo
               </button>
             </div>
          </div>
        )}
      </main>

      {/* Floating Chat Widget */}
      <button className="chat-fab" onClick={() => setIsChatOpen(!isChatOpen)}>
        {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isChatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={18} /> Design Assistant
            </span>
            <button className="chat-close-btn" onClick={() => setIsChatOpen(false)}>
              <X size={18} />
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                {msg.content}
              </div>
            ))}
            {isChatLoading && (
              <div className="chat-loading">Typing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleChatSubmit}>
            <input 
              type="text" 
              className="chat-input"
              placeholder="Ask for design tips..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatLoading}
            />
            <button type="submit" className="chat-send-btn" disabled={!chatInput.trim() || isChatLoading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
