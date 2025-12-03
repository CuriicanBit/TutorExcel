import { GoogleGenAI } from "@google/genai";
import { LessonTopic } from "../types";

// Helper to ensure API key exists
const getAIClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generates the full lesson content, including examples and a quiz.
 * Uses Search Grounding to find real-world tutorials/videos.
 * @param topic The lesson topic
 * @param reinforcementMode If true, generates simplified content with alternative analogies.
 */
export const generateLessonContent = async (topic: LessonTopic, reinforcementMode: boolean = false) => {
    const ai = getAIClient();
    
    // Base instructions
    let promptInstruction = '';
    
    if (reinforcementMode) {
        promptInstruction = `
            ATENCIÓN: EL ESTUDIANTE NO ENTENDIÓ LA PRIMERA EXPLICACIÓN.
            
            Tu objetivo ahora es SIMPLIFICAR AL MÁXIMO.
            1. Usa analogías cotidianas (ej. cocinar, organizar un armario) para explicar "${topic.title}".
            2. Evita jerga técnica complicada.
            3. Usa un ejemplo de psicología diferente al anterior, quizás algo más cotidiano o clínico simple.
            4. Mantén la estructura pero cambia el tono a "Entrenador personal amigable".
        `;
    } else {
        promptInstruction = `
            Actúa como un profesor universitario de Metodología de la Investigación y Estadística para Psicología.
            Crea una lección (Tutorial de Excel) sobre el tema: "${topic.title}".
        `;
    }

    // Prompt optimizado para español, estructura visual y EJERCICIOS PRÁCTICOS
    const prompt = `
        ${promptInstruction}
        
        Contexto Específico: ${topic.promptContext}
        
        Estructura Obligatoria del Markdown (Respeta estos títulos exactos):
        
        # ${topic.title} ${reinforcementMode ? '(Refuerzo Simplificado)' : ''}
        
        ### 1. Concepto ${reinforcementMode ? 'Explicado Simple' : 'en Investigación'}
        Explica qué es esto y por qué un psicólogo lo necesita.
        
        ### 2. Instrucciones Paso a Paso
        Guía técnica de cómo hacerlo en Excel. Usa viñetas numeradas. Sé muy claro con los menús.
        
        ### 3. Ejemplo Psicológico Real
        Describe un escenario de investigación y cómo se aplica.
        IMPORTANTE: Si requieres mostrar datos, GENERA UNA TABLA MARKDOWN CLARA.
        Usa este formato para las tablas (con pipes |):
        | ID | Variable 1 | Variable 2 |
        |--- | --- | --- |
        | 01 | Dato A | Dato B |
        
        ### 4. Laboratorio de Práctica
        Diseña 3 ejercicios concretos y desafiantes ("Tareas") que el estudiante debe realizar ahora mismo.
        
        IMPORTANTE: 
        - Idioma: ESPAÑOL estricto.
        - Fórmulas: Ponlas siempre en bloques de código, ej: \`=PROMEDIO(A1:B10)\`.
        - Tablas: Asegúrate de alinear las columnas de las tablas markdown.
    `;

    const systemInstruction = "Eres un tutor experto en Excel para ciencias sociales. Tu objetivo es que el estudiante pierda el miedo a los datos y aprenda haciendo.";

    try {
        // Try with Search Grounding first for up-to-date info
        // Note: Reinforcement mode might not need search, but it helps for variety.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: systemInstruction,
            }
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const text = response.text || "No se pudo generar el contenido.";
        
        const videoLinks = groundingChunks
            .filter(chunk => chunk.web?.uri && (chunk.web.uri.includes('youtube') || chunk.web.uri.includes('video')))
            .map(chunk => ({
                title: chunk.web?.title || 'Recurso Relacionado',
                uri: chunk.web?.uri || '#'
            }))
            .slice(0, 3);

        return { markdown: text, videoLinks };

    } catch (error) {
        console.warn("Search grounding failed, falling back to basic generation.", error);
        
        try {
            // Fallback to basic generation without tools
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            
            return { markdown: response.text || "No se pudo generar el contenido.", videoLinks: [] };
        } catch (fallbackError) {
             console.error("Fallback generation failed", fallbackError);
             return { 
                 markdown: `### Lo sentimos\n\nHubo un problema técnico generando esta lección. Por favor intenta recargar la página o selecciona otra lección del menú.\n\nError: ${(fallbackError as any).message || 'Desconocido'}`, 
                 videoLinks: [] 
             };
        }
    }
};

/**
 * Chat with the AI Tutor.
 */
export const chatWithTutor = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
    const ai = getAIClient();
    
    // Updated Persona: Patient, Psychology-focused, Beginner-friendly.
    const systemInstruction = `
        Eres 'PsychoStats Bot', un tutor experto en Excel pero con la paciencia de un maestro de primaria. 
        Tu usuario es un estudiante de PSICOLOGÍA que sabe MUY POCO o NADA de Excel.
        
        Reglas de Oro:
        1. Contexto Psicológico: Tus ejemplos siempre deben tratar sobre pacientes, encuestas, tiempos de reacción o terapias. Evita ejemplos de ventas o finanzas.
        2. Cero Tecnicismos: No hables de "argumentos de función" sin explicar que son los "datos que necesita la fórmula".
        3. Paso a Paso: Explica las cosas como una receta de cocina.
        4. Empatía: Reconoce que Excel puede asustar. Sé alentador.
        5. Idioma: Siempre ESPAÑOL.
    `;

    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash', // Use Flash specifically for speed and free tier reliability
            history: history,
            config: { systemInstruction }
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text;
    } catch (error) {
        console.error("Chat failed", error);
        return "Lo siento, hubo un error de conexión. Intenta preguntar nuevamente.";
    }
};

/**
 * Generates a helpful visualization of a concept using Image Generation.
 * Defaulting to Flash Image for free/fast generation without auth dialogs.
 */
export const generateConceptImage = async (concept: string) => {
    const ai = getAIClient();
    
    const extractImage = (response: any) => {
         for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Ilustración minimalista y moderna estilo 'Corporate Memphis' o vectorial plana sobre: ${concept}, relacionada con análisis de datos, psicología o investigación. Colores suaves: Azules, Verdes menta, Blanco. Sin texto.` }]
            },
        });

        return extractImage(response);
    } catch (error) {
        console.error("Image generation failed", error);
        return null;
    }
};

/**
 * Generates an educational video concept using Veo.
 * NOTE: Often requires paid project. Kept for completeness but UI may hide it.
 */
export const generateConceptVideo = async (topic: string) => {
     const ai = getAIClient();
     
     let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Animación gráfica abstracta y suave que representa el concepto de: ${topic}. Estilo educativo minimalista y limpio.`,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
     });

     while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
     }

     const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
     if (videoUri) {
         return videoUri;
     }
     throw new Error("Video generation failed");
};