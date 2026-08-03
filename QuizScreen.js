import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, ScrollView, SafeAreaView 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { generateQuiz } from './openaiService';
import { shadow } from './theme';

export default function QuizScreen({ navigation }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setQuestions([]);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setScore(0);
        setShowResults(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    setLoading(true);
    
    const result = await generateQuiz(selectedFile.uri, selectedFile.name);
    
    if (result.success) {
      setQuestions(result.questions);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setShowResults(false);
    } else {
      Alert.alert('Error', result.message || 'Failed to generate quiz');
    }
    setLoading(false);
  };

  const handleSelectAnswer = (optionIndex) => {
    if (selectedAnswer !== null) return;
    
    const letters = ['A', 'B', 'C', 'D'];
    const chosenLetter = letters[optionIndex];
    setSelectedAnswer(chosenLetter);

    if (chosenLetter === questions[currentIndex].correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>📝 Quiz Mode</Text>
            <Text style={styles.subtitle}>Test your knowledge from a PDF</Text>
          </View>
        </View>

        {!questions.length && !showResults && (
          <>
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

            {selectedFile && (
              <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateBtnText}>✨ Generate Quiz</Text>}
              </TouchableOpacity>
            )}
          </>
        )}

        {questions.length > 0 && !showResults && (
          <ScrollView style={styles.quizArea} showsVerticalScrollIndicator={false}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Question {currentIndex + 1} of {questions.length}</Text>
              <Text style={styles.scoreText}>Score: {score}</Text>
            </View>
            
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{questions[currentIndex].question}</Text>
            </View>

            <View style={styles.optionsContainer}>
              {questions[currentIndex].options.map((option, index) => {
                const letter = ['A', 'B', 'C', 'D'][index];
                const isSelected = selectedAnswer === letter;
                const isCorrect = letter === questions[currentIndex].correct;
                
                let optionStyle = styles.optionBtn;
                let textStyle = styles.optionText;

                if (selectedAnswer !== null) {
                  if (isCorrect) {
                    optionStyle = [styles.optionBtn, styles.optionCorrect];
                    textStyle = [styles.optionText, styles.textWhite];
                  } else if (isSelected && !isCorrect) {
                    optionStyle = [styles.optionBtn, styles.optionWrong];
                    textStyle = [styles.optionText, styles.textWhite];
                  }
                }

                return (
                  <TouchableOpacity 
                    key={index} 
                    style={optionStyle}
                    onPress={() => handleSelectAnswer(index)}
                    disabled={selectedAnswer !== null}
                    activeOpacity={0.7}
                  >
                    <Text style={textStyle}>
                      <Text style={styles.optionLetter}>{letter})</Text> {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedAnswer !== null && (
              <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
                <Text style={styles.nextBtnText}>
                  {currentIndex === questions.length - 1 ? 'See Results 🏆' : 'Next Question →'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {showResults && (
          <View style={styles.resultsArea}>
            <Text style={styles.resultsIcon}>🏆</Text>
            <Text style={styles.resultsTitle}>Quiz Complete!</Text>
            <Text style={styles.resultsScore}>You scored {score} out of {questions.length}</Text>
            
            <Text style={styles.resultsFeedback}>
              {score === questions.length ? 'Perfect score! Amazing job!' : 
               score >= questions.length / 2 ? 'Good effort! Keep studying.' : 
               'Time to review your notes!'}
            </Text>

            <TouchableOpacity 
              style={styles.generateBtn} 
              onPress={() => {
                setQuestions([]);
                setSelectedFile(null);
                setShowResults(false);
              }}
            >
              <Text style={styles.generateBtnText}>Start New Quiz</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
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
  quizArea: { flex: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  scoreText: { fontSize: 14, fontWeight: 'bold', color: '#2196F3' },
  questionCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, marginBottom: 24, borderLeftWidth: 5, borderLeftColor: '#2196F3', ...shadow },
  questionText: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', lineHeight: 28 },
  optionsContainer: { gap: 12, marginBottom: 20 },
  optionBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  optionCorrect: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  optionWrong: { backgroundColor: '#f44336', borderColor: '#f44336' },
  optionText: { fontSize: 16, color: '#333', lineHeight: 24 },
  optionLetter: { fontWeight: 'bold' },
  textWhite: { color: '#fff', fontWeight: 'bold' },
  nextBtn: { backgroundColor: '#2196F3', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20, ...shadow },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultsArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultsIcon: { fontSize: 80, marginBottom: 20 },
  resultsTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 10 },
  resultsScore: { fontSize: 20, color: '#4CAF50', fontWeight: '600', marginBottom: 10 },
  resultsFeedback: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  backBtn: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, marginBottom: 20 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});