import { DAYS_LIST } from './constants';

export interface ParsedVoiceCommand {
  task: string;
  hour: string; // "01" - "12"
  minute: string; // "00" - "59"
  ampm: 'AM' | 'PM';
  day: string;
  matchedContactName?: string;
  matchedContactNumber?: string;
  whatsappMessage?: string;
  rawTranscript: string;
  hasWakeWord: boolean;
  isValid: boolean;
  feedbackMessage: string;
}

// Hindi digits to western digits mapping
const HINDI_NUMBER_WORDS: Record<string, number> = {
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
  'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'पच्चीस': 25, 'तीस': 30, 'पैंतीस': 35, 'चालीस': 40, 'पैंतालीस': 45,
  'पचास': 50, 'पचपन': 55
};

/**
 * Checks if wake word "BGK" / "बीजीके" / "bgk" exists in user speech
 */
export function containsWakeWord(transcript: string): boolean {
  const lower = transcript.toLowerCase();
  return (
    lower.includes('bgk') ||
    lower.includes('बीजीके') ||
    lower.includes('बिजीके') ||
    lower.includes('बीजेके') ||
    lower.includes('बी जी के') ||
    lower.includes('बी जे के') ||
    lower.includes('बिजी के') ||
    lower.includes('bg k') ||
    lower.includes('b g k') ||
    lower.includes('b.g.k') ||
    lower.includes('b-g-k') ||
    lower.includes('bg') ||
    lower.includes('bjk') ||
    lower.includes('vgk')
  );
}

/**
 * Strips the wake word prefix from the input transcript
 */
export function removeWakeWord(transcript: string): string {
  return transcript
    .replace(/(bgk|b\.g\.k|b\s+g\s+k|बीजीके|बिजीके|बीजेके|बी\s+जी\s+के|बी\s+जे\s+के|बिजी\s+के|bg\s*k|b-g-k|bg|bjk|vgk)\s*,?\s*/gi, '')
    .trim();
}

/**
 * Parses user speech/text into alarm components.
 * Example: "बीजीके 9:00 बजे का अलार्म लगाओ" or "BGK 7:30 AM दवाई का अलार्म सेट करो"
 */
export function parseVoiceAlarmCommand(
  rawTranscript: string,
  contacts: Array<{ name: string; phoneNumber: string }> = [],
  isDirectTrigger: boolean = false,
  alternatives: string[] = []
): ParsedVoiceCommand {
  // If alternatives exist, see if any has wake word
  let candidateTranscript = rawTranscript;
  if (!containsWakeWord(candidateTranscript) && alternatives && alternatives.length > 0) {
    const withWakeWord = alternatives.find(alt => containsWakeWord(alt));
    if (withWakeWord) {
      candidateTranscript = withWakeWord;
    }
  }

  const detectedWakeWord = containsWakeWord(candidateTranscript);
  // If user clicked the mic button directly or submitted the input, allow even if wake word was omitted
  const hasWakeWord = detectedWakeWord || isDirectTrigger;
  const commandText = removeWakeWord(candidateTranscript);
  const lower = commandText.toLowerCase();

  let hour: number | null = null;
  let minute: number = 0;
  let ampm: 'AM' | 'PM' = 'AM';
  let day: string = 'प्रतिदिन (Every Day)';
  let task = 'BGK स्मार्ट रिमाइंडर';

  // 1. Detect AM / PM hints in Hindi/English
  const hasPMHint = /pm|पीएम|शाम|रात|दोपहर|evening|night|afternoon/i.test(commandText);
  const hasAMHint = /am|एएम|सुबह|प्रातः|morning/i.test(commandText);

  // 2. Extract standard digital time formats like "9:00", "09:30", "9.30"
  const colonTimeMatch = commandText.match(/(\d{1,2})[:.](\d{2})/);
  if (colonTimeMatch) {
    hour = parseInt(colonTimeMatch[1], 10);
    minute = parseInt(colonTimeMatch[2], 10);
  }

  // 3. Extract time with "बजे" or "o'clock" e.g., "9 बजे", "9 baje", "9:30 बजे", "साढ़े नौ बजे"
  if (hour === null) {
    // Check Hindi fractional prefixes
    let fractionalMinute = 0;
    if (/साढ़े|sadhe|saadhe/i.test(commandText)) {
      fractionalMinute = 30;
    } else if (/सवा|sawa/i.test(commandText)) {
      fractionalMinute = 15;
    } else if (/पौने|paune/i.test(commandText)) {
      fractionalMinute = 45;
    }

    const bajeDigitMatch = commandText.match(/(\d{1,2})\s*(?:बजे|baje|o'?clock|hr|hours?)/i);
    if (bajeDigitMatch) {
      hour = parseInt(bajeDigitMatch[1], 10);
      minute = fractionalMinute;
    } else {
      // Check word numbers like "नौ बजे", "दस बजे", "आठ बजे"
      for (const [word, num] of Object.entries(HINDI_NUMBER_WORDS)) {
        const regex = new RegExp(`${word}\\s*(?:बजे|baje|o'?clock|घंटे)`, 'i');
        if (regex.test(commandText)) {
          hour = num;
          minute = fractionalMinute;
          break;
        }
      }
    }
  }

  // 4. Default single digit fallback if user just said "9" or "नौ"
  if (hour === null) {
    const standaloneDigitMatch = commandText.match(/\b([1-9]|1[0-2])\b/);
    if (standaloneDigitMatch) {
      hour = parseInt(standaloneDigitMatch[1], 10);
    }
  }

  // 5. Determine AM / PM intelligently
  if (hour !== null) {
    // 24-hour conversion if input was > 12 (e.g. 21:00 or 15:30)
    if (hour >= 13 && hour <= 23) {
      hour = hour - 12;
      ampm = 'PM';
    } else if (hour === 12) {
      ampm = hasAMHint ? 'AM' : 'PM';
    } else if (hasPMHint) {
      ampm = 'PM';
    } else if (hasAMHint) {
      ampm = 'AM';
    } else {
      // If user said hours like 8, 9, 10, 11 with no specification, check current time
      const now = new Date();
      const currentHour = now.getHours();
      // If current time is evening (>= 12), and target hour is coming up in PM, default to PM
      if (currentHour >= 12 && hour < 12) {
        ampm = 'PM';
      } else {
        ampm = 'AM';
      }
    }
  }

  // 6. Day detection (e.g., सोमवार, कल, प्रतिदिन)
  if (/प्रतिदिन|daily|every\s*day|रोज़|रोजाना/i.test(commandText)) {
    day = 'प्रतिदिन (Every Day)';
  } else {
    for (const d of DAYS_LIST) {
      const enDay = d.split('(')[1]?.replace(')', '').trim().toLowerCase();
      const hiDay = d.split('(')[0]?.trim();
      if ((enDay && lower.includes(enDay)) || (hiDay && commandText.includes(hiDay))) {
        day = d;
        break;
      }
    }
  }

  // 7. Task Name Extraction
  // Remove alarm verbs like "का अलार्म लगाओ", "सेट करो", "का अलार्म", "set alarm", "wake me up"
  let cleanTask = commandText
    .replace(/\b(अलार्म|alarm|लगाओ|लगा\s*दो|सेट\s*करो|सेट\s*कर\s*दो|set|baje|बजे|बजकर|minute|मिनट|am|pm|एएम|पीएम|सुबह|शाम|रात|बजे का)\b/gi, '')
    .replace(/(\d{1,2}[:.]\d{2}|\b\d{1,2}\b)/g, '')
    .replace(/[,\-–.]+/g, ' ')
    .trim();

  if (cleanTask.length >= 2) {
    task = cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1);
  } else {
    task = `अलार्म ${hour ? `${hour}:${minute.toString().padStart(2, '0')} ${ampm}` : ''}`.trim();
  }

  // 8. Contact Matching (Optional if user mentions contact name)
  let matchedContactName: string | undefined;
  let matchedContactNumber: string | undefined;
  for (const c of contacts) {
    const contactLower = c.name.toLowerCase();
    if (contactLower.length > 2 && lower.includes(contactLower)) {
      matchedContactName = c.name;
      matchedContactNumber = c.phoneNumber;
      break;
    }
  }

  const isValid = hour !== null && hour >= 1 && hour <= 12;
  const hourFormatted = hour ? hour.toString().padStart(2, '0') : '09';
  const minFormatted = minute.toString().padStart(2, '0');

  let feedbackMessage = '';
  if (!hasWakeWord) {
    feedbackMessage = 'कृपया कमांड से पहले "BGK" या "बीजीके" बोलें। (जैसे: "BGK 9:00 बजे का अलार्म लगाओ")';
  } else if (!isValid) {
    feedbackMessage = 'समय समझ नहीं आया। कृपया स्पष्ट बोलें: जैसे "BGK 9 बजे का अलार्म लगाओ" या "BGK 7:30 AM अलार्म सेट करो"';
  } else {
    feedbackMessage = `बीजीके ने सुना: ${hourFormatted}:${minFormatted} ${ampm} के लिए "${task}" का अलार्म सेट किया गया!`;
  }

  return {
    task,
    hour: hourFormatted,
    minute: minFormatted,
    ampm,
    day,
    matchedContactName,
    matchedContactNumber,
    rawTranscript,
    hasWakeWord,
    isValid,
    feedbackMessage,
  };
}
