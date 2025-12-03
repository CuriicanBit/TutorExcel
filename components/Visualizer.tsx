import React, { useState } from 'react';
import { generateConceptVideo } from '../services/geminiService';

const Visualizer: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setVideoUrl(null);

        try {
             // For Veo (Video Generation), explicit user consent/key selection is mandatory.
             // We only prompt here because the user explicitly clicked "Create Video".
             if ((window as any).aistudio) {
                 const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                 if (!hasKey) {
                     await (window as any).aistudio.openSelectKey();
                 }
             }

             const uri = await generateConceptVideo(prompt);
             // Append API key to stream
             const finalUrl = `${uri}&key=${process.env.API_KEY}`;
             setVideoUrl(finalUrl);

        } catch (err: any) {
            console.error(err);
            const errorMessage = err.message || JSON.stringify(err);
            
            if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
                 setError("El modelo de video no está disponible en este momento. Puede que no esté habilitado en el proyecto seleccionado.");
            } else if (errorMessage.includes("Permission") || errorMessage.includes("403")) {
                setError("No tienes permisos para generar videos. Por favor verifica tu clave de acceso.");
            } else {
                setError("No se pudo generar el video. Intenta con otro concepto o más tarde.");
            }
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        "Correlación positiva entre estudio y notas",
        "Distribución normal (Campana de Gauss)",
        "Diagrama de dispersión de ansiedad vs edad"
    ];

    return (
        <div className="max-w-2xl mx-auto pt-10 pb-20">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-4">
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Visualizador de Conceptos</h2>
                <p className="text-slate-500 mt-2">Usa IA (Veo) para crear videos cortos que expliquen conceptos abstractos.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">¿Qué concepto estadístico quieres visualizar?</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ej. Desviación Estándar..."
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !prompt}
                        className={`px-6 py-3 rounded-xl font-bold text-white transition-all
                        ${loading || !prompt ? 'bg-slate-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 active:scale-95'}`}
                    >
                        {loading ? 'Generando...' : 'Crear Video'}
                    </button>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                    {suggestions.map(s => (
                        <button 
                            key={s} 
                            onClick={() => setPrompt(s)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                    <p className="font-semibold">⚠️ Ocurrió un error</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {loading && (
                 <div className="mt-10 text-center">
                    <p className="text-slate-500 animate-pulse">Generando video con Veo (esto puede tardar un minuto)...</p>
                    <div className="w-full h-48 bg-slate-100 rounded-2xl mt-4 animate-pulse"></div>
                 </div>
            )}

            {videoUrl && (
                <div className="mt-10">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Resultado:</h3>
                    <div className="rounded-2xl overflow-hidden shadow-2xl ring-4 ring-slate-100">
                        <video 
                            controls 
                            autoPlay 
                            loop 
                            className="w-full bg-black aspect-video"
                            src={videoUrl}
                        />
                    </div>
                </div>
            )}
            
            <div className="mt-8 text-center">
                 <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Nota: Los videos son generados experimentalmente por el modelo Veo. Esta función requiere acceso avanzado y puede no estar disponible en todas las cuentas.
                 </p>
            </div>
        </div>
    );
};

export default Visualizer;