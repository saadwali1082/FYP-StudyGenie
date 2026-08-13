// openaiService.js
// StudyGenie AI Service powered by OpenRouter

import { Platform } from 'react-native';


// =====================================================
// OPENROUTER CONFIGURATION
// =====================================================

const OPENROUTER_API_KEY =
  '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';

const MODEL = 'openrouter/free';

const OPENROUTER_URL =
  'https://openrouter.ai/api/v1/chat/completions';


// =====================================================
// LOAD PDF.JS
// =====================================================

const loadPdfJs = () => {
  return new Promise((resolve, reject) => {

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(
        new Error(
          'PDF text extraction is currently supported on the Expo Snack Web version.'
        )
      );
      return;
    }

    // PDF.js already loaded
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    console.log('🌐 Loading PDF.js from CDN...');

    const script = document.createElement('script');

    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';

    script.onload = () => {

      if (!window.pdfjsLib) {
        reject(
          new Error('PDF.js failed to initialize.')
        );
        return;
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

      console.log('✅ PDF.js loaded successfully');

      resolve(window.pdfjsLib);
    };

    script.onerror = () => {
      reject(
        new Error('Failed to load PDF.js from CDN.')
      );
    };

    document.head.appendChild(script);
  });
};


// =====================================================
// EXTRACT TEXT FROM PDF
// =====================================================

const extractTextFromPDF = async (arrayBuffer) => {

  if (Platform.OS !== 'web') {
    throw new Error(
      'PDF text extraction is currently supported on Expo Snack Web.'
    );
  }

  const pdfjs = await loadPdfJs();

  console.log('📖 Loading PDF document...');

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
  });

  const pdf = await loadingTask.promise;

  console.log(
    `📄 PDF loaded. It has ${pdf.numPages} pages.`
  );

  let fullText = '';

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {

    console.log(
      `📖 Reading page ${pageNumber}/${pdf.numPages}...`
    );

    const page = await pdf.getPage(pageNumber);

    const textContent =
      await page.getTextContent();

    const pageText = textContent.items
      .map(item => item.str)
      .join(' ');

    fullText += pageText + '\n';
  }

  const finalText =
    fullText.trim();

  console.log(
    `✅ PDF extraction complete: ${finalText.length} characters`
  );

  return finalText;
};


// =====================================================
// PUBLIC PDF TEXT READER
// =====================================================
// can be used by other screens if needed.
// =====================================================

export const readDocumentContent = async (fileUri) => {

  try {

    console.log(
      '📥 Reading document:',
      fileUri
    );

    const response =
      await fetch(fileUri);

    if (!response.ok) {
      throw new Error(
        'Could not read the selected PDF file.'
      );
    }

    const arrayBuffer =
      await response.arrayBuffer();

    const extractedText =
      await extractTextFromPDF(arrayBuffer);

    if (
      !extractedText ||
      extractedText.length < 20
    ) {

      throw new Error(
        'Could not extract readable text from this PDF. The PDF may be scanned or image-based.'
      );
    }

    return extractedText;

  } catch (error) {

    console.error(
      '❌ readDocumentContent error:',
      error
    );

    throw error;
  }
};


// =====================================================
// SUMMARIZE PDF
// =====================================================

export const summarizePDF = async (
  fileUri,
  fileName
) => {

  try {

    console.log(
      '📥 Fetching PDF:',
      fileName
    );

    const fetchRes =
      await fetch(fileUri);

    if (!fetchRes.ok) {

      return {
        success: false,
        message:
          'Could not read the selected PDF file.',
      };
    }

    const arrayBuffer =
      await fetchRes.arrayBuffer();

    console.log(
      '✅ PDF fetched:',
      arrayBuffer.byteLength,
      'bytes'
    );


    // Extract text
    const extractedText =
      await extractTextFromPDF(arrayBuffer);


    if (
      !extractedText ||
      extractedText.length < 20
    ) {

      return {
        success: false,
        message:
          'Could not extract text from this PDF. This may be a scanned/image-based PDF.',
      };
    }


    // Limit text for free model
    const textToSend =
      extractedText.slice(0, 12000);


    console.log(
      '🤖 Sending document to OpenRouter...'
    );


    const res =
      await fetch(
        OPENROUTER_URL,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${OPENROUTER_API_KEY}`,

            'Content-Type':
              'application/json',

            'HTTP-Referer':
              'https://snack.expo.dev',

            'X-Title':
              'StudyGenie',
          },

          body: JSON.stringify({

            model: MODEL,

            messages: [

              {
                role: 'user',

                content:
                  'Summarize the following study document in exactly 3 to 5 bullet points.\n\n' +

                  'Rules:\n' +

                  '- Start every bullet point with the "•" character.\n' +

                  '- Each bullet must be one clear sentence.\n' +

                  '- Return ONLY the bullet points.\n' +

                  '- Do not include an introduction.\n' +

                  '- Do not include a conclusion.\n\n' +

                  '--- DOCUMENT START ---\n' +

                  textToSend +

                  '\n--- DOCUMENT END ---',
              },

            ],

            temperature: 0.3,

            max_tokens: 512,
          }),
        }
      );


    const data =
      await res.json();


    console.log(
      '📝 OpenRouter status:',
      res.status
    );


    if (!res.ok) {

      const msg =
        data?.error?.message ||
        `OpenRouter API error - HTTP ${res.status}`;

      return {
        success: false,
        message: msg,
      };
    }


    const rawText =
      data?.choices?.[0]?.message?.content || '';


    if (!rawText) {

      return {
        success: false,
        message:
          'The AI returned an empty response.',
      };
    }


    // Parse bullet points
    const bullets = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line =>
        line
          .replace(/^•\s*/, '')
          .replace(/^[-*]\s*/, '')
          .trim()
      )
      .filter(line => line.length > 0);


    return {
      success: true,
      bullets,
    };

  } catch (error) {

    console.error(
      '❌ summarizePDF error:',
      error
    );

    return {
      success: false,
      message:
        error?.message ||
        'An unexpected error occurred.',
    };
  }
};


// =====================================================
// CHATBOT
// =====================================================
// PDF-aware chatbot.
// The extracted PDF text is explicitly sent together
// with the user's question.
// =====================================================

export const askChatbot = async (
  messages,
  documentText = ''
) => {

  try {

    console.log(
      '🤖 Starting chatbot request...'
    );


    const hasDocument =
      typeof documentText === 'string' &&
      documentText.trim().length > 0;


    console.log(
      '📄 Document characters:',
      hasDocument
        ? documentText.length
        : 0
    );


    // -------------------------------------------------
    // Format conversation
    // -------------------------------------------------

    const conversationMessages =
      messages

        .filter(
          msg =>
            msg &&
            typeof msg.content === 'string' &&
            msg.content.trim().length > 0
        )

        .map(msg => ({

          role:
            msg.role === 'assistant'
              ? 'assistant'
              : 'user',

          content:
            msg.content.trim(),

        }));


    // -------------------------------------------------
    // Find latest question
    // -------------------------------------------------

    const lastUserMessage =
      [...conversationMessages]
        .reverse()
        .find(
          msg =>
            msg.role === 'user'
        );


    if (!lastUserMessage) {

      return {
        success: false,
        message:
          'Please ask a question first.',
      };
    }


    const userQuestion =
      lastUserMessage.content;


    // -------------------------------------------------
    // System instruction
    // -------------------------------------------------

    const systemInstruction = hasDocument

      ? `
You are StudyGenie, an AI study assistant.

The user has uploaded a study document.

The document has already been converted from PDF into text.

IMPORTANT RULES:

1. You CAN read the document text.
2. Use the uploaded document as the primary source.
3. Answer questions about the document using information from the document.
4. Never say that you cannot read PDFs.
5. Never tell the user to copy and paste the PDF.
6. If the answer is not contained in the document, clearly say that it is not stated in the uploaded document.
7. Do not invent information.
8. Explain difficult concepts in simple study-friendly language.
`

      : `
You are StudyGenie, a helpful AI study assistant.

Answer the user's study questions clearly and accurately.
`;


    // -------------------------------------------------
    // Create API messages
    // -------------------------------------------------

    const apiMessages = [

      {
        role: 'system',
        content: systemInstruction,
      },

    ];


    // Add previous conversation
    const previousMessages =
      conversationMessages.slice(
        0,
        Math.max(
          0,
          conversationMessages.length - 1
        )
      );


    // Keep last 8 messages
    apiMessages.push(
      ...previousMessages.slice(-8)
    );


    // -------------------------------------------------
    // Add document + question
    // -------------------------------------------------

    let finalUserMessage;


    if (hasDocument) {

      // Send up to 12,000 characters
      const documentForAI =
        documentText.slice(0, 12000);


      finalUserMessage = `

UPLOADED STUDY DOCUMENT

================ DOCUMENT START ================

${documentForAI}

================ DOCUMENT END ==================

USER QUESTION:

${userQuestion}

IMPORTANT:
Answer the question using the uploaded document above.
Do not say that you cannot read the PDF.
`;

    } else {

      finalUserMessage =
        userQuestion;
    }


    apiMessages.push({

      role: 'user',

      content:
        finalUserMessage,

    });


    console.log(
      '📤 Sending chatbot request...'
    );


    // -------------------------------------------------
    // OpenRouter request
    // -------------------------------------------------

    const res =
      await fetch(
        OPENROUTER_URL,
        {
          method: 'POST',

          headers: {

            Authorization:
              `Bearer ${OPENROUTER_API_KEY}`,

            'Content-Type':
              'application/json',

            'HTTP-Referer':
              'https://snack.expo.dev',

            'X-Title':
              'StudyGenie',
          },

          body: JSON.stringify({

            model: MODEL,

            messages:
              apiMessages,

            temperature: 0.2,

            max_tokens: 1200,

          }),
        }
      );


    const data =
      await res.json();


    console.log(
      '📝 Chatbot response status:',
      res.status
    );


    if (!res.ok) {

      const msg =
        data?.error?.message ||
        `API error - HTTP ${res.status}`;


      console.error(
        '❌ Chatbot API error:',
        msg
      );


      return {
        success: false,
        message: msg,
      };
    }


    const answer =
      data?.choices?.[0]?.message?.content;


    if (
      !answer ||
      typeof answer !== 'string'
    ) {

      return {
        success: false,
        message:
          'The AI returned an empty response.',
      };
    }


    console.log(
      '✅ Chatbot answer received.'
    );


    return {

      success: true,

      answer:
        answer.trim(),

    };


  } catch (error) {

    console.error(
      '❌ askChatbot error:',
      error
    );


    return {

      success: false,

      message:
        error?.message ||
        'An unexpected chatbot error occurred.',

    };
  }
};


// =====================================================
// FLASHCARDS
// =====================================================

export const generateFlashcards = async (
  fileUri,
  fileName
) => {

  try {

    const fetchRes =
      await fetch(fileUri);


    if (!fetchRes.ok) {

      return {
        success: false,
        message:
          'Could not read the selected PDF file.',
      };
    }


    const arrayBuffer =
      await fetchRes.arrayBuffer();


    const extractedText =
      await extractTextFromPDF(
        arrayBuffer
      );


    if (
      !extractedText ||
      extractedText.length < 20
    ) {

      return {
        success: false,
        message:
          'Could not extract text from this PDF.',
      };
    }


    const res =
      await fetch(
        OPENROUTER_URL,
        {
          method: 'POST',

          headers: {

            Authorization:
              `Bearer ${OPENROUTER_API_KEY}`,

            'Content-Type':
              'application/json',

            'HTTP-Referer':
              'https://snack.expo.dev',

            'X-Title':
              'StudyGenie',
          },

          body: JSON.stringify({

            model: MODEL,

            messages: [

              {
                role: 'user',

                content:
                  'Based on the following document, create exactly 5 study flashcards.\n\n' +

                  'Format exactly:\n' +

                  'Q: [question]\n' +

                  'A: [answer]\n\n' +

                  'Separate each flashcard with a blank line.\n' +

                  'Return ONLY the Q and A lines.\n\n' +

                  '--- DOCUMENT START ---\n' +

                  extractedText.slice(
                    0,
                    12000
                  ) +

                  '\n--- DOCUMENT END ---',
              },

            ],

            temperature: 0.4,

            max_tokens: 800,

          }),
        }
      );


    const data =
      await res.json();


    if (!res.ok) {

      return {
        success: false,
        message:
          data?.error?.message ||
          `API error - ${res.status}`,
      };
    }


    const rawText =
      data?.choices?.[0]?.message?.content ||
      '';


    const cards = [];

    const lines =
      rawText
        .split('\n')
        .map(line => line.trim())
        .filter(
          line => line.length > 0
        );


    let currentQ = '';


    for (const line of lines) {

      if (
        line
          .toUpperCase()
          .startsWith('Q:')
      ) {

        currentQ =
          line
            .substring(2)
            .trim();

      } else if (

        line
          .toUpperCase()
          .startsWith('A:') &&
        currentQ

      ) {

        cards.push({

          question:
            currentQ,

          answer:
            line
              .substring(2)
              .trim(),

        });


        currentQ = '';
      }
    }


    if (cards.length === 0) {

      return {
        success: false,
        message:
          'Failed to parse flashcards correctly.',
      };
    }


    return {
      success: true,
      cards,
    };


  } catch (error) {

    console.error(
      '❌ Flashcard error:',
      error
    );


    return {
      success: false,
      message:
        error?.message ||
        'Failed to generate flashcards.',
    };
  }
};


// =====================================================
// QUIZ
// =====================================================

export const generateQuiz = async (
  fileUri,
  fileName
) => {

  try {

    const fetchRes =
      await fetch(fileUri);


    if (!fetchRes.ok) {

      return {
        success: false,
        message:
          'Could not read the selected PDF file.',
      };
    }


    const arrayBuffer =
      await fetchRes.arrayBuffer();


    const extractedText =
      await extractTextFromPDF(
        arrayBuffer
      );


    if (
      !extractedText ||
      extractedText.length < 20
    ) {

      return {
        success: false,
        message:
          'Could not extract text from this PDF.',
      };
    }


    const res =
      await fetch(
        OPENROUTER_URL,
        {
          method: 'POST',

          headers: {

            Authorization:
              `Bearer ${OPENROUTER_API_KEY}`,

            'Content-Type':
              'application/json',

            'HTTP-Referer':
              'https://snack.expo.dev',

            'X-Title':
              'StudyGenie',
          },

          body: JSON.stringify({

            model: MODEL,

            messages: [

              {
                role: 'user',

                content:
                  'Based on the following document, create a 5-question multiple choice quiz.\n\n' +

                  'Format exactly:\n' +

                  'Q: [Question text]\n' +

                  'A) [Option A]\n' +

                  'B) [Option B]\n' +

                  'C) [Option C]\n' +

                  'D) [Option D]\n' +

                  'Correct: [A, B, C, or D]\n\n' +

                  'Separate each question with a blank line.\n' +

                  'Return ONLY the question blocks.\n\n' +

                  '--- DOCUMENT START ---\n' +

                  extractedText.slice(
                    0,
                    12000
                  ) +

                  '\n--- DOCUMENT END ---',
              },

            ],

            temperature: 0.4,

            max_tokens: 1000,

          }),
        }
      );


    const data =
      await res.json();


    if (!res.ok) {

      return {
        success: false,
        message:
          data?.error?.message ||
          `API error - ${res.status}`,
      };
    }


    const rawText =
      data?.choices?.[0]?.message?.content ||
      '';


    const questions = [];

    const lines =
      rawText
        .split('\n')
        .map(line => line.trim())
        .filter(
          line => line.length > 0
        );


    let currentQ = null;


    for (const line of lines) {

      if (
        line
          .toUpperCase()
          .startsWith('Q:')
      ) {

        if (
          currentQ &&
          currentQ.options.length > 0
        ) {

          questions.push(
            currentQ
          );
        }


        currentQ = {

          question:
            line
              .substring(2)
              .trim(),

          options: [],

          correct: '',

        };


      } else if (

        /^[A-D]\)/i.test(line) &&
        currentQ

      ) {

        currentQ.options.push(
          line
            .substring(2)
            .trim()
        );


      } else if (

        line
          .toUpperCase()
          .startsWith('CORRECT:') &&
        currentQ

      ) {

        currentQ.correct =
          line
            .substring(8)
            .trim()
            .toUpperCase();
      }
    }


    if (
      currentQ &&
      currentQ.options.length > 0
    ) {

      questions.push(
        currentQ
      );
    }


    if (
      questions.length === 0
    ) {

      return {
        success: false,
        message:
          'Failed to parse quiz format.',
      };
    }


    return {
      success: true,
      questions,
    };


  } catch (error) {

    console.error(
      '❌ Quiz error:',
      error
    );


    return {
      success: false,
      message:
        error?.message ||
        'Failed to generate quiz.',
    };
  }
};