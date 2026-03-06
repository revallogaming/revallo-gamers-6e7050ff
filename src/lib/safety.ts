"use client";

const PROFANITY_LIST = [
  "palavrao1", "palavrao2", "fdp", "viado", "lixo", "verme", 
  "vtnc", "caralho", "porra", "puta", "desgraça", "maldito",
  "macaco", "preto imundo", "escravo" // Example offensive terms to block
];

/**
 * Basic content filter to prevent "trava zap" and common offenses.
 */
export function filterContent(text: string): { 
  cleanText: string; 
  isValid: boolean; 
  error?: string;
} {
  // 1. Check for "Trava Zap" (excessive length or repetitive chars)
  if (text.length > 2000) {
    return { 
      cleanText: text, 
      isValid: false, 
      error: "Mensagem muito longa! (Limite: 2.000 caracteres)" 
    };
  }

  // Check for repetitive characters (common in crash strings)
  const repetitivePattern = /(.)\1{50,}/;
  if (repetitivePattern.test(text)) {
    return {
      cleanText: text,
      isValid: false,
      error: "Sua mensagem contém padrões bloqueados pelo sistema de segurança."
    };
  }

  // 2. Simple Profanity Filter
  let cleanText = text;
  let hasProfanity = false;

  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    if (regex.test(cleanText)) {
      cleanText = cleanText.replace(regex, "****");
      hasProfanity = true;
    }
  });

  return { 
    cleanText, 
    isValid: true,
    error: hasProfanity ? "Mantenha o respeito no chat!" : undefined
  };
}
