// Profanity/discrimination filter for nicknames
// Contains common Portuguese and English banned words
const BANNED_WORDS = [
  // Portuguese slurs/profanity
  "puta",
  "putaria",
  "porno",
  "pornô",
  "sexo",
  "sexual",
  "nazi",
  "nazista",
  "macaco",
  "macaca",
  "retardado",
  "retardada",
  "idiota",
  "imbecil",
  "viado",
  "sapatão",
  "bicha",
  "buceta",
  "pica",
  "piroca",
  "cu",
  "cuzão",
  "merda",
  "fodase",
  "foda-se",
  "foder",
  "fodendo",
  "caralho",
  "porra",
  "vsf",
  "tnc",
  "fml",
  "fdp",
  "filho da puta",
  "vai se foder",
  "corno",
  "vadia",
  "vagabunda",
  "prostituta",
  "negro",
  "negão",
  "negra",
  "judeu",
  "judeus",
  "gay",
  "lésbica",
  "travesti",
  "trans",
  "deficiente",
  "autista",
  "gordo",
  "gorda",
  "feio",
  "feia",
  "matar",
  "morte",
  "suicidio",
  "me mata",
  "terror",
  "terrorista",
  "estupro",
  "estuprador",
  "pedofilia",
  "pedofilo",
  // English
  "nigger",
  "faggot",
  "retard",
  "bitch",
  "whore",
  "slut",
  "cunt",
  "fuck",
  "shit",
  "ass",
  "damn",
  "cock",
  "dick",
  "pussy",
  "racist",
  "racism",
  "hate",
  "kill",
  "murder",
  "rape",
  "pedophile",
  "nazi",
  "kike",
  "spic",
  "chink",
];

export function validateNickname(nickname: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = nickname.trim();

  // Length validation
  if (trimmed.length < 3) {
    return {
      valid: false,
      error: "Nickname deve ter pelo menos 3 caracteres.",
    };
  }
  if (trimmed.length > 30) {
    return {
      valid: false,
      error: "Nickname deve ter no máximo 30 caracteres.",
    };
  }

  // Only allow letters, numbers and some special chars
  if (!/^[a-zA-Z0-9_.\-çãõáéíóúâêîôûàèìòù]+$/i.test(trimmed)) {
    return {
      valid: false,
      error: "Nickname só pode conter letras, números, _ e .",
    };
  }

  // Profanity check (case insensitive)
  const lower = trimmed
    .toLowerCase()
    .replace(/[^a-záéíóúâêîôûãõçàèìòù0-9]/g, "");
  for (const word of BANNED_WORDS) {
    const cleanWord = word.replace(/[^a-záéíóúâêîôûãõçàèìòù0-9]/g, "");
    if (lower.includes(cleanWord)) {
      return {
        valid: false,
        error: "Nickname contém palavras não permitidas. Escolha outro nome.",
      };
    }
  }

  return { valid: true };
}
