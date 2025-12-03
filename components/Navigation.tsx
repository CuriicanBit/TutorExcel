import React from 'react';
import { CURRICULUM } from '../constants';
import { LessonTopic, AppView, ModuleLevel, UserProgress } from '../types';

interface NavigationProps {
    currentView: AppView;
    currentLessonId: string | null;
    onSelectLesson: (lesson: LessonTopic) => void;
    onChangeView: (view: AppView) => void;
    progress?: UserProgress;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, currentLessonId, onSelectLesson, onChangeView, progress = {} }) => {
    
    const renderLevel = (level: ModuleLevel, color: string) => {
        const lessons = CURRICULUM.filter(l => l.level === level);
        if (lessons.length === 0) return null;
        
        return (
            <div className="mb-6">
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${color} ml-2 border-b border-slate-100 pb-1`}>{level}</h3>
                <div className="space-y-1">
                    {lessons.map(lesson => {
                        const status = progress[lesson.id];
                        const isCompleted = status === 'completed';
                        const isReinforcement = status === 'reinforcement';
                        
                        return (
                            <button
                                key={lesson.id}
                                onClick={() => onSelectLesson(lesson)}
                                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center group relative
                                    ${currentLessonId === lesson.id && currentView === AppView.LESSON
                                        ? 'bg-white shadow-sm ring-1 ring-slate-200 text-indigo-700 font-medium' 
                                        : 'hover:bg-slate-100 text-slate-600'}`}
                            >
                                <div className="relative mr-3 shrink-0">
                                    <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors
                                        ${isCompleted ? 'bg-emerald-500 text-white' : 
                                          isReinforcement ? 'bg-amber-100 text-amber-600' :
                                          currentLessonId === lesson.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500 group-hover:bg-white group-hover:text-indigo-600'}`}>
                                        {isCompleted ? '✓' : lesson.id}
                                    </span>
                                </div>
                                <span className="text-sm truncate">{lesson.title}</span>
                                
                                {status === 'review' && (
                                    <span className="absolute right-2 w-2 h-2 rounded-full bg-amber-400"></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="w-80 h-full bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 flex-shrink-0 hidden md:block no-scrollbar">
            <div className="mb-8 px-2 pt-2">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">Ψ</div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">PsychoStats</h1>
                </div>
                <p className="text-xs text-slate-500 font-medium ml-10">Herramientas para Investigación</p>
            </div>

            <div className="mb-8 space-y-2">
                 <button
                    onClick={() => onChangeView(AppView.CHAT)}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center font-medium transition-all border
                    ${currentView === AppView.CHAT 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                >
                    <span className="mr-3 text-lg">🤖</span>
                    Tutor Inteligente
                </button>
                
                <button
                    onClick={() => onChangeView(AppView.DICTIONARY)}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center font-medium transition-all border
                    ${currentView === AppView.DICTIONARY
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'}`}
                >
                    <span className="mr-3 text-lg">📚</span>
                    Diccionario de Funciones
                </button>
            </div>

            <div className="space-y-4">
                {renderLevel(ModuleLevel.BASICS, 'text-slate-500')}
                {renderLevel(ModuleLevel.FORMATTING, 'text-teal-600')}
                {renderLevel(ModuleLevel.FORMULAS, 'text-blue-600')}
                {renderLevel(ModuleLevel.ANALYSIS, 'text-indigo-600')}
                {renderLevel(ModuleLevel.VISUALIZATION, 'text-purple-600')}
            </div>
            
            <div className="mt-10 px-4 text-xs text-slate-400 text-center">
                Versión Estudiante 1.1
            </div>
        </div>
    );
};

export default Navigation;