import React, { useState, useEffect } from 'react';
import { LessonTopic, LessonStatus, ExcelPlatform } from '../types';
import { generateLessonContent, generateConceptImage } from '../services/geminiService';

interface LessonViewProps {
    lesson: LessonTopic;
    onStatusChange: (status: LessonStatus) => void;
    currentStatus: LessonStatus;
    platform: ExcelPlatform | null;
    setPlatform: (p: ExcelPlatform) => void;
}

// Table Renderer Component to look like Excel
const ExcelTableRenderer: React.FC<{ markdownTable: string }> = ({ markdownTable }) => {
    const rows = markdownTable.trim().split('\n').map(row => 
        row.split('|')
           .filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1) // Remove leading/trailing empty splits caused by pipes
           .map(cell => cell.trim())
    ).filter(row => row.length > 0);

    if (rows.length < 2) return null;

    // Filter out the separator line (e.g. ---|---|---)
    const dataRows = rows.filter(row => !row[0].match(/^[-:]+$/));
    const header = rows[0];

    return (
        <div className="my-6 overflow-x-auto rounded-lg border border-slate-300 shadow-sm bg-white">
            <div className="bg-slate-50 border-b border-slate-200 px-2 py-1 text-xs text-slate-400 font-mono">
                Vista de Datos (Ejemplo)
            </div>
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-xs">
                    <tr>
                        <th className="border border-slate-300 px-4 py-2 w-10 text-center bg-slate-200 text-slate-500">#</th>
                        {header.map((col, idx) => (
                            <th key={idx} className="border border-slate-300 px-4 py-2 min-w-[100px] tracking-wider">
                                {String.fromCharCode(65 + idx)} <span className="block font-normal text-slate-500 normal-case mt-0.5">{col}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {dataRows.slice(1).map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="border border-slate-300 px-2 py-2 text-center bg-slate-50 font-mono text-xs text-slate-500">
                                {rowIdx + 1}
                            </td>
                            {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="border border-slate-300 px-4 py-2 font-mono text-slate-700 bg-white">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Custom Markdown Renderer to make text look beautiful and styled
const RichTextRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;

    // Split content specifically to handle Tables as blocks
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    let tableBuffer: string[] = [];
    let inTable = false;
    let inList = false;
    let inTasksSection = false;

    // Helper to process inline styles
    const processInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-indigo-900 font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                // Excel Formula Style
                return (
                    <span key={i} className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-sm mx-1 shadow-sm break-words">
                        {part.slice(1, -1)}
                    </span>
                );
            }
            return part;
        });
    };

    const flushTable = (keyPrefix: string) => {
        if (tableBuffer.length > 0) {
            elements.push(<ExcelTableRenderer key={`${keyPrefix}-table`} markdownTable={tableBuffer.join('\n')} />);
            tableBuffer = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const key = `line-${i}`;

        // TABLE DETECTION
        if (trimmed.startsWith('|')) {
            inTable = true;
            tableBuffer.push(line);
            continue; // Skip normal processing
        } else {
            if (inTable) {
                inTable = false;
                flushTable(key);
            }
        }

        if (trimmed === '') {
            inList = false;
            continue;
        }

        // HEADERS
        if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
            inList = false;
            const text = trimmed.replace(/^#+\s*/, '');
            
            if (text.toLowerCase().includes('laboratorio') || text.toLowerCase().includes('práctica') || text.toLowerCase().includes('tarea')) {
                inTasksSection = true;
                elements.push(
                    <div key={`${key}-task-header`} className="mt-10 mb-6 flex items-center">
                         <div className="bg-amber-100 text-amber-600 p-2 rounded-lg mr-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                         </div>
                         <h3 className="text-2xl font-bold text-slate-800">{processInline(text)}</h3>
                    </div>
                );
            } else {
                inTasksSection = false;
                elements.push(
                    <h3 key={key} className="text-xl md:text-2xl font-bold text-slate-800 mt-10 mb-4 border-b border-indigo-100 pb-2">
                        {processInline(text)}
                    </h3>
                );
            }
        }
        // LISTS
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const text = trimmed.replace(/^[-*]\s*/, '');
            if (!inList) inList = true;
            
            if (inTasksSection) {
                elements.push(
                    <div key={key} className="flex items-start mb-4 p-4 bg-amber-50 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                         <div className="mt-1 mr-3">
                             <input type="checkbox" className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer" />
                         </div>
                         <div className="text-slate-800 font-medium leading-relaxed group-hover:text-amber-900">{processInline(text.replace('[ ]', '').replace('**', '').replace('**', ''))}</div>
                    </div>
                );
            } else {
                elements.push(
                    <div key={key} className="flex items-start mb-3 ml-2 md:ml-4">
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mt-2 mr-3 shrink-0"></span>
                        <p className="text-slate-700 leading-relaxed">{processInline(text)}</p>
                    </div>
                );
            }
        }
        // NUMBERED LISTS
        else if (/^\d+\./.test(trimmed)) {
             const text = trimmed.replace(/^\d+\.\s*/, '');
             elements.push(
                <div key={key} className="flex items-start mb-4 ml-2 md:ml-4">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mr-3 shrink-0 mt-0.5">
                        {trimmed.split('.')[0]}
                    </span>
                    <p className="text-slate-700 leading-relaxed">{processInline(text)}</p>
                </div>
            );
        }
        // PARAGRAPHS
        else if (!trimmed.startsWith('#')) {
            inList = false;
            elements.push(
                <p key={key} className="text-slate-600 leading-relaxed mb-4 text-lg">
                    {processInline(trimmed)}
                </p>
            );
        }
    }

    // Flush remaining table buffer if any
    flushTable('end');

    return <div className="space-y-1">{elements}</div>;
};

const LessonView: React.FC<LessonViewProps> = ({ lesson, onStatusChange, currentStatus, platform, setPlatform }) => {
    const [content, setContent] = useState<string | null>(null);
    const [videoLinks, setVideoLinks] = useState<{title: string, uri: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const [reinforcementLoading, setReinforcementLoading] = useState(false);
    
    // Image specific state
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);

    // Initial Load - Depend on platform being set
    useEffect(() => {
        // If no platform is selected yet, do NOT load content. Wait for user selection.
        if (!platform) {
            setContent(null);
            return;
        }

        let isMounted = true;
        
        const loadLessonContent = async () => {
            setLoading(true);
            setContent(null);
            setVideoLinks([]);
            try {
                // Pass platform to generation service
                const data = await generateLessonContent(lesson, false, platform);
                if (isMounted) {
                    setContent(data.markdown);
                    setVideoLinks(data.videoLinks || []);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setContent("Hubo un error cargando el contenido.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadLessonContent();
        
        return () => { isMounted = false; };
    }, [lesson, platform]); // Reload when platform changes or lesson changes

    // Image Load - Only on lesson change
    useEffect(() => {
        // We can load the image even if platform isn't selected yet, as it's generic concept art
        let isMounted = true;
        const loadImage = async () => {
            setGeneratedImage(null);
            setImageLoading(true);
            try {
                const image = await generateConceptImage(lesson.title);
                if (isMounted && image) setGeneratedImage(image);
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setImageLoading(false);
            }
        };
        loadImage();
        return () => { isMounted = false; };
    }, [lesson]); 

    const handleReinforcement = async () => {
        if (!platform) return;
        setReinforcementLoading(true);
        onStatusChange('reinforcement');
        try {
            const data = await generateLessonContent(lesson, true, platform); // True for reinforcement mode
            setContent(data.markdown);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error(err);
        } finally {
            setReinforcementLoading(false);
        }
    };

    // --- RENDER: PLATFORM SELECTION SCREEN (First Time) ---
    if (!platform) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
                <div className="text-center mb-10 max-w-2xl">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">¡Bienvenido al Laboratorio! 🧬</h1>
                    <p className="text-xl text-slate-600">Para darte las instrucciones precisas, necesitamos saber qué herramienta usarás hoy.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
                    {[
                        { id: 'Windows', icon: '💻', label: 'Windows', desc: 'Versión de Escritorio Estándar' },
                        { id: 'Mac', icon: '🍎', label: 'Mac OS', desc: 'Computadoras Apple' },
                        { id: 'Tablet', icon: '📱', label: 'Tablet', desc: 'Android o iPad (App Móvil)' },
                        { id: 'Web', icon: '🌐', label: 'Excel Online', desc: 'Navegador Web (Office 365)' }
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setPlatform(opt.id as ExcelPlatform)}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col items-center text-center"
                        >
                            <span className="text-5xl mb-4 grayscale group-hover:grayscale-0 transition-all">{opt.icon}</span>
                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-700">{opt.label}</h3>
                            <p className="text-sm text-slate-500">{opt.desc}</p>
                        </button>
                    ))}
                </div>
                
                <p className="mt-12 text-slate-400 text-sm">Guardaremos tu elección para la próxima vez.</p>
            </div>
        );
    }

    // --- RENDER: LOADING STATE ---
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="font-medium text-slate-500 text-lg">Preparando tu clase para <span className="text-indigo-600 font-bold">{platform}</span>...</p>
                <p className="text-sm text-slate-400 mt-2">Personalizando menús, atajos y ejemplos...</p>
            </div>
        );
    }

    // --- RENDER: LESSON CONTENT ---
    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header Section */}
            <header className="mb-6 border-b border-slate-200 pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-indigo-600 font-semibold">
                        <span className="bg-indigo-50 px-2 py-0.5 rounded-md uppercase text-xs tracking-wider">{lesson.level}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">ID: {lesson.id}</span>
                        {currentStatus === 'completed' && <span className="text-emerald-600 flex items-center gap-1 ml-2">✓ Completada</span>}
                        {currentStatus === 'reinforcement' && <span className="text-amber-600 flex items-center gap-1 ml-2">⚠️ Refuerzo</span>}
                    </div>

                    {/* Platform Selector (Small) */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        {(['Windows', 'Mac', 'Web', 'Tablet'] as ExcelPlatform[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPlatform(p)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1
                                ${platform === p 
                                    ? 'bg-slate-800 text-white shadow-sm' 
                                    : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {p === 'Windows' && <span>💻</span>}
                                {p === 'Mac' && <span>🍎</span>}
                                {p === 'Web' && <span>🌐</span>}
                                {p === 'Tablet' && <span>📱</span>}
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{lesson.title}</h1>
                <p className="text-xl text-slate-500 font-light">{lesson.description}</p>
            </header>

            {/* Visual Aid */}
            <div className="mb-10 rounded-3xl overflow-hidden shadow-xl shadow-slate-200 border border-slate-100 bg-white relative min-h-[250px] md:min-h-[350px] flex items-center justify-center group">
                {generatedImage ? (
                    <>
                        <img src={generatedImage} alt="Concepto Visual" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
                        <div className="absolute bottom-6 left-6">
                             <span className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-indigo-900 shadow-sm">
                                 Ilustración IA
                             </span>
                        </div>
                    </>
                ) : (
                    // Beautiful Gradient Fallback if image fails or is loading
                    <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-8 text-center text-white">
                        {imageLoading ? (
                             <div className="flex flex-col items-center animate-pulse">
                                 <div className="w-12 h-12 bg-white/20 rounded-full mb-3 backdrop-blur"></div>
                                 <p className="text-white/80 font-medium">Diseñando gráfico explicativo...</p>
                             </div>
                        ) : (
                            // Fallback static design
                            <div className="flex flex-col items-center opacity-90">
                                <span className="text-6xl mb-4 opacity-50">📊</span>
                                <h3 className="text-2xl font-bold mb-2">{lesson.title}</h3>
                                <p className="text-white/80 text-sm max-w-md">Psicología & Datos</p>
                            </div>
                        )}
                        {/* Decorative patterns */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-900/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 min-h-[500px]">
                        <div className="prose prose-slate max-w-none">
                            {content && <RichTextRenderer content={content} />}
                        </div>
                    </div>
                    
                    {/* FEEDBACK ACTIONS */}
                    <div className="mt-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                        <h4 className="text-center text-slate-500 font-medium mb-6 uppercase tracking-wider text-sm">¿Cómo te fue con esta lección?</h4>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => onStatusChange('completed')}
                                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                                ${currentStatus === 'completed' 
                                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500' 
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 shadow-lg shadow-emerald-200'}`}
                            >
                                {currentStatus === 'completed' ? '¡Lección Superada!' : '✅ Entendida'}
                            </button>
                            
                            <button 
                                onClick={handleReinforcement}
                                disabled={reinforcementLoading}
                                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                                ${reinforcementLoading ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-white border-2 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300'}`}
                            >
                                {reinforcementLoading ? 'Reescribiendo...' : '🤔 Requiero Refuerzo'}
                            </button>

                            <button 
                                onClick={() => onStatusChange('review')}
                                className="flex-1 py-4 px-6 rounded-xl font-bold text-lg text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                            >
                                📅 Repasar Luego
                            </button>
                        </div>
                        {currentStatus === 'reinforcement' && !reinforcementLoading && (
                            <p className="text-center text-amber-600 text-sm mt-4">
                                Hemos simplificado el contenido con nuevas analogías. ¡Inténtalo de nuevo!
                            </p>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden shadow-sm">
                        <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2 flex justify-between items-center">
                            Tip Investigador
                             <span className={`h-2 w-2 rounded-full ${generatedImage ? 'bg-emerald-400' : 'bg-orange-300'}`} title={generatedImage ? "Imagen IA generada" : "Imagen de respaldo"}></span>
                        </h3>
                        <p className="text-sm text-emerald-900 leading-relaxed z-10 relative">
                            "Mantén siempre una copia de tus datos 'crudos' (raw data) en una hoja separada antes de empezar a limpiar o calcular. Es tu seguro de vida."
                        </p>
                    </div>

                    {videoLinks.length > 0 && (
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                                Recursos Multimedia
                            </h3>
                            <ul className="space-y-3">
                                {videoLinks.map((link, idx) => (
                                    <li key={idx}>
                                        <a href={link.uri} target="_blank" rel="noopener noreferrer" className="group flex items-start p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
                                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mr-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">{link.title}</span>
                                                <span className="text-xs text-slate-400 mt-1 block">Ver en Web</span>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonView;