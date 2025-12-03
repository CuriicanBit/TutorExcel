import React, { useState, useMemo } from 'react';
import { PSYCHO_FUNCTIONS } from '../constants';

const FunctionDictionary: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFunctions = useMemo(() => {
        return PSYCHO_FUNCTIONS.filter(func => 
            func.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            func.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            func.psychExample.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <header className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
                    <span className="text-3xl">📚</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Diccionario de Funciones</h1>
                <p className="text-slate-500 max-w-lg mx-auto">Referencia rápida de las herramientas esenciales para el análisis de datos psicológicos.</p>
            </header>

            <div className="mb-8 max-w-xl mx-auto relative">
                <input 
                    type="text"
                    placeholder="Buscar función (ej. Promedio, Correlación)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg"
                />
                <svg className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            <div className="grid gap-6">
                {filteredFunctions.length > 0 ? (
                    filteredFunctions.map((func) => (
                        <div key={func.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold text-slate-800 font-mono">{func.name}</h3>
                                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">{func.category}</span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-600 mb-2 overflow-x-auto whitespace-nowrap">
                                    {func.syntax}
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{func.description}</p>
                            </div>
                            
                            <div className="md:w-2/3">
                                <h4 className="text-sm font-bold text-emerald-700 mb-2 flex items-center">
                                    <span className="mr-2">🧠</span> Uso en Psicología
                                </h4>
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                    <p className="text-slate-800 text-sm italic">"{func.psychExample}"</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 text-slate-400">
                        <p>No encontramos funciones que coincidan con "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FunctionDictionary;