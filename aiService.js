// aiService.js
const API_URL = 'https://fyp-studygenie.onrender.com/api';

// ============ CHAT ============
export const askAI = async (question) => {
  try {
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        userId: 'user_' + Date.now()
      }),
    });

    const data = await response.json();

    if (data.success) {
      return data.answer;
    } else {
      return `❌ Error: ${data.message || 'Something went wrong'}`;
    }
  } catch (error) {
    console.error('❌ Chat error:', error);
    return '❌ Network error. Please check your connection.';
  }
};

// ============ SUMMARY ============
export const generateSummary = async (text, userId) => {
  try {
    const response = await fetch(`${API_URL}/ai/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        userId: userId || 'guest'
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Summary error:', error);
    return { success: false, message: error.message };
  }
};

// ============ PDF UPLOAD ============
export const uploadPdfMaterial = async (pdfFile, userId) => {
  try {
    console.log('📤 Processing PDF:', pdfFile.fileName || 'unnamed.pdf');
    
    const formData = new FormData();
    formData.append('pdf', {
      uri: pdfFile.uri,
      type: 'application/pdf',
      name: pdfFile.fileName || 'document.pdf',
    });
    formData.append('userId', userId || 'guest');

    const response = await fetch(`${API_URL}/pdf/summary`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        summary: data.summary,
        fileName: data.fileName,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
};

// ============ MATERIALS - FIREBASE ============

// Save material to Firebase
export const saveMaterialToFirebase = async (material, userId) => {
  try {
    const response = await fetch(`${API_URL}/materials/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material: material,
        userId: userId || 'guest'
      }),
    });

    const data = await response.json();
    console.log('✅ Material saved to Firebase:', data);
    return data;
  } catch (error) {
    console.error('❌ Error saving material to Firebase:', error);
    return { success: false, message: error.message };
  }
};

// Get all materials for a user
export const getMaterialsFromFirebase = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/materials/${userId || 'guest'}`);
    const data = await response.json();
    console.log('📚 Loaded', data.data?.length || 0, 'materials from Firebase');
    return data;
  } catch (error) {
    console.error('❌ Error getting materials from Firebase:', error);
    return { success: false, message: error.message };
  }
};

// Delete material from Firebase
export const deleteMaterialFromFirebase = async (materialId, userId) => {
  try {
    const response = await fetch(`${API_URL}/materials/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        materialId: materialId,
        userId: userId || 'guest'
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error deleting material from Firebase:', error);
    return { success: false, message: error.message };
  }
};

// ============ AUTH ============
export const signup = async (name, email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Signup error:', error);
    return { success: false, message: error.message };
  }
};

export const login = async (email) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Login error:', error);
    return { success: false, message: error.message };
  }
};