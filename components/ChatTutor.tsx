import React, { useState, useRef, useEffect } from 'react';
import { chatWithTutor } from '../services/geminiService';

const ChatTutor: React.FC = () => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
        { role: 'model', text: '¡Hola! Soy tu tutor de PsychoStats. Entiendo que Excel puede parecer intimidante al principio, pero iremos paso a paso. ¿En qué puedo ayudarte hoy con tus datos?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

        try {
            // Convert history format
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const response = await chatWithTutor(history, userMsg);
            setMessages(prev => [...prev, { role: 'model', text: response || "Lo siento, no pude generar una respuesta." }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, tuve un problema conectando con el servidor.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-40px)] flex flex-col max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    </div>
                    <div>
                        <h2 className="font-bold">Chat Tutor</h2>
                        <p className="text-xs text-indigo-200">Ayuda paciente para principiantes</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm border
                            ${msg.role === 'user' 
                                ? 'bg-indigo-600 text-white border-indigo-600 rounded-br-none' 
                                : 'bg-white text-slate-900 border-slate-200 rounded-bl-none'}`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border border-slate-100 shadow-sm flex space-x-2">
                             <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                             <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe tu pregunta aquí..."
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-indigo-600 focus:ring-0 outline-none transition-all font-medium"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className={`p-3 rounded-xl text-white transition-all shadow-md
                            ${loading || !input.trim() ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatTutor;
