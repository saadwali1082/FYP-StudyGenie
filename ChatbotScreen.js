import React, { useState, useRef, useEffect } from 'react';

import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';

import * as DocumentPicker from 'expo-document-picker';

import { askChatbot } from './openaiService';


// =====================================================
// PDF.JS LOADER
// =====================================================

const loadPdfJs = () => {
  return new Promise((resolve, reject) => {

    // PDF extraction 
    if (Platform.OS !== 'web') {
      reject(
        new Error(
          'PDF reading is currently supported on the Expo Snack Web version.'
        )
      );
      return;
    }

    // PDF.js already loaded
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    console.log('🌐 Loading PDF.js...');

    const script = document.createElement('script');

    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';

    script.onload = () => {

      if (window.pdfjsLib) {

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        console.log('✅ PDF.js loaded');

        resolve(window.pdfjsLib);

      } else {

        reject(new Error('PDF.js failed to initialize.'));

      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load PDF.js from CDN.'));
    };

    document.head.appendChild(script);
  });
};


// =====================================================
// EXTRACT TEXT FROM PDF
// =====================================================

const extractTextFromPDF = async (fileUri) => {

  try {

    console.log('📥 Fetching PDF:', fileUri);

    const response = await fetch(fileUri);

    if (!response.ok) {
      throw new Error('Could not read the PDF file.');
    }

    const arrayBuffer = await response.arrayBuffer();

    console.log(
      '✅ PDF downloaded:',
      arrayBuffer.byteLength,
      'bytes'
    );

    const pdfjs = await loadPdfJs();

    console.log('📖 Opening PDF...');

    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
    });

    const pdf = await loadingTask.promise;

    console.log(
      `📄 PDF loaded successfully. Pages: ${pdf.numPages}`
    );

    let fullText = '';

    // Read every page
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {

      console.log(
        `📖 Reading page ${pageNumber}/${pdf.numPages}...`
      );

      const page = await pdf.getPage(pageNumber);

      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ');

      fullText += pageText + '\n';
    }

    const finalText = fullText.trim();

    console.log(
      '✅ PDF text extracted:',
      finalText.length,
      'characters'
    );

    if (!finalText || finalText.length < 20) {

      throw new Error(
        'Could not extract readable text from this PDF. ' +
        'The PDF may be scanned/image-based rather than text-based.'
      );
    }

    return finalText;

  } catch (error) {

    console.error(
      '❌ PDF extraction error:',
      error
    );

    throw error;
  }
};


// =====================================================
// MAIN CHATBOT SCREEN
// =====================================================

export default function ChatbotScreen({ navigation, route }) {

  // ===================================================
  // ROUTE PARAMETERS
  // ===================================================

  const params = route?.params || {};

  const initialFileName = params.fileName || '';
  const initialFileUri = params.fileUri || '';
  const initialFileType = params.fileType || '';

  // IMPORTANT:
  // Only use params.text if it is actual extracted document
  // text. Do NOT use params.summary as document content.
  const passedText = params.text || '';


  // ===================================================
  // STATE
  // ===================================================

  const [fileName, setFileName] = useState(initialFileName);

  const [fileUri, setFileUri] = useState(initialFileUri);

  const [fileType, setFileType] = useState(initialFileType);

  const [question, setQuestion] = useState('');

  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([]);

  const [documentText, setDocumentText] = useState(passedText);

  const [extractingText, setExtractingText] = useState(false);

  const scrollViewRef = useRef(null);


  // ===================================================
  // EXTRACT PDF WHEN SCREEN OPENS
  // ===================================================

  useEffect(() => {

    const loadInitialDocument = async () => {

      // If text was already passed, don't extract again
      if (passedText) {

        console.log(
          '✅ Document text was already provided.'
        );

        return;
      }

      // If a PDF was passed through navigation
      if (
        initialFileUri &&
        (
          initialFileType === 'pdf' ||
          initialFileName.toLowerCase().endsWith('.pdf')
        )
      ) {

        await readPDF(initialFileUri, initialFileName);
      }
    };

    loadInitialDocument();

  }, [initialFileUri]);


  // ===================================================
  // READ PDF FUNCTION
  // ===================================================

  const readPDF = async (uri, name) => {

    if (!uri) {
      Alert.alert(
        'No PDF',
        'Please select a PDF file first.'
      );
      return;
    }

    setExtractingText(true);

    try {

      console.log(
        '📚 Starting PDF extraction:',
        name
      );

      const extractedText =
        await extractTextFromPDF(uri);

      if (!extractedText) {

        throw new Error(
          'No readable text was found in this PDF.'
        );
      }

      setDocumentText(extractedText);

      setFileUri(uri);

      setFileName(
        name || 'document.pdf'
      );

      setFileType('pdf');

      console.log(
        '✅ Chatbot now has PDF text.'
      );

    } catch (error) {

      console.error(
        '❌ Could not read PDF:',
        error
      );

      setDocumentText('');

      const message =
        error?.message ||
        'Could not read this PDF.';

      if (Platform.OS === 'web') {

        window.alert(
          'PDF Reading Error\n\n' + message
        );

      } else {

        Alert.alert(
          'PDF Reading Error',
          message
        );
      }

    } finally {

      setExtractingText(false);
    }
  };


  // ===================================================
  // PICK PDF DIRECTLY FROM CHATBOT
  // ===================================================

  const pickPDF = async () => {

    try {

      const result =
        await DocumentPicker.getDocumentAsync({

          type: 'application/pdf',

          copyToCacheDirectory: true,
        });


      if (result.canceled) {
        return;
      }


      const asset = result.assets?.[0];

      if (!asset) {
        return;
      }


      const selectedUri = asset.uri;

      const selectedName =
        asset.name || 'document.pdf';


      // Update UI immediately
      setFileName(selectedName);

      setFileUri(selectedUri);

      setFileType('pdf');

      // Remove previous document text
      setDocumentText('');

      // Read the new PDF
      await readPDF(
        selectedUri,
        selectedName
      );

    } catch (error) {

      console.error(
        '❌ PDF selection error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not select the PDF.'
      );
    }
  };


  // ===================================================
  // WELCOME MESSAGE
  // ===================================================

  useEffect(() => {

    if (messages.length === 0) {

      let welcomeMessage =
        "👋 Hi! I'm StudyGenie. Ask me anything about your studies!";


      if (fileName) {

        welcomeMessage =
          `📚 Hi! I have received your document "${fileName}".\n\n` +
          'I will read the document and answer your questions based on it.';
      }


      setMessages([
        {
          role: 'assistant',
          content: welcomeMessage,
        },
      ]);
    }

  }, [fileName]);


  // ===================================================
  // AUTO SCROLL
  // ===================================================

  useEffect(() => {

    if (scrollViewRef.current) {

      setTimeout(() => {

        scrollViewRef.current.scrollToEnd({
          animated: true,
        });

      }, 200);
    }

  }, [messages]);


  // ===================================================
  // ASK QUESTION
  // ===================================================

  const askQuestion = async () => {

    if (!question.trim()) {

      if (Platform.OS === 'web') {

        window.alert(
          'Please type a question first.'
        );

      } else {

        Alert.alert(
          'Empty Question',
          'Please type a question first.'
        );
      }

      return;
    }


    if (loading) {
      return;
    }


    // If PDF is still being extracted
    if (extractingText) {

      if (Platform.OS === 'web') {

        window.alert(
          'Please wait while the PDF is being read.'
        );

      } else {

        Alert.alert(
          'Please wait',
          'The PDF is still being read.'
        );
      }

      return;
    }


    const userQuestion =
      question.trim();


    setQuestion('');

    setLoading(true);


    // Add user message
    const updatedMessages = [
      ...messages,
      {
        role: 'user',
        content: userQuestion,
      },
    ];


    setMessages(updatedMessages);


    try {

      console.log(
        '🤖 Asking chatbot...'
      );

      console.log(
        '📄 Document characters available:',
        documentText.length
      );


      // Send:
      // 1. Conversation history
      // 2. Full extracted document text
      const result =
        await askChatbot(
          updatedMessages,
          documentText
        );


      if (result.success) {

        setMessages(
          (previousMessages) => [
            ...previousMessages,
            {
              role: 'assistant',
              content: result.answer,
            },
          ]
        );

      } else {

        setMessages(
          (previousMessages) => [
            ...previousMessages,
            {
              role: 'assistant',
              content:
                `❌ Error: ${result.message}`,
            },
          ]
        );
      }

    } catch (error) {

      console.error(
        '❌ Chat error:',
        error
      );


      setMessages(
        (previousMessages) => [
          ...previousMessages,
          {
            role: 'assistant',
            content:
              "❌ Sorry, I'm having trouble right now. Please try again in a moment.",
          },
        ]
      );

    } finally {

      setLoading(false);
    }
  };


  // ===================================================
  // CLEAR CHAT
  // ===================================================

  const clearChat = () => {

    const welcomeMessage = fileName

      ? `📚 Chat cleared!\n\nI still have your document "${fileName}". Ask me anything about it!`

      : "👋 Chat cleared! Ask me anything new!";


    if (Platform.OS === 'web') {

      const confirm =
        window.confirm(
          'Clear the conversation history?'
        );


      if (confirm) {

        setMessages([
          {
            role: 'assistant',
            content: welcomeMessage,
          },
        ]);
      }

      return;
    }


    Alert.alert(

      'Clear Chat',

      'Clear the conversation history?',

      [

        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Clear',
          style: 'destructive',

          onPress: () => {

            setMessages([
              {
                role: 'assistant',
                content: welcomeMessage,
              },
            ]);
          },
        },

      ]
    );
  };


  // ===================================================
  // DOCUMENT STATUS
  // ===================================================

  const documentReady =
    documentText &&
    documentText.length > 0;


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <SafeAreaView style={styles.safeArea}>

      <KeyboardAvoidingView
        style={styles.container}

        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }

        keyboardVerticalOffset={
          Platform.OS === 'ios'
            ? 90
            : 0
        }
      >


        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <View>

            <Text style={styles.title}>
              🤖 StudyGenie
            </Text>

            <Text style={styles.subtitle}>
              Ask me anything!
            </Text>

          </View>


          {messages.length > 1 && (

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={clearChat}
            >

              <Text style={styles.clearBtnText}>
                Clear
              </Text>

            </TouchableOpacity>

          )}

        </View>


        {/* =================================================
            UPLOAD PDF BUTTON
        ================================================= */}

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickPDF}
          disabled={extractingText || loading}
          activeOpacity={0.8}
        >

          <Text style={styles.uploadButtonIcon}>
            📎
          </Text>

          <View style={{ flex: 1 }}>

            <Text style={styles.uploadButtonTitle}>
              {fileName
                ? 'Change PDF'
                : 'Upload Study PDF'}
            </Text>

            <Text style={styles.uploadButtonSubtitle}>
              {extractingText
                ? 'Reading your PDF...'
                : 'Attach a PDF and ask questions about it'}
            </Text>

          </View>


          {extractingText && (

            <ActivityIndicator
              size="small"
              color="#6C2BFF"
            />

          )}

        </TouchableOpacity>


        {/* =================================================
            DOCUMENT CARD
        ================================================= */}

        {fileName ? (

          <View style={styles.fileCard}>

            <Text style={styles.fileIcon}>
              📄
            </Text>


            <View style={{ flex: 1 }}>

              <Text
                style={styles.fileTitle}
                numberOfLines={1}
              >
                {fileName}
              </Text>


              <Text style={styles.fileSub}>

                {extractingText

                  ? '⏳ Reading document...'

                  : documentReady

                  ? `✅ Document loaded — ${documentText.length.toLocaleString()} characters`

                  : '📎 Document attached'}

              </Text>

            </View>


            {extractingText ? (

              <ActivityIndicator
                size="small"
                color="#6C2BFF"
              />

            ) : (

              <View
                style={[
                  styles.statusBadge,

                  documentReady
                    ? styles.readyBadge
                    : styles.pendingBadge,
                ]}
              >

                <Text
                  style={[
                    styles.statusText,

                    documentReady
                      ? styles.readyText
                      : styles.pendingText,
                  ]}
                >

                  {documentReady
                    ? '✅ Ready'
                    : '📎 Attached'}

                </Text>

              </View>

            )}

          </View>

        ) : null}


        {/* =================================================
            TIP
        ================================================= */}

        <View style={styles.tipContainer}>

          <Text style={styles.tipText}>

            💡{' '}

            {documentReady

              ? 'AI has read your PDF. Ask questions about its content!'

              : 'Upload a PDF to ask questions directly from your study material.'}

          </Text>

        </View>


        {/* =================================================
            CHAT MESSAGES
        ================================================= */}

        <ScrollView

          ref={scrollViewRef}

          style={styles.chatScrollView}

          contentContainerStyle={styles.chatContent}

          showsVerticalScrollIndicator={false}

        >

          {messages.map((msg, index) => (

            <View

              key={index}

              style={[

                styles.messageWrapper,

                msg.role === 'user'
                  ? styles.userWrapper
                  : styles.assistantWrapper,

              ]}
            >

              <View
                style={[

                  styles.messageBubble,

                  msg.role === 'user'
                    ? styles.userBubble
                    : styles.assistantBubble,

                ]}
              >

                <Text
                  style={[

                    styles.messageText,

                    msg.role === 'user'
                      ? styles.userText
                      : styles.assistantText,

                  ]}
                >

                  {msg.content}

                </Text>

              </View>


              <Text style={styles.messageLabel}>

                {msg.role === 'user'
                  ? 'You'
                  : 'StudyGenie'}

              </Text>

            </View>

          ))}


          {/* TYPING INDICATOR */}

          {loading && (

            <View style={styles.loadingWrapper}>

              <View
                style={[
                  styles.messageBubble,
                  styles.assistantBubble,
                ]}
              >

                <View style={styles.typingContainer}>

                  <View style={styles.dot} />

                  <View
                    style={[
                      styles.dot,
                      styles.dotDelay,
                    ]}
                  />

                  <View
                    style={[
                      styles.dot,
                      styles.dotDelay2,
                    ]}
                  />

                </View>

              </View>

            </View>

          )}

        </ScrollView>


        {/* =================================================
            INPUT BAR
        ================================================= */}

        <View style={styles.inputContainer}>

          <TextInput

            style={styles.input}

            placeholder={
              documentReady
                ? 'Ask about your PDF...'
                : 'Type your question...'
            }

            placeholderTextColor="#999"

            value={question}

            onChangeText={setQuestion}

            multiline

            maxLength={500}

            editable={
              !loading &&
              !extractingText
            }

            returnKeyType="send"

            onSubmitEditing={askQuestion}

          />


          <TouchableOpacity

            style={[

              styles.sendBtn,

              (
                !question.trim() ||
                loading ||
                extractingText
              ) &&
                styles.sendBtnDisabled,

            ]}

            onPress={askQuestion}

            disabled={
              !question.trim() ||
              loading ||
              extractingText
            }

          >

            {loading ? (

              <ActivityIndicator
                color="#fff"
                size="small"
              />

            ) : (

              <Text style={styles.sendBtnText}>
                →
              </Text>

            )}

          </TouchableOpacity>

        </View>


        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <TouchableOpacity

          style={styles.backBtn}

          onPress={() =>
            navigation.navigate('Materials')
          }

        >

          <Text style={styles.btnText}>
            ← Back to Materials
          </Text>

        </TouchableOpacity>


      </KeyboardAvoidingView>

    </SafeAreaView>

  );
}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },

  subtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },

  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },

  clearBtnText: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '600',
  },


  // ===================================================
  // UPLOAD BUTTON
  // ===================================================

  uploadButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  uploadButtonIcon: {
    fontSize: 25,
    marginRight: 12,
  },

  uploadButtonTitle: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 14,
  },

  uploadButtonSubtitle: {
    color: '#777',
    fontSize: 11,
    marginTop: 3,
  },


  // ===================================================
  // DOCUMENT CARD
  // ===================================================

  fileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 5,

    elevation: 2,
  },

  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  fileTitle: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 14,
  },

  fileSub: {
    color: '#666',
    fontSize: 11,
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  readyBadge: {
    backgroundColor: '#e8f5e9',
  },

  pendingBadge: {
    backgroundColor: '#fff3e0',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },

  readyText: {
    color: '#2e7d32',
  },

  pendingText: {
    color: '#e65100',
  },


  // ===================================================
  // TIP
  // ===================================================

  tipContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  tipText: {
    color: '#1565c0',
    fontSize: 12,
  },


  // ===================================================
  // CHAT
  // ===================================================

  chatScrollView: {
    flex: 1,
  },

  chatContent: {
    paddingVertical: 10,
  },

  messageWrapper: {
    marginBottom: 16,
  },

  userWrapper: {
    alignItems: 'flex-end',
  },

  assistantWrapper: {
    alignItems: 'flex-start',
  },

  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
  },

  userBubble: {
    backgroundColor: '#6C2BFF',
    borderBottomRightRadius: 4,
  },

  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 5,

    elevation: 2,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },

  userText: {
    color: '#fff',
  },

  assistantText: {
    color: '#1a1a2e',
  },

  messageLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 4,
  },


  // ===================================================
  // LOADING
  // ===================================================

  loadingWrapper: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C2BFF',
    marginHorizontal: 3,
    opacity: 0.4,
  },

  dotDelay: {
    opacity: 0.6,
  },

  dotDelay2: {
    opacity: 0.8,
  },


  // ===================================================
  // INPUT
  // ===================================================

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 12,
    gap: 8,
  },

  input: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    paddingRight: 50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 100,
    color: '#1a1a2e',
    fontSize: 15,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 5,

    elevation: 2,
  },

  sendBtn: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C2BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendBtnDisabled: {
    opacity: 0.5,
  },

  sendBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },


  // ===================================================
  // BACK
  // ===================================================

  backBtn: {
    backgroundColor: '#1a1a2e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },

});
