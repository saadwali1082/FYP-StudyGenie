// openaiService.js — powered by OpenRouter
import { Platform } from 'react-native';

// ⚠️ Replace with your OpenRouter API key
const OPENROUTER_API_KEY = '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';

// Model to use (free tier on OpenRouter)
const MODEL = 'openrouter/free';

// ─────────────────────────────────────────────────────────────────
// ROBUST PDF TEXT EXTRACTOR (WEB ONLY via PDF.js)
// ─────────────────────────────────────────────────────────────────
const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    // If running outside web, this won't work
    if (typeof window === 'undefined' || !document) {
      return reject(new Error('PDF.js loading is only supported on the web.'));
    }

    if (window.pdfjsLib) {
      return resolve(window.pdfjsLib);
    }

    console.log('🌐 Loading PDF.js from CDN...');
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    
    script.onload = () => {
      // Set worker to matching version
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      console.log('✅ PDF.js loaded successfully');
      resolve(window.pdfjsLib);
    };
    
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    document.head.appendChild(script);
  });
};

const extractTextFromPDF = async (arrayBuffer) => {
  if (Platform.OS !== 'web') {
    throw new Error('Text extraction currently only supported on Snack Web version.');
  }

  const pdfjs = await loadPdfJs();
  
  // Load the document using the binary data
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  console.log(`📄 PDF loaded. It has ${pdf.numPages} pages.`);
  
  let fullText = '';
  
  // Loop through each page and extract text
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText.trim();
};

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT — called by SummaryScreen.js
// ─────────────────────────────────────────────────────────────────
export const summarizePDF = async (fileUri, fileName) => {
  try {
    // ── Step 1: Fetch the PDF from the picker URI ──
    console.log('📥 Fetching PDF...');
    const fetchRes = await fetch(fileUri);

    if (!fetchRes.ok) {
      return { success: false, message: 'Could not read the selected PDF file.' };
    }

    const arrayBuffer = await fetchRes.arrayBuffer();
    console.log('✅ PDF fetched —', arrayBuffer.byteLength, 'bytes');

    // ── Step 2: Extract text from PDF using PDF.js ──
    console.log('📖 Extracting text from PDF...');
    const extractedText = await extractTextFromPDF(arrayBuffer);
    console.log('📖 Extracted', extractedText.length, 'characters');
    
    if (!extractedText || extractedText.length < 20) {
      return {
        success: false,
        message:
          '⚠️ Could not extract text from this PDF.\n\n' +
          'This usually means the PDF is scanned (an image rather than text). ' +
          'Please use a text-based PDF.',
      };
    }

    // Trim to ~4000 chars to stay within free model context limits
    const textToSend = extractedText.slice(0, 4000);

    // ── Step 3: Send to OpenRouter Chat Completions API ──
    console.log('🤖 Sending to OpenRouter:', MODEL);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://snack.expo.dev',  // required by OpenRouter for free models
        'X-Title': 'StudyGenie',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content:
              'Summarize the following study document in exactly 3 to 5 bullet points.\n' +
              'Rules:\n' +
              '- Start every bullet point with the "•" character on its own line\n' +
              '- Each bullet must be one clear, concise sentence\n' +
              '- Return ONLY the bullet points — no intro, no headings, no conclusion\n\n' +
              '--- DOCUMENT START ---\n' +
              textToSend +
              '\n--- DOCUMENT END ---',
          },
        ],
        temperature: 0.3,
        max_tokens: 512,
      }),
    });

    const data = await res.json();
    console.log('📝 OpenRouter response status:', res.status);
    console.log('📝 Response body:', JSON.stringify(data));

    // ── Handle API errors ──
    if (!res.ok) {
      const msg =
        data.error?.message ||
        `OpenRouter API error — HTTP ${res.status}`;
      console.error('❌ API error:', msg);
      return { success: false, message: msg };
    }

    const rawText = data.choices?.[0]?.message?.content || '';

    if (!rawText) {
      return { success: false, message: 'The model returned an empty response. Try again.' };
    }

    // ── Step 4: Parse "•" bullet points from the response ──
    const bullets = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('•'))
      .map(line => line.replace(/^•\s*/, '').trim())
      .filter(line => line.length > 0);

    if (bullets.length === 0) {
      // Fallback: model didn't use "•" — just return non-empty lines
      const fallback = rawText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      console.log('⚠️ No "•" bullets found — using fallback line split');
      return { success: true, bullets: fallback };
    }

    console.log(`✅ Got ${bullets.length} bullet points`);
    return { success: true, bullets };

  } catch (error) {
    console.error('❌ summarizePDF crash:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.',
    };
  }
};

// ─────────────────────────────────────────────────────────────────
// CHATBOT EXPORT — called by ChatbotScreen.js
// ─────────────────────────────────────────────────────────────────
export const askChatbot = async (messages, documentText = '') => {
  try {
    // Format messages for OpenRouter (ignores our custom local roles if any)
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    // Inject document context if available
    if (documentText) {
      formattedMessages.unshift({
        role: 'system',
        content: `You are StudyGenie, a helpful AI study assistant. The user is asking questions about the following document content.\n\n--- DOCUMENT START ---\n${documentText.slice(0, 4000)}\n--- DOCUMENT END ---`
      });
    } else {
      formattedMessages.unshift({
        role: 'system',
        content: 'You are StudyGenie, a helpful AI study assistant. Answer the user\'s questions clearly and concisely.'
      });
    }
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://snack.expo.dev',
        'X-Title': 'StudyGenie',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: formattedMessages,
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });
    const data = await res.json();
    
    if (!res.ok) {
      const msg = data.error?.message || `API error - HTTP ${res.status}`;
      return { success: false, message: msg };
    }
    const answer = data.choices?.[0]?.message?.content || '';
    if (!answer) return { success: false, message: 'Received empty response from the AI.' };
    return { success: true, answer };
  } catch (error) {
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
};

// ─────────────────────────────────────────────────────────────────
// FLASHCARDS EXPORT — called by FlashcardsScreen.js
// ─────────────────────────────────────────────────────────────────
export const generateFlashcards = async (fileUri, fileName) => {
  try {
    const fetchRes = await fetch(fileUri);
    if (!fetchRes.ok) return { success: false, message: 'Could not read the selected PDF file.' };
    const arrayBuffer = await fetchRes.arrayBuffer();
    const extractedText = await extractTextFromPDF(arrayBuffer);
    
    if (!extractedText || extractedText.length < 20) return { success: false, message: 'Could not extract text from this PDF.' };
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://snack.expo.dev',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content:
              'Based on the following document, create exactly 5 study flashcards.\n' +
              'Format each flashcard exactly like this on separate lines:\n' +
              'Q: [The question]\n' +
              'A: [The answer]\n' +
              'Separate each flashcard with a blank line. Return ONLY the Q and A lines.\n\n' +
              '--- DOCUMENT START ---\n' +
              extractedText.slice(0, 4000) +
              '\n--- DOCUMENT END ---',
          },
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.error?.message || `API error - ${res.status}` };
    const rawText = data.choices?.[0]?.message?.content || '';
    
    const cards = [];
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let currentQ = '';
    for (const line of lines) {
      if (line.toUpperCase().startsWith('Q:')) currentQ = line.substring(2).trim();
      else if (line.toUpperCase().startsWith('A:') && currentQ) {
        cards.push({ question: currentQ, answer: line.substring(2).trim() });
        currentQ = '';
      }
    }
    if (cards.length === 0) return { success: false, message: 'Failed to parse flashcards correctly.' };
    return { success: true, cards };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
// ─────────────────────────────────────────────────────────────────
// QUIZ EXPORT — called by QuizScreen.js
// ─────────────────────────────────────────────────────────────────
export const generateQuiz = async (fileUri, fileName) => {
  try {
    const fetchRes = await fetch(fileUri);
    if (!fetchRes.ok) return { success: false, message: 'Could not read the selected PDF file.' };
    const arrayBuffer = await fetchRes.arrayBuffer();
    const extractedText = await extractTextFromPDF(arrayBuffer);
    if (!extractedText || extractedText.length < 20) return { success: false, message: 'Could not extract text from this PDF.' };
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://snack.expo.dev',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content:
              'Based on the following document, create a 5-question multiple choice quiz.\n' +
              'Format each question exactly like this block:\n' +
              'Q: [Question text]\n' +
              'A) [Option A]\n' +
              'B) [Option B]\n' +
              'C) [Option C]\n' +
              'D) [Option D]\n' +
              'Correct: [Just the letter A, B, C, or D]\n' +
              'Separate each question block with a blank line. Return ONLY the question blocks.\n\n' +
              '--- DOCUMENT START ---\n' +
              extractedText.slice(0, 4000) +
              '\n--- DOCUMENT END ---',
          },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.error?.message || `API error - ${res.status}` };
    const rawText = data.choices?.[0]?.message?.content || '';
    
    const questions = [];
    let currentQ = null;
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    for (const line of lines) {
      if (line.toUpperCase().startsWith('Q:')) {
        if (currentQ && currentQ.options.length > 0) questions.push(currentQ);
        currentQ = { question: line.substring(2).trim(), options: [], correct: '' };
      } else if (line.match(/^[A-D]\)/i) && currentQ) {
        currentQ.options.push(line.substring(2).trim());
      } else if (line.toUpperCase().startsWith('CORRECT:') && currentQ) {
        currentQ.correct = line.substring(8).trim().toUpperCase();
      }
    }
    if (currentQ && currentQ.options.length > 0) questions.push(currentQ);
    if (questions.length === 0) return { success: false, message: 'Failed to parse quiz format.' };
    return { success: true, questions };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

