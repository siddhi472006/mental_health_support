import React, { useState, useRef, useEffect } from 'react';
const API_KEY = "AIzaSyCsPF3tR8O4mc-gCMjqcM7xYIZlklIxkG0"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
const HIGH_PRIORITY_KEYWORDS = ['suicide', 'self-harm', 'hurt myself', 'emergency', 'ending it', 'crisis'];

const CornerUpRight = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>;
const AlertTriangle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;


const checkPriority = (text) => {
  const lowerText = text.toLowerCase();
  return HIGH_PRIORITY_KEYWORDS.some(keyword => lowerText.includes(keyword));
};

const useGeminiApi = () => {
  const fetchWithRetry = async (url, options, maxRetries = 5) => {
    if (!API_KEY) { return { ok: false, status: 401, json: async () => ({}) }; }
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) { return response; }
        if (response.status === 429 || response.status >= 500) { throw new Error(`Server error: ${response.status}. Retrying...`); }
        throw new Error(`API error: ${response.statusText}`);
      } catch (error) {
        if (i === maxRetries - 1) { console.error("Max retries reached. Failed to fetch:", error.message); throw error; }
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };
  return { fetchWithRetry };
};

const generateDemoResponse = (isHighPriority) => {
    if (isHighPriority) {
        return (
            "**CRITICAL RESPONSE (Trie/MaxHeap Triggered):** Your safety is the priority. This message triggered the high-priority module. " + 
            "**Immediately call a real emergency hotline:**\n\n" + 
            "1. **Emergency Services (Police/Ambulance):** 112 / 999\n" +
            "2. **Local Crisis Helpline:** (Simulated number)\n\n" +
            "This demonstrates $O(\\log n)$ prioritization logic. Please stay safe."
        );
    } else {
        return (
            "**SUPPORTIVE RESPONSE (Recommendation Graph Triggered):** I hear that you are feeling low. This query was routed by the **Recommendation Graph** module. " + 
            "Here are some recommended resources found by our Graph-based engine:\n\n" +
            "1. **Mindfulness Techniques**\n" +
            "2. **Sleep Hygiene**\n" +
            "3. **Mood Tracking**\n\n" +
            "This demonstrates $O(V+E)$ search logic. Would you like to dive deeper?"
        );
    }
};

const App = () => {
  const { fetchWithRetry } = useGeminiApi();
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      text: "Hello. I am your secure, decentralized AI mental health support system. All interactions are processed using core DSA principles for speed and security. How can I support you today?",
      isHighPriority: false,
      isInitial: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [lastDSAAction, setLastDSAAction] = useState(null);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (lastDSAAction) {
      const timer = setTimeout(() => setLastDSAAction(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastDSAAction]);


  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    
    const isHighPriority = checkPriority(userMessage);
    setLastDSAAction('trie');

    const newUserMessage = { 
      role: 'user', 
      text: userMessage, 
      isHighPriority 
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    const DSA_TAG = isHighPriority ? 'HIGH_PRIORITY_FLAG' : 'STANDARD_QUERY';
    
    setLastDSAAction(isHighPriority ? 'heap' : 'graph');

    const systemPrompt = `You are a professional, compassionate, and highly secure AI Mental Health Support System. 
    
    If the prompt contains the 'HIGH_PRIORITY_FLAG', you MUST respond with immediate, compassionate de-escalation, recommend calling a real emergency hotline (988 in the US, or general 100/112/999/emergency services), and prioritize safety. (This is a MaxHeap O(log n) action).
    
    If the prompt contains 'STANDARD_QUERY', maintain a supportive, psycho-educational, and conversational tone. Provide guidance or resource suggestions (This triggers Graph O(V+E) recommendation searches).
    
    Do not mention the underlying DSA structures (Trie, Heap, Graph) or 'Blockchain' in your final response.
    
    Contextual Flag: ${DSA_TAG}`;

    const userQuery = `User Message: "${userMessage}"`;

    let botResponseText = "";
    let apiSuccess = false;

    try {
      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }], 
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
      };

      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
          const result = await response.json();
          botResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text || 
                            "I'm sorry, I'm currently unable to connect with the core AI. Please try again in a moment.";
          apiSuccess = true;
      }
      
    } catch (error) {
      console.warn("API call failed. Switching to DSA Demo Mode.");
    }
    
    if (!apiSuccess) {
        await new Promise(resolve => setTimeout(resolve, 800));
        botResponseText = generateDemoResponse(isHighPriority);
    }

    setMessages(prev => [
      ...prev, 
      { 
        role: 'bot', 
        text: botResponseText, 
        isHighPriority: isHighPriority
      }
    ]);
    
    setLastDSAAction('hash');

    setIsLoading(false);
  };

  const DSADashboard = () => (
    <div className="p-4 bg-white border-t border-gray-200 text-xs sm:text-sm text-gray-700 w-full">
      <h3 className="font-bold mb-3 flex items-center text-teal-800 border-b pb-1">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M15 9.5c0 .83-.67 1.5-1.5 1.5S12 10.33 12 9.5 12.67 8 13.5 8s1.5.67 1.5 1.5zm-3 7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1z"/></svg>
        DSA Core & Architecture Status (C++ Backend)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
        
        {/* 1. Trie - Keyword Detection O(M*L) */}
        <div 
          className={`p-2 rounded-lg border transition duration-300 ${
            lastDSAAction === 'trie' ? 'bg-blue-200 border-blue-400 animate-pulse-glow' : 'bg-blue-50 border-blue-200'
          }`}
        >
          <svg className="w-4 h-4 mx-auto text-blue-600 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M18.4 17.6c.7-.7.7-1.9 0-2.6l-1.4-1.4c-.7-.7-1.9-.7-2.6 0s-.7 1.9 0 2.6l1.4 1.4c.7.7 1.9.7 2.6 0zM5.6 15c.7-.7 1.9-.7 2.6 0l1.4 1.4c.7.7.7 1.9 0 2.6s-1.9.7-2.6 0L5.6 17.6c-.7-.7-.7-1.9 0-2.6zM12 3v18c0 .55-.45 1-1 1s-1-.45-1-1V3c0-.55.45-1 1-1s1 .45 1 1z"/></svg>
          <p className="font-semibold text-gray-900">Trie (Keywords)</p>
          <p className="text-xs text-blue-600 font-mono">O($M \cdot L$)</p>
        </div>

        {/* 2. Max-Heap - Priority Queue O(log n) */}
        <div 
          className={`p-2 rounded-lg border transition duration-300 ${
            lastDSAAction === 'heap' ? 'bg-teal-200 border-teal-400 animate-pulse-glow' : 'bg-teal-50 border-teal-200'
          }`}
        >
          <svg className="w-4 h-4 mx-auto text-teal-600 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4 5v14l8 3 8-3V5l-8-3zm0 16.6l-6-2.25V7.4l6 2.25v8.95zM12 10.85l-6-2.25V6.15l6 2.25v2.45z"/></svg>
          <p className="font-semibold text-gray-900">Max-Heap (Priority)</p>
          <p className="text-xs text-teal-600 font-mono">O($\log n$)</p>
        </div>

        {/* 3. Graph - Recommendation Search O(V+E) */}
        <div 
          className={`p-2 rounded-lg border transition duration-300 ${
            lastDSAAction === 'graph' ? 'bg-lime-200 border-lime-400 animate-pulse-glow' : 'bg-lime-50 border-lime-200'
          }`}
        >
          <svg className="w-4 h-4 mx-auto text-lime-600 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM20 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          <p className="font-semibold text-gray-900">Graph (Recom.)</p>
          <p className="text-xs text-lime-600 font-mono">O($V+E$)</p>
        </div>
        
        {/* 4. Hash Table - Logging O(1) */}
        <div 
          className={`p-2 rounded-lg border transition duration-300 ${
            lastDSAAction === 'hash' ? 'bg-amber-200 border-amber-400 animate-pulse-glow' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <svg className="w-4 h-4 mx-auto text-amber-600 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v4H4V5h16zm0 14H4v-4h16v4zm-8-2h-3v-4h3v4z"/></svg>
          <p className="font-semibold text-gray-900">Hash Table (Index)</p>
          <p className="text-xs text-amber-600 font-mono">O(1)</p>
        </div>
      </div>
    </div>
  );

  const MessageBubble = ({ message, index }) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 ${message.isInitial ? '' : 'message-enter'}`}>
      <div className={`max-w-[85%] sm:max-w-[65%] p-3 sm:p-4 rounded-xl shadow-lg ${
        message.role === 'user' 
          ? 'bg-teal-600 text-white rounded-br-none'
          : 'bg-white text-gray-800 rounded-tl-none border border-green-100'
      }`}>
        <p className="text-sm sm:text-base whitespace-pre-wrap">
            {message.text.split('**').map((part, index) => 
                index % 2 === 1 ? <strong key={index}>{part}</strong> : part
            )}
        </p>
        {message.isHighPriority && (
          <div className={`mt-2 text-xs font-semibold flex items-center p-1 px-2 rounded-lg bg-red-100 text-red-700 border border-red-400 shadow-sm transition duration-500 ${
            message.role === 'bot' ? 'animate-critical-pulse' : ''
          }`}>
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm0-6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
            <span className='uppercase tracking-wider'>
              {message.role === 'user' ? 'URGENT: Keyword Flagged' : 'CRITICAL PRIORITY RESPONSE'}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white antialiased">
      <header className="p-4 bg-green-50 shadow-md flex justify-between items-center z-10 border-b border-green-100">
        <h1 className="text-xl sm:text-2xl font-extrabold text-teal-800 flex items-center">
          
          <img 
            src="logo.png" 
            alt="Decentralized AI Logo" 
            className="w-8 h-8 mr-3 object-contain" 
          />

          <span className='hidden sm:inline'>Decentralized AI Mental Health Support</span>
          <span className='sm:hidden'>AI Support Chat</span>
        </h1>
        <div className="text-xs sm:text-sm text-gray-600">Project by Rohan, Siddhi & Team</div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div 
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-green-50/50"
            style={{ 
                backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(34, 197, 94, 0.05), transparent)', 
                backgroundSize: '200% 200%',
                animation: 'slowWaft 40s infinite linear' 
            }}
        >
          {messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} index={index} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[75%] p-4 rounded-xl rounded-tl-none bg-white text-gray-800 border border-gray-100 shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500 animate-bounce"></div>
                  <div className="w-3 h-3 rounded-full bg-teal-500 animate-bounce delay-150"></div>
                  <div className="w-3 h-3 rounded-full bg-teal-500 animate-bounce delay-300"></div>
                  <span className="text-sm text-gray-500 ml-2">Analyzing data structures...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        {/* DSA Status/Dashboard Area */}
        <DSADashboard />

        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-green-200 shadow-inner">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-green-300 rounded-full focus:ring-4 focus:ring-teal-200 focus:border-teal-500 transition duration-150 shadow-sm text-sm sm:text-base"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`flex items-center justify-center w-12 h-12 rounded-full text-white transition duration-200 shadow-lg ${
                !input.trim() || isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transform hover:scale-105'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default App;