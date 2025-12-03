import { LessonTopic, ModuleLevel, ExcelFunction } from "./types";

export const CURRICULUM: LessonTopic[] = [
    // FUNDAMENTOS
    {
        id: '1.1',
        title: 'El Laboratorio Digital (Interfaz)',
        description: 'Entendiendo el entorno de trabajo: Celdas, Rangos y Libros.',
        level: ModuleLevel.BASICS,
        promptContext: 'Explica la interfaz de Excel como si fuera un laboratorio. La hoja es tu mesa de trabajo. Celdas, Filas (Sujetos), Columnas (Variables).'
    },
    {
        id: '1.2',
        title: 'Ingreso de Datos de Investigación',
        description: 'Cómo digitar datos sin errores para evitar sesgos.',
        level: ModuleLevel.BASICS,
        promptContext: 'Buenas prácticas al ingresar datos manuales de encuestas o tests. Errores comunes (espacios extra, mezclar texto y números). Importancia de un ID único por sujeto.'
    },

    // FORMATO Y TIPOS DE DATOS
    {
        id: '2.1',
        title: 'Tipos de Variables y Formato',
        description: 'Distinguiendo Texto, Números, Fechas y Porcentajes.',
        level: ModuleLevel.FORMATTING,
        promptContext: 'Explica la diferencia entre formato de celda y valor real. Relaciona con tipos de variables en estadística: Nominales (Texto), Escalares (Números), Tiempo (Fechas).'
    },
    {
        id: '2.2',
        title: 'Limpieza y Validación de Datos',
        description: 'Asegurando la calidad de tus datos antes de analizar.',
        level: ModuleLevel.FORMATTING,
        promptContext: 'Uso de "Validación de Datos" para restringir entradas (ej. edad no puede ser negativa). Buscar y Reemplazar para corregir errores de tipeo en respuestas.'
    },

    // FÓRMULAS
    {
        id: '3.1',
        title: 'Sintaxis de Fórmulas y Operadores',
        description: 'El lenguaje de Excel: Sumas, Restas y Paréntesis.',
        level: ModuleLevel.FORMULAS,
        promptContext: 'Cómo empezar una fórmula (=). Operadores básicos (+, -, *, /) para transformar puntajes brutos. El orden de las operaciones.'
    },
    {
        id: '3.2',
        title: 'Referencias Relativas vs Absolutas ($)',
        description: 'El concepto más importante para automatizar cálculos.',
        level: ModuleLevel.FORMULAS,
        promptContext: 'Explica el signo $ (Fijar celdas). Ejemplo: Calcular porcentaje de asistencia donde el total de clases es una celda fija para todos los alumnos.'
    },
    {
        id: '3.3',
        title: 'Lógica Condicional (SI / IF)',
        description: 'Tomando decisiones automáticas con tus datos.',
        level: ModuleLevel.FORMULAS,
        promptContext: 'La función SI (IF). Ejemplo: Crear una columna nueva que diga "Clínico" si el puntaje > 15 o "Control" si es menor.'
    },

    // ANÁLISIS
    {
        id: '4.1',
        title: 'Estadística Descriptiva Básica',
        description: 'Promedios, Mediana y Desviación Estándar.',
        level: ModuleLevel.ANALYSIS,
        promptContext: 'Las funciones PROMEDIO, MEDIANA, DESVEST.M, MAX, MIN. Analizando un set de datos de tiempos de reacción o puntajes de CI.'
    },
    {
        id: '4.2',
        title: 'Correlaciones (Pearson)',
        description: 'Analizando la relación entre dos variables.',
        level: ModuleLevel.ANALYSIS,
        promptContext: 'Función COEF.DE.CORREL. Qué significa una correlación positiva o negativa en psicología (ej. Estrés vs Desempeño).'
    },
    {
        id: '4.3',
        title: 'Tablas Dinámicas (Pivot Tables)',
        description: 'Resumiendo grandes cantidades de datos en segundos.',
        level: ModuleLevel.ANALYSIS,
        promptContext: 'Introducción a Tablas Dinámicas. Agrupar datos por categorías (Género, Grupo etario) y calcular promedios grupales.'
    },

    // VISUALIZACIÓN
    {
        id: '5.1',
        title: 'Histogramas y Distribución',
        description: 'Visualizando la normalidad de tus datos.',
        level: ModuleLevel.VISUALIZATION,
        promptContext: 'Cómo insertar un Histograma. Por qué es importante ver la "Campana" de distribución en variables psicológicas.'
    },
    {
        id: '5.2',
        title: 'Gráficos de Dispersión y Barras',
        description: 'Comunicando tus hallazgos visualmente.',
        level: ModuleLevel.VISUALIZATION,
        promptContext: 'Cuándo usar Dispersión (correlaciones) vs Barras (comparar grupos). Buenas prácticas APA para gráficos (títulos claros, ejes etiquetados).'
    }
];

export const PSYCHO_FUNCTIONS: ExcelFunction[] = [
    {
        name: 'PROMEDIO',
        syntax: '=PROMEDIO(número1; [número2]; ...)',
        description: 'Calcula la media aritmética de los argumentos.',
        category: 'Estadística',
        psychExample: 'Calcular el puntaje promedio de satisfacción vital de un grupo de pacientes.'
    },
    {
        name: 'DESVEST.M',
        syntax: '=DESVEST.M(número1; [número2]; ...)',
        description: 'Calcula la desviación estándar basada en una muestra (no la población total).',
        category: 'Estadística',
        psychExample: 'Ver qué tan dispersos están los tiempos de respuesta en una tarea cognitiva.'
    },
    {
        name: 'MEDIANA',
        syntax: '=MEDIANA(número1; [número2]; ...)',
        description: 'Devuelve el número central de un conjunto de números.',
        category: 'Estadística',
        psychExample: 'Encontrar el ingreso típico en una encuesta socioeconómica (menos sensible a valores extremos que el promedio).'
    },
    {
        name: 'COEF.DE.CORREL',
        syntax: '=COEF.DE.CORREL(matriz1; matriz2)',
        description: 'Devuelve el coeficiente de correlación de Pearson (r) entre dos rangos.',
        category: 'Estadística',
        psychExample: 'Calcular si existe relación entre "Horas de sueño" y "Errores en test de atención".'
    },
    {
        name: 'SI',
        syntax: '=SI(prueba_lógica; valor_si_verdadero; valor_si_falso)',
        description: 'Comprueba si se cumple una condición y devuelve un valor si es VERDADERO y otro si es FALSO.',
        category: 'Lógica',
        psychExample: 'Etiquetar participantes: =SI(B2>=18; "Adulto"; "Menor").'
    },
    {
        name: 'CONTAR.SI',
        syntax: '=CONTAR.SI(rango; criterio)',
        description: 'Cuenta las celdas en el rango que coinciden con la condición dada.',
        category: 'Estadística',
        psychExample: 'Contar cuántos participantes marcaron "Totalmente de acuerdo" en una pregunta.'
    },
    {
        name: 'BUSCARV',
        syntax: '=BUSCARV(valor_buscado; matriz_tabla; ind_columna; [rango])',
        description: 'Busca un valor en la primera columna de una tabla y devuelve un valor en la misma fila.',
        category: 'Búsqueda',
        psychExample: 'Unir dos bases de datos: Buscar el ID del paciente en una tabla maestra para traer su Diagnóstico.'
    },
    {
        name: 'CONCAT',
        syntax: '=CONCAT(texto1; [texto2]; ...)',
        description: 'Combina el texto de varios rangos o cadenas.',
        category: 'Matemática',
        psychExample: 'Crear un código único de sujeto uniendo iniciales y fecha de nacimiento.'
    },
    {
        name: 'PRUEBA.T.N',
        syntax: '=PRUEBA.T.N(matriz1; matriz2; colas; tipo)',
        description: 'Devuelve la probabilidad asociada a una prueba t de Student.',
        category: 'Estadística',
        psychExample: 'Calcular el p-valor para ver si hay diferencia significativa entre Grupo Control y Experimental.'
    }
];
