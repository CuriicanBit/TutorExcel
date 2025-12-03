import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import LessonView from './components/LessonView';
import ChatTutor from './components/ChatTutor';
import FunctionDictionary from './components/FunctionDictionary';
import Visualizer from './components/Visualizer';
import { AppView, LessonTopic, UserProgress, LessonStatus, ExcelPlatform } from './types';
import { CURRICULUM } from './constants';

const App: React.FC = () => {
    // Default to the first lesson
    const [currentView, setCurrentView] = useState<AppView>(AppView.LESSON);
    const [currentLesson, setCurrentLesson] = useState<LessonTopic>(CURRICULUM[0]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // PERSISTENT STATE: Progress
    const [progress, setProgress] = useState<UserProgress>(() => {
        try {
            const saved = localStorage.getItem('psycho_progress');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    // PERSISTENT STATE: Platform Preference
    // Initialize as null if not found to force selection on first visit
    const [platform, setPlatform] = useState<ExcelPlatform | null>(() => {
        return localStorage.getItem('psycho_platform') as ExcelPlatform || null;
    });

    // Save Progress to LocalStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('psycho_progress', JSON.stringify(progress));
    }, [progress]);

    // Save Platform to LocalStorage whenever it changes
    useEffect(() => {
        if (platform) {
            localStorage.setItem('psycho_platform', platform);
        }
    }, [platform]);

    const handleSelectLesson = (lesson: LessonTopic) => {
        setCurrentLesson(lesson);
        setCurrentView(AppView.LESSON);
        setIsMenuOpen(false); // Close menu on mobile
    };

    const handleViewChange = (view: AppView) => {
        setCurrentView(view);
        setIsMenuOpen(false);
    }

    const handleUpdateProgress = (lessonId: string, status: LessonStatus) => {
        setProgress(prev => ({
            ...prev,
            [lessonId]: status
        }));
    };

    return (
        <div className="flex h-screen w-full bg-slate-50">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 shadow-sm">
                <span className="font-bold text-lg text-slate-800">PsychoStats</span>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-slate-800/50 z-40" onClick={() => setIsMenuOpen(false)}>
                    <div className="absolute top-16 left-0 w-64 h-full bg-white shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
                         <Navigation 
                            currentView={currentView}
                            currentLessonId={currentLesson.id}
                            onSelectLesson={handleSelectLesson}
                            onChangeView={handleViewChange}
                            progress={progress}
                        />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <Navigation 
                currentView={currentView}
                currentLessonId={currentLesson.id}
                onSelectLesson={handleSelectLesson}
                onChangeView={handleViewChange}
                progress={progress}
            />

            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-y-auto pt-20 md:pt-6 px-4 md:px-8 bg-slate-50 scroll-smooth">
                {currentView === AppView.LESSON && (
                    <LessonView 
                        lesson={currentLesson} 
                        onStatusChange={(status) => handleUpdateProgress(currentLesson.id, status)}
                        currentStatus={progress[currentLesson.id] || 'none'}
                        platform={platform}
                        setPlatform={setPlatform}
                    />
                )}
                
                {currentView === AppView.CHAT && (
                    <div className="pt-4 h-full">
                        <ChatTutor />
                    </div>
                )}

                {currentView === AppView.DICTIONARY && (
                    <div className="pt-6">
                        <FunctionDictionary />
                    </div>
                )}

                {currentView === AppView.VISUALIZER && (
                    <Visualizer />
                )}
            </main>
        </div>
    );
};

export default App;