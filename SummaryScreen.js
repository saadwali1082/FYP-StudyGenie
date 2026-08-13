import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { summarizePDF } from './openaiService';
  
export default function SummaryScreen({ navigation }) {
  const [selectedPDF, setSelectedPDF] = useState(null); // { uri, name, size }
  const [loading, setLoading] = useState(false);
  const [bullets, setBullets] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // ─────────────────────────────────────────────
  // Pick PDF
  // ─────────────────────────────────────────────
  const pickPDF = async () => {
    try {
      setErrorMsg('');
      setBullets([]);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      setSelectedPDF({
        uri: asset.uri,
        name: asset.name || 'document.pdf',
        size: asset.size || 0,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not pick the PDF. Please try again.');
      console.error('PDF pick error:', error);
    }
  };

  // ─────────────────────────────────────────────
  // Generate Summary
  // ─────────────────────────────────────────────
  const handleSummarize = async () => {
    if (!selectedPDF) {
      Alert.alert('No PDF', 'Please pick a PDF file first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setBullets([]);

    const result = await summarizePDF(selectedPDF.uri, selectedPDF.name);

    setLoading(false);

    if (result.success) {
      setBullets(result.bullets);
    } else {
      setErrorMsg(result.message || 'Something went wrong. Please try again.');
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  const fileSizeKB = selectedPDF
    ? (selectedPDF.size / 1024).toFixed(1)
    : '0';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={styles.title}>AI Summary</Text>
        <Text style={styles.subtitle}>
          Upload a PDF and get a quick 3–5 point summary
        </Text>

        {/* ── PDF Picker Card ── */}
        <TouchableOpacity
          style={[
            styles.uploadCard,
            selectedPDF && styles.uploadCardSelected,
          ]}
          onPress={pickPDF}
          activeOpacity={0.8}
        >
          <Text style={styles.uploadIcon}>
            {selectedPDF ? '📄' : '📂'}
          </Text>

          {selectedPDF ? (
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={2}>
                {selectedPDF.name}
              </Text>
              <Text style={styles.fileSize}>{fileSizeKB} KB</Text>
              <Text style={styles.tapToChange}>Tap to change file</Text>
            </View>
          ) : (
            <View style={styles.fileInfo}>
              <Text style={styles.uploadTitle}>Tap to select a PDF</Text>
              <Text style={styles.uploadHint}>
                Supports any PDF document
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Summarize Button ── */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (!selectedPDF || loading) && styles.primaryBtnDisabled,
          ]}
          onPress={handleSummarize}
          disabled={!selectedPDF || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.btnText}>  Summarizing...</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>✨ Generate Summary</Text>
          )}
        </TouchableOpacity>

        {/* ── Loading hint ── */}
        {loading && (
          <Text style={styles.loadingHint}>
            Reading your PDF and generating bullet points...
          </Text>
        )}

        {/* ── Error Message ── */}
        {errorMsg !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* ── Bullet Points Result ── */}
        {bullets.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>📋 Summary</Text>
            <Text style={styles.resultSubtitle}>
              {bullets.length} key points from your document
            </Text>

            {bullets.map((bullet, index) => (
              <View key={index} style={styles.bulletCard}>
                <View style={styles.bulletBadge}>
                  <Text style={styles.bulletNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Back Button ── */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>← Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const PRIMARY = '#4CAF50';
const PRIMARY_DARK = '#388E3C';
const BG = '#f5f7fa';
const CARD = '#ffffff';
const TEXT = '#1a1a2e';
const MUTED = '#6b7280';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
  },

  // Header
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: TEXT,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 28,
    lineHeight: 20,
  },

  // Upload Card
  uploadCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  uploadCardSelected: {
    borderColor: PRIMARY,
    borderStyle: 'solid',
    backgroundColor: '#f0faf0',
  },
  uploadIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: MUTED,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 3,
  },
  fileSize: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
  tapToChange: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '600',
  },

  // Primary Button
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingHint: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 13,
    marginBottom: 16,
  },

  // Error Card
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20,
  },

  // Results
  resultSection: {
    marginTop: 6,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 16,
  },
  bulletCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  bulletBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 1,
    flexShrink: 0,
  },
  bulletNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bulletText: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    lineHeight: 23,
  },

  // Back Button
  backBtn: {
    backgroundColor: TEXT,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
