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
import { askChatbot } from './openaiService';
import { colors, shadow } from './theme';

export default function ChatbotScreen({ navigation, route }) {
  const material = route?.params || {};
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const scrollViewRef = useRef();

  useEffect(() => {
    if (messages.length === 0) {
      let welcomeMessage = '👋 Hi! I\'m StudyGenie powered by Google Gemini AI. Ask me anything about your studies!';
      
      if (material.fileName) {
        welcomeMessage = `📚 Hi! I see you uploaded "${material.fileName}". I'm here to help you with any study questions you have!`;
      }
      
      setMessages([
        {
          role: 'assistant',
          content: welcomeMessage
        }
      ]);
    }
  }, [messages.length, material.fileName]);

  const askQuestion = async () => {
    if (!question.trim()) {
      Alert.alert('Empty Question', 'Please type a question first.');
      return;
    }

    if (loading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setLoading(true);

    // Create the updated message list with the user's new message
    const updatedMessages = [...messages, { role: 'user', content: userQuestion }];
    setMessages(updatedMessages);

    try {
      // Use text or summary if available, to provide context to the AI
      const documentContext = material.text || material.summary || '';
      
      const result = await askChatbot(updatedMessages, documentContext);

      if (result.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: result.answer 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `❌ Error: ${result.message}` 
        }]);
      }
    } catch (error) {
      console.log('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Sorry, I\'m having trouble right now. Please try again in a moment.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Clear the conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            let welcomeMessage = '👋 Chat cleared! Ask me anything new!';
            if (material.fileName) {
              welcomeMessage = `📚 Chat cleared! I still remember your document "${material.fileName}". Ask me anything!`;
            }
            setMessages([
              { role: 'assistant', content: welcomeMessage }
            ]);
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🤖 StudyGenie</Text>
            <Text style={styles.subtitle}>Ask me anything!</Text>
          </View>
          {messages.length > 1 && (
            <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {material.fileName && (
          <View style={styles.fileCard}>
            <Text style={styles.fileIcon}>📚</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileTitle}>{material.fileName}</Text>
              <Text style={styles.fileSub}>Document uploaded - Ask any questions!</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✅ Ready</Text>
            </View>
          </View>
        )}

        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            💡 {material.fileName ? 'Ask questions about your studies or this document!' : 'Ask any study-related question!'}
          </Text>
        </View>

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
                msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper
              ]}
            >
              <View style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.assistantText
                ]}>
                  {msg.content}
                </Text>
              </View>
              <Text style={styles.messageLabel}>
                {msg.role === 'user' ? 'You' : 'StudyGenie'}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={styles.loadingWrapper}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <View style={styles.typingContainer}>
                  <View style={styles.dot} />
                  <View style={[styles.dot, styles.dotDelay]} />
                  <View style={[styles.dot, styles.dotDelay2]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your question..."
            placeholderTextColor="#999"
            value={question}
            onChangeText={setQuestion}
            multiline
            maxLength={500}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={askQuestion}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!question.trim() || loading) && styles.sendBtnDisabled]}
            onPress={askQuestion}
            disabled={!question.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>→</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Materials')}
        >
          <Text style={styles.btnText}>← Back to Materials</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  fileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    ...shadow,
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
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#2e7d32',
    fontSize: 10,
    fontWeight: '600',
  },
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
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    ...shadow,
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
    backgroundColor: '#4CAF50',
    marginHorizontal: 3,
    opacity: 0.4,
  },
  dotDelay: {
    opacity: 0.6,
  },
  dotDelay2: {
    opacity: 0.8,
  },
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
    ...shadow,
  },
  sendBtn: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
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