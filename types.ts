export enum ModuleLevel {
    BASICS = 'Fundamentos',
    FORMATTING = 'Datos y Formato',
    FORMULAS = 'Fórmulas y Lógica',
    ANALYSIS = 'Análisis de Datos',
    VISUALIZATION = 'Visualización Científica'
}

export interface LessonTopic {
    id: string;
    title: string;
    description: string;
    level: ModuleLevel;
    promptContext: string; // Context to send to Gemini
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    isAudio?: boolean;
    audioData?: string;
}

export interface LessonContent {
    markdown: string;
    videoLinks?: { title: string; uri: string }[];
    quizQuestion?: string;
}

export enum AppView {
    HOME = 'HOME',
    LESSON = 'LESSON',
    CHAT = 'CHAT',
    DICTIONARY = 'DICTIONARY',
    VISUALIZER = 'VISUALIZER'
}

export interface ExcelFunction {
    name: string;
    syntax: string;
    description: string;
    psychExample: string;
    category: 'Estadística' | 'Lógica' | 'Búsqueda' | 'Matemática';
}

export type LessonStatus = 'completed' | 'reinforcement' | 'review' | 'none';

export interface UserProgress {
    [lessonId: string]: LessonStatus;
}