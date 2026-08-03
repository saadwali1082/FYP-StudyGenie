// MaterialsScreen.js

import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { colors, shadow } from './theme';
import { saveMaterials } from './storageService';
import { saveMaterialToFirebase } from './aiService';

const { width, height } = Dimensions.get('window');

// Use a stable user ID instead of Date.now()
const USER_ID = 'studygenie-user';

export default function MaterialsScreen({
  navigation,
  materials = [],
  setMaterials,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualText, setManualText] = useState('');
  const [inputType, setInputType] = useState('image');

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // =====================================================
  // SELECT IMAGE
  // =====================================================

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow gallery permission to select an image.'
        );

        return;
      }

      setIsLoading(true);

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,

          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];

        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || 'image.jpg',
          type: 'image',
          size: asset.fileSize || 0,
          base64: asset.base64 || '',
          width: asset.width,
          height: asset.height,
        });
      }
    } catch (error) {
      console.error('Image selection error:', error);

      Alert.alert(
        'Error',
        'The image could not be selected.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // SELECT PDF
  // =====================================================

  const pickPDF = async () => {
    try {
      setIsLoading(true);

      const result =
        await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
        });

      if (result.canceled) {
        return;
      }

      if (result.assets?.length > 0) {
        const asset = result.assets[0];

        setSelectedFile({
          uri: asset.uri,
          name: asset.name || 'document.pdf',
          type: 'pdf',
          size: asset.size || 0,
          mimeType: asset.mimeType,
        });
      }
    } catch (error) {
      console.error('PDF selection error:', error);

      Alert.alert(
        'Error',
        'The PDF could not be selected.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // SAVE MATERIAL
  // =====================================================

  const saveMaterial = async () => {
    if (inputType === 'image' && !selectedFile) {
      Alert.alert(
        'Select Image',
        'Please select an image first.'
      );

      return;
    }

    if (inputType === 'pdf' && !selectedFile) {
      Alert.alert(
        'Select PDF',
        'Please select a PDF first.'
      );

      return;
    }

    if (
      inputType === 'text' &&
      !manualText.trim()
    ) {
      Alert.alert(
        'Enter Text',
        'Please type or paste your study material.'
      );

      return;
    }

    let newMaterial;

    if (inputType === 'image') {
      newMaterial = {
        id: Date.now().toString(),
        fileName:
          selectedFile.name || 'Image.jpg',

        fileData: selectedFile.base64 || '',
        fileUri: selectedFile.uri,
        fileType: 'image',

        uploadedAt:
          new Date().toLocaleDateString(),

        summary: '',
        text: '',
        preview: selectedFile.uri,
        size: selectedFile.size || 0,
      };
    } else if (inputType === 'pdf') {
      newMaterial = {
        id: Date.now().toString(),
        fileName:
          selectedFile.name || 'document.pdf',

        fileUri: selectedFile.uri,
        fileType: 'pdf',

        uploadedAt:
          new Date().toLocaleDateString(),

        summary: '',
        text: '',
        preview: null,
        size: selectedFile.size || 0,
      };
    } else {
      newMaterial = {
        id: Date.now().toString(),
        fileName: 'Manual Text',

        text: manualText.trim(),
        fileType: 'text',

        uploadedAt:
          new Date().toLocaleDateString(),

        summary: '',
        preview: null,
        size: manualText.trim().length,
      };
    }

    setSaving(true);

    try {
      const updatedMaterials = [
        newMaterial,
        ...materials,
      ];

      // Update screen
      setMaterials(updatedMaterials);

      // Save permanently
      const saved =
        await saveMaterials(updatedMaterials);

      if (!saved) {
        throw new Error(
          'Material could not be saved locally.'
        );
      }

      // Firebase is optional.
      // Local saving still works if Firebase fails.
      try {
        const firebaseResult =
          await saveMaterialToFirebase(
            newMaterial,
            USER_ID
          );

        if (firebaseResult?.success) {
          console.log(
            'Material saved to Firebase'
          );
        }
      } catch (firebaseError) {
        console.log(
          'Firebase save skipped:',
          firebaseError?.message
        );
      }

      setSelectedFile(null);
      setManualText('');

      if (Platform.OS === 'web') {
        window.alert(
          'Material saved successfully.'
        );
      } else {
        Alert.alert(
          'Success',
          'Material saved successfully.'
        );
      }
    } catch (error) {
      console.error(
        'Material save error:',
        error
      );

      if (Platform.OS === 'web') {
        window.alert(
          'Failed to save material.'
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to save material.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE MATERIAL
  // =====================================================

  const confirmDeleteMaterial = async (
    materialId,
    materialName
  ) => {
    if (deletingId !== null) {
      return;
    }

    setDeletingId(materialId);

    try {
      const updatedMaterials =
        materials.filter(
          item =>
            String(item.id) !==
            String(materialId)
        );

      // Remove document from screen immediately
      setMaterials(updatedMaterials);

      // Save updated list, including empty array
      const saved =
        await saveMaterials(updatedMaterials);

      if (!saved) {
        throw new Error(
          'Updated materials could not be saved.'
        );
      }

      // Close preview when the open item is deleted
      if (
        previewItem &&
        String(previewItem.id) ===
          String(materialId)
      ) {
        setPreviewItem(null);
        setPreviewVisible(false);
      }

      if (Platform.OS === 'web') {
        window.alert(
          `"${materialName}" has been deleted.`
        );
      } else {
        Alert.alert(
          'Deleted',
          `"${materialName}" has been deleted.`
        );
      }
    } catch (error) {
      console.error(
        'Material delete error:',
        error
      );

      if (Platform.OS === 'web') {
        window.alert(
          'Failed to delete material. Please try again.'
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to delete material. Please try again.'
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteMaterial = (
    materialId,
    materialName
  ) => {
    // React Native Alert confirmation buttons
    // are not reliable on Expo Web.
    if (Platform.OS === 'web') {
      const shouldDelete =
        window.confirm(
          `Are you sure you want to delete "${materialName}"?`
        );

      if (shouldDelete) {
        confirmDeleteMaterial(
          materialId,
          materialName
        );
      }

      return;
    }

    Alert.alert(
      'Delete Material',

      `Are you sure you want to delete "${materialName}"?`,

      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete',
          style: 'destructive',

          onPress: () =>
            confirmDeleteMaterial(
              materialId,
              materialName
            ),
        },
      ],

      {
        cancelable: true,
      }
    );
  };

  // =====================================================
  // PREVIEW
  // =====================================================

  const handlePreview = item => {
    setPreviewItem(item);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewItem(null);
  };

  const renderPreviewContent = () => {
    if (!previewItem) {
      return null;
    }

    if (previewItem.fileType === 'image') {
      return (
        <Image
          source={{
            uri:
              previewItem.fileUri ||
              previewItem.preview,
          }}
          style={styles.fullPreviewImage}
          resizeMode="contain"
        />
      );
    }

    if (previewItem.fileType === 'pdf') {
      const pdfUrl =
        previewItem.fileUri ||
        previewItem.uri;

      if (Platform.OS === 'web') {
        return (
          <View
            style={styles.webPdfContainer}
          >
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              style={styles.webPdfIframe}
            />
          </View>
        );
      }

      return (
        <View
          style={styles.pdfPreviewContainer}
        >
          <Text
            style={styles.pdfPreviewIcon}
          >
            📄
          </Text>

          <Text
            style={styles.pdfPreviewName}
          >
            {previewItem.fileName}
          </Text>

          <Text
            style={styles.pdfPreviewSize}
          >
            {(
              (previewItem.size || 0) / 1024
            ).toFixed(1)}{' '}
            KB
          </Text>

          <Text
            style={styles.pdfPreviewNote}
          >
            PDF selected successfully
          </Text>
        </View>
      );
    }

    return (
      <View
        style={styles.textPreviewContainer}
      >
        <Text
          style={styles.textPreviewTitle}
        >
          📝 Text Content
        </Text>

        <ScrollView
          style={styles.textPreviewScroll}
        >
          <Text
            style={styles.textPreviewContent}
          >
            {previewItem.text ||
              'No text available.'}
          </Text>
        </ScrollView>
      </View>
    );
  };

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Study Materials
      </Text>

      <Text style={styles.subtitle}>
        Upload images, PDFs, or type text for
        AI analysis
      </Text>

      {/* ADD MATERIAL CARD */}

      <View style={styles.uploadCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.bigIcon}>
            📚
          </Text>
        </View>

        <Text style={styles.cardTitle}>
          Add New Material
        </Text>

        {/* INPUT TYPE BUTTONS */}

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,

              inputType === 'image' &&
                styles.toggleActive,
            ]}
            onPress={() => {
              setInputType('image');
              setSelectedFile(null);
            }}
          >
            <Text
              style={[
                styles.toggleText,

                inputType === 'image' &&
                  styles.toggleTextActive,
              ]}
            >
              🖼️ Image
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,

              inputType === 'pdf' &&
                styles.toggleActive,
            ]}
            onPress={() => {
              setInputType('pdf');
              setSelectedFile(null);
            }}
          >
            <Text
              style={[
                styles.toggleText,

                inputType === 'pdf' &&
                  styles.toggleTextActive,
              ]}
            >
              📄 PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,

              inputType === 'text' &&
                styles.toggleActive,
            ]}
            onPress={() => {
              setInputType('text');
              setSelectedFile(null);
            }}
          >
            <Text
              style={[
                styles.toggleText,

                inputType === 'text' &&
                  styles.toggleTextActive,
              ]}
            >
              ✏️ Text
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOADING */}

        {isLoading && (
          <View
            style={styles.loadingContainer}
          >
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text
              style={styles.loadingText}
            >
              Loading file...
            </Text>
          </View>
        )}

        {/* IMAGE INPUT */}

        {inputType === 'image' &&
          !isLoading && (
            <View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={pickImage}
              >
                <Text style={styles.btnText}>
                  📁 Select Image
                </Text>
              </TouchableOpacity>

              {selectedFile && (
                <TouchableOpacity
                  style={styles.selectedBox}
                  onPress={() =>
                    handlePreview(
                      selectedFile
                    )
                  }
                >
                  <Image
                    source={{
                      uri: selectedFile.uri,
                    }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />

                  <Text
                    style={styles.selectedText}
                  >
                    📸 {selectedFile.name}
                  </Text>

                  <Text
                    style={
                      styles.selectedSubText
                    }
                  >
                    {(
                      (selectedFile.size ||
                        0) / 1024
                    ).toFixed(1)}{' '}
                    KB
                  </Text>

                  <Text
                    style={
                      styles.tapToPreview
                    }
                  >
                    Tap to preview
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        {/* PDF INPUT */}

        {inputType === 'pdf' &&
          !isLoading && (
            <View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={pickPDF}
              >
                <Text style={styles.btnText}>
                  📄 Select PDF
                </Text>
              </TouchableOpacity>

              {selectedFile && (
                <TouchableOpacity
                  style={styles.selectedBox}
                  onPress={() =>
                    handlePreview(
                      selectedFile
                    )
                  }
                >
                  <Text
                    style={styles.bigFileIcon}
                  >
                    📄
                  </Text>

                  <Text
                    style={styles.selectedText}
                  >
                    {selectedFile.name}
                  </Text>

                  <Text
                    style={
                      styles.selectedSubText
                    }
                  >
                    {(
                      (selectedFile.size ||
                        0) / 1024
                    ).toFixed(1)}{' '}
                    KB
                  </Text>

                  <Text
                    style={
                      styles.tapToPreview
                    }
                  >
                    Tap to preview
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        {/* TEXT INPUT */}

        {inputType === 'text' &&
          !isLoading && (
            <View>
              <TextInput
                style={styles.textInput}
                placeholder="Paste your study material here..."
                placeholderTextColor="#999"
                value={manualText}
                onChangeText={setManualText}
                multiline
                numberOfLines={6}
              />

              <Text style={styles.charCount}>
                {manualText.length} characters
              </Text>
            </View>
          )}

        {/* SAVE BUTTON */}

        <TouchableOpacity
          style={[
            styles.greenBtn,

            (saving || isLoading) &&
              styles.disabledBtn,
          ]}
          onPress={saveMaterial}
          disabled={saving || isLoading}
        >
          <Text style={styles.btnText}>
            {saving
              ? '⏳ Saving...'
              : '💾 Save Material'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DOCUMENT LIST */}

      <Text style={styles.sectionTitle}>
        My Documents ({materials.length})
      </Text>

      {materials.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No materials yet
          </Text>

          <Text style={styles.emptyText}>
            Upload an image, PDF, or paste
            text to start learning.
          </Text>
        </View>
      ) : (
        materials.map(item => (
          <View
            key={String(item.id)}
            style={styles.docCard}
          >
            <View style={styles.docTop}>
              <TouchableOpacity
                style={styles.docIconBox}
                onPress={() =>
                  handlePreview(item)
                }
              >
                <Text style={styles.docIcon}>
                  {item.fileType === 'image'
                    ? '🖼️'
                    : item.fileType === 'pdf'
                    ? '📄'
                    : '✏️'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.docInformation}
                onPress={() =>
                  handlePreview(item)
                }
              >
                <Text
                  style={styles.docTitle}
                  numberOfLines={2}
                >
                  {item.fileName}
                </Text>

                <Text style={styles.docSub}>
                  Uploaded:{' '}
                  {item.uploadedAt ||
                    'Just now'}
                </Text>

                <View
                  style={styles.docMetaRow}
                >
                  <Text style={styles.docMeta}>
                    {item.fileType === 'image'
                      ? '🖼️ Image'
                      : item.fileType ===
                        'pdf'
                      ? '📄 PDF'
                      : '✏️ Text'}
                  </Text>

                  <Text style={styles.docMeta}>
                    •
                  </Text>

                  <Text style={styles.docMeta}>
                    {item.text
                      ? `${item.text.length} characters`
                      : 'Ready'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Only one delete button is included */}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  navigation.navigate(
                    'Summary',
                    {
                      material: item,
                      fileName:
                        item.fileName,

                      text:
                        item.text || '',

                      fileType:
                        item.fileType ||
                        'text',
                    }
                  )
                }
              >
                <Text
                  style={styles.actionText}
                >
                  📝 Summary
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  navigation.navigate(
                    'Chatbot',
                    {
                      material: item,
                      fileName:
                        item.fileName,

                      text:
                        item.text || '',

                      fileType:
                        item.fileType,
                    }
                  )
                }
              >
                <Text
                  style={styles.actionText}
                >
                  💬 Ask AI
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.previewBtn,
                ]}
                onPress={() =>
                  handlePreview(item)
                }
              >
                <Text
                  style={styles.actionText}
                >
                  👁️ Preview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.deleteActionBtn,

                  deletingId === item.id &&
                    styles.disabledBtn,
                ]}
                onPress={() =>
                  handleDeleteMaterial(
                    item.id,
                    item.fileName
                  )
                }
                disabled={deletingId !== null}
              >
                <Text
                  style={
                    styles.deleteActionText
                  }
                >
                  {deletingId === item.id
                    ? '⏳ Deleting...'
                    : '🗑️ Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* BACK BUTTON */}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.btnText}>
          🏠 Back Home
        </Text>
      </TouchableOpacity>

      {/* PREVIEW MODAL */}

      <Modal
        visible={previewVisible}
        transparent
        animationType="slide"
        onRequestClose={closePreview}
      >
        <View style={styles.modalOverlay}>
          <View
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text
                style={styles.modalTitle}
                numberOfLines={2}
              >
                {previewItem?.fileName ||
                  previewItem?.name ||
                  'Preview'}
              </Text>

              {/* No second delete button here */}

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={closePreview}
              >
                <Text
                  style={
                    styles.closeBtnText
                  }
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {renderPreviewContent()}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  contentContainer: {
    padding: 22,
    paddingBottom: 50,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 35,
  },

  subtitle: {
    color: colors.muted,
    marginTop: 5,
    marginBottom: 22,
  },

  uploadCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 22,
    marginBottom: 28,
    ...shadow,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  bigIcon: {
    fontSize: 34,
  },

  cardTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },

  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 5,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },

  toggleActive: {
    backgroundColor: colors.primary,
  },

  toggleText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },

  toggleTextActive: {
    color: '#ffffff',
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },

  greenBtn: {
    backgroundColor:
      colors.secondary || '#4CAF50',

    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },

  disabledBtn: {
    opacity: 0.5,
  },

  btnText: {
    color: colors.white || '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  selectedBox: {
    backgroundColor: colors.softPurple,
    padding: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },

  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },

  bigFileIcon: {
    fontSize: 48,
  },

  selectedText: {
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  selectedSubText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },

  tapToPreview: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },

  textInput: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },

  charCount: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 14,
  },

  emptyCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 22,
    ...shadow,
  },

  emptyTitle: {
    color: colors.text,
    fontWeight: 'bold',
  },

  emptyText: {
    color: colors.muted,
    marginTop: 6,
  },

  docCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    ...shadow,
  },

  docTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  docIcon: {
    fontSize: 24,
  },

  docInformation: {
    flex: 1,
  },

  docTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 15,
  },

  docSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },

  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },

  docMeta: {
    color: colors.muted,
    fontSize: 11,
  },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },

  actionBtn: {
    backgroundColor: colors.softPurple,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 14,
  },

  previewBtn: {
    backgroundColor: '#E8F5E9',
  },

  deleteActionBtn: {
    backgroundColor: '#ffebee',
  },

  actionText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },

  deleteActionText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 12,
  },

  backBtn: {
    backgroundColor: colors.primaryDark,
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 40,
  },

  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: colors.muted,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: width * 0.9,
    maxHeight: height * 0.8,
    overflow: 'hidden',
    ...shadow,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 10,
  },

  closeBtn: {
    padding: 8,
  },

  closeBtnText: {
    fontSize: 24,
    color: colors.muted,
  },

  modalContent: {
    padding: 16,
    minHeight: 200,
  },

  fullPreviewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },

  pdfPreviewContainer: {
    alignItems: 'center',
    padding: 20,
  },

  pdfPreviewIcon: {
    fontSize: 80,
    marginBottom: 16,
  },

  pdfPreviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },

  pdfPreviewSize: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 16,
  },

  pdfPreviewNote: {
    color: colors.primary,
    marginTop: 12,
  },

  textPreviewContainer: {
    width: '100%',
  },

  textPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },

  textPreviewScroll: {
    maxHeight: 300,
  },

  textPreviewContent: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },

  webPdfContainer: {
    width: '100%',
    height: 500,
    backgroundColor: '#f5f5f5',
  },

  webPdfIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
});