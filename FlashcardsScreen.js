import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, ScrollView, SafeAreaView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { generateFlashcards } from './openaiService';
import { shadow } from './theme';

export default function FlashcardsScreen({ navigation }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setCards([]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    setLoading(true);
    
    const result = await generateFlashcards(selectedFile.uri, selectedFile.name);
    
    if (result.success) {
      setCards(result.cards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } else {
      Alert.alert('Error', result.message || 'Failed to generate flashcards');
    }
    setLoading(false);
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🃏 Flashcards</Text>
            <Text style={styles.subtitle}>Upload a PDF to generate study cards</Text>
          </View>
        </View>

        {!cards.length && (
          <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
            <View style={styles.iconCircle}>
              <Text style={styles.uploadIcon}>📄</Text>
            </View>
            <Text style={styles.uploadTitle}>
              {selectedFile ? selectedFile.name : 'Select PDF Document'}
            </Text>
            <Text style={styles.uploadSub}>
              {selectedFile ? 'Tap to change file' : 'Browse files'}
            </Text>
          </TouchableOpacity>
        )}

        {selectedFile && cards.length === 0 && (
          <TouchableOpacity 
            style={styles.generateBtn} 
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateBtnText}>✨ Generate Flashcards</Text>
            )}
          </TouchableOpacity>
        )}

        {cards.length > 0 && (
          <View style={styles.flashcardArea}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Card {currentIndex + 1} of {cards.length}</Text>
              <TouchableOpacity onPress={() => setCards([])}>
                <Text style={styles.resetText}>New PDF</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.card, isFlipped ? styles.cardFlipped : null]} 
              onPress={() => setIsFlipped(!isFlipped)}
              activeOpacity={0.9}
            >
              <ScrollView contentContainerStyle={styles.cardContent}>
                <Text style={styles.cardLabel}>{isFlipped ? 'ANSWER' : 'QUESTION'}</Text>
                <Text style={[styles.cardText, isFlipped && styles.cardTextAnswer]}>
                  {isFlipped ? cards[currentIndex].answer : cards[currentIndex].question}
                </Text>
              </ScrollView>
              <Text style={styles.tapHint}>Tap anywhere to flip</Text>
            </TouchableOpacity>

            <View style={styles.controls}>
              <TouchableOpacity 
                style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]} 
                onPress={prevCard}
                disabled={currentIndex === 0}
              >
                <Text style={styles.navBtnText}>← Prev</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navBtn, currentIndex === cards.length - 1 && styles.navBtnDisabled]} 
                onPress={nextCard}
                disabled={currentIndex === cards.length - 1}
              >
                <Text style={styles.navBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7fa' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e' },
  subtitle: { color: '#666', fontSize: 14, marginTop: 4 },
  uploadArea: { borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed', borderRadius: 16, padding: 30, alignItems: 'center', backgroundColor: '#fff', marginBottom: 20 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f5f7fa', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  uploadIcon: { fontSize: 30 },
  uploadTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4, textAlign: 'center' },
  uploadSub: { fontSize: 14, color: '#666' },
  generateBtn: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20, ...shadow },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  flashcardArea: { flex: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  resetText: { fontSize: 14, color: '#e53935', fontWeight: '600' },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, justifyContent: 'space-between', borderWidth: 1, borderColor: '#e0e0e0', borderBottomWidth: 4, borderBottomColor: '#2196F3', ...shadow },
  cardFlipped: { borderBottomColor: '#4CAF50', backgroundColor: '#f9fbe7' },
  cardContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontSize: 12, fontWeight: 'bold', color: '#999', letterSpacing: 2, marginBottom: 16 },
  cardText: { fontSize: 22, fontWeight: '600', color: '#1a1a2e', textAlign: 'center', lineHeight: 32 },
  cardTextAnswer: { fontWeight: '400', color: '#2e7d32' },
  tapHint: { textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 20 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  navBtn: { backgroundColor: '#e3f2fd', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, flex: 0.48, alignItems: 'center' },
  navBtnDisabled: { opacity: 0.5, backgroundColor: '#f5f5f5' },
  navBtnText: { color: '#1565c0', fontWeight: 'bold', fontSize: 16 },
  backBtn: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, marginBottom: 20 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});