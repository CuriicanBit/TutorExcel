import { GoogleGenAI } from "@google/genai";
import { LessonTopic } from "../types";

// Helper to ensure API key exists, compatible with Vercel and local
const getAIClient = (): GoogleGenAI | null => {
    // Check various environment variable patterns to support Vite, Vercel, and standard Node
    const key = process.env.API_KEY || 
                (import.meta as any).env?.VITE_API_KEY || 
                (window as any).VITE_API_KEY;

    if (!key) {
        return null;
    }
    return new GoogleGenAI({ apiKey: key });
};

/**
 * Generates the full lesson content, including examples and a quiz.
 * Uses Search Grounding to find real-world tutorials/videos.
 */
export const generateLessonContent = async (topic: LessonTopic, reinforcementMode: boolean = false) => {
    const ai = getAIClient();

    if (!ai) {
        throw new Error("Falta configurar la API Key de Google Gemini.");
    }
    
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

    } catch (error: any) {
        console.warn("Gemini API failed with tools.", error);
        
        // Error handling helper
        const errorMsg = error.toString();
        if (errorMsg.includes('400') || errorMsg.includes('INVALID_ARGUMENT')) {
            return { markdown: "# Error de Configuración\n\nLa API Key parece ser inválida. Asegúrate de haberla copiado correctamente (sin espacios extra) y que tu proyecto en Google AI Studio esté activo.", videoLinks: [] };
        }

        try {
            // Fallback: Try basic generation without tools if the first error was tools-related
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction }
            });
            
            return { markdown: response.text || "No se pudo generar el contenido.", videoLinks: [] };

        } catch (fallbackError: any) {
             console.error("All API attempts failed.", fallbackError);
             return { 
                 markdown: `# Error de Conexión\n\nNo pudimos conectar con el tutor virtual. \n\n**Posibles causas:**\n1. La API Key no está configurada en Vercel.\n2. La API Key es inválida o expiró.\n3. Problema temporal de red.\n\nError técnico: ${fallbackError.message || fallbackError}`, 
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
    
    if (!ai) {
        return "Error: No se detectó ninguna API Key configurada. Por favor agrega VITE_API_KEY en las variables de entorno.";
    }

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
            model: 'gemini-2.5-flash',
            history: history,
            config: { systemInstruction }
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text;
    } catch (error: any) {
        console.error("Chat failed", error);
        const errorMsg = error.toString();
        
        if (errorMsg.includes('400') || errorMsg.includes('INVALID_ARGUMENT')) {
            return "Error de Llave (API Key): Parece que la clave configurada es inválida. Verifica que no tenga espacios extra o caracteres faltantes.";
        }
        if (errorMsg.includes('403') || errorMsg.includes('PERMISSION_DENIED')) {
            return "Error de Permisos: La clave API es válida pero no tiene permisos. Verifica tu cuenta de Google AI Studio.";
        }

        return "Lo siento, hubo un error de conexión con la IA. Por favor intenta de nuevo en unos segundos.";
    }
};

/**
 * Generates a helpful visualization of a concept using Image Generation.
 */
export const generateConceptImage = async (concept: string) => {
    const ai = getAIClient();
    if (!ai) return null;

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
 */
export const generateConceptVideo = async (topic: string) => {
     const ai = getAIClient();
     if (!ai) throw new Error("API Key required for video");
     
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
