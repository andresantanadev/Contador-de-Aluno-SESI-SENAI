// /src/components/ContagemGeral/utils.js

/**
 * Formata um objeto Date para uma string AAAA-MM-DD.
 * USA UTC para evitar erros "off-by-one" de fuso horário.
 */
export const toISODateString = (date) => {
    if (!date || isNaN(date.getTime())) {
        console.error("Tentativa de formatar data inválida:", date);
        // Retorna hoje (baseado em UTC) como fallback
        const today = new Date();
        const year = today.getUTCFullYear();
        const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = today.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Usa os métodos getUTC...() para extrair a data correta, ignorando o fuso local
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // +1 e pad
    const day = date.getUTCDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

/**
 * Converte uma string AAAA-MM-DD para um objeto Date à meia-noite UTC.
 * Esta é a forma correta de ler uma string de data sem fuso horário.
 */
export const parseISODateAsUTC = (isoString) => {
    try {
        const [year, month, day] = isoString.split('-').map(Number);
        // Cria um objeto Date representando meia-noite UTC daquele dia
        return new Date(Date.UTC(year, month - 1, day));
    } catch (e) {
        console.error("Erro ao parsear data UTC:", isoString, e);
        return new Date(0); // Retorna 1970 em erro
    }
};

/**
 * Lista de meses para filtros e relatórios.
 */
export const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Formata uma string de data (AAAA-MM-DD) para um formato legível (ex: 06 de novembro de 2025).
 * USA UTC para garantir que a data correta seja exibida.
 */
export const formatFriendlyDate = (dateString) => {
    try {
        // Usa nosso parser UTC
        const date = parseISODateAsUTC(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC' // <-- Força a formatação em UTC
        });
    } catch (e) {
        return dateString;
    }
};

/**
 * Formata uma string de data/hora (ISO) para um horário legível.
 */
export const formatFriendlyTime = (dateTimeString) => {
     try {
        const date = new Date(dateTimeString);
         return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
            // Deixa o fuso horário local aqui, pois a hora da contagem NES é relevante
        });
    } catch (e) {
        return 'Inválido';
    }
};