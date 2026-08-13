import React, { useState, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, SafeAreaView } from 'react-native';
import { colors, shadow } from './theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLANS_STORAGE_KEY = 'STUDY_PLANS';

export default function HomeScreen({ navigation, materials = [] }) {
  const [activeAction, setActiveAction] = useState(null);
  const [plansCount, setPlansCount] = useState(0);

  // Load plans count
  const loadPlansCount = async () => {
    try {
      const saved = await AsyncStorage.getItem(PLANS_STORAGE_KEY);
      if (saved) {
        const plans = JSON.parse(saved);
        // Count only future/scheduled plans
        const futurePlans = plans.filter(plan => {
          const planDate = new Date(plan.fullDate);
          return planDate > new Date();
        });
        setPlansCount(futurePlans.length);
      }
    } catch (error) {
      console.error('Error loading plans count:', error);
    }
  };

  useEffect(() => {
    loadPlansCount();
  }, []);

  const actions = [
    ['📤', 'Upload', 'Materials'],
    ['💬', 'Chatbot', 'Chatbot'],
    ['📅', 'Planner', 'Planner'],
    ['📝', 'Summary', 'Summary'],
    ['🎴', 'Flashcards', 'Flashcards'],
    ['📊', 'Quiz', 'Quiz'],
  ];

  const handleActionPress = (actionName, screenName) => {
    setActiveAction(actionName);
    navigation.navigate(screenName);
    setTimeout(() => setActiveAction(null), 300);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome back 👋</Text>
            <Text style={styles.title}>StudyGenie</Text>
            <Text style={styles.subtitle}>Your smart study dashboard</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.hero} 
          onPress={() => navigation.navigate('Chatbot')}
          activeOpacity={0.8}
        >
          <View>
            <Text style={styles.heroTitle}>Ask StudyGenie</Text>
            <Text style={styles.heroText}>Get help from your AI study assistant</Text>
          </View>
          <Text style={styles.heroIcon}>🤖</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{materials.length}</Text>
            <Text style={styles.statLabel}>Materials</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>💬</Text>
            <Text style={styles.statLabel}>AI Chat</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{plansCount}</Text>
            <Text style={styles.statLabel}>Plans</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          {actions.map((item, index) => {
            const isActive = activeAction === item[1];
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionCard,
                  isActive && styles.actionCardActive,
                ]}
                onPress={() => handleActionPress(item[1], item[2])}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconBox,
                  isActive && styles.iconBoxActive,
                ]}>
                  <Text style={[
                    styles.icon,
                    isActive && styles.iconActive,
                  ]}>
                    {item[0]}
                  </Text>
                </View>
                <Text style={[
                  styles.actionText,
                  isActive && styles.actionTextActive,
                ]}>
                  {item[1]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Material</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Materials')}>
            <Text style={styles.link}>See All</Text>
          </TouchableOpacity>
        </View>

        {materials.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No material uploaded yet</Text>
            <Text style={styles.emptyText}>
              Upload your first study material to get started with AI assistance.
            </Text>
          </View>
        ) : (
          materials.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.materialCard}>
              <Text style={styles.pdfIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.materialTitle}>{item.fileName}</Text>
                <Text style={styles.materialSub}>Uploaded: {item.uploadedAt}</Text>
              </View>
              <TouchableOpacity 
                style={styles.materialAction}
                onPress={() => navigation.navigate('Chatbot', { fileName: item.fileName })}
                activeOpacity={0.7}
              >
                <Text style={styles.materialActionText}>💬</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {plansCount > 0 && (
          <View style={styles.reminderBadgeContainer}>
            <Text style={styles.reminderBadgeText}>
              ⏰ You have {plansCount} upcoming study {plansCount === 1 ? 'plan' : 'plans'}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Navigation - Fixed at bottom */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <Text style={styles.navActive}>🏠</Text>
          <Text style={styles.navActiveText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Flashcards')}
          activeOpacity={0.7}
        >
          <Text style={styles.nav}>🎴</Text>
          <Text style={styles.navText}>Flashcards</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Quiz')}
          activeOpacity={0.7}
        >
          <Text style={styles.nav}>📊</Text>
          <Text style={styles.navText}>Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.nav}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: { color: colors.muted, fontSize: 13 },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginTop: 4 },
  subtitle: { color: colors.muted, marginTop: 4 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: 'bold' },
  hero: {
    backgroundColor: colors.primary,
    padding: 22,
    borderRadius: 26,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow,
  },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  heroText: { color: colors.white, marginTop: 6 },
  heroIcon: { fontSize: 48 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  statCard: {
    width: '31%',
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 22,
    alignItems: 'center',
    ...shadow,
  },
  statNumber: { color: colors.primary, fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: colors.muted, marginTop: 4, fontSize: 12 },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 28,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '30%',
    backgroundColor: colors.card,
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: 'center',
    marginBottom: 14,
    ...shadow,
  },
  actionCardActive: {
    backgroundColor: colors.primary,
    transform: [{ scale: 0.95 }],
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconBoxActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  icon: { fontSize: 22 },
  iconActive: {
    color: '#fff',
  },
  actionText: { 
    color: colors.text, 
    fontWeight: 'bold', 
    fontSize: 11 
  },
  actionTextActive: {
    color: '#fff',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: { color: colors.primary, fontWeight: 'bold', marginTop: 18 },
  emptyCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 22,
    ...shadow,
  },
  emptyTitle: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
  emptyText: { color: colors.muted, marginTop: 8, lineHeight: 22 },
  materialCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...shadow,
  },
  pdfIcon: { fontSize: 30, marginRight: 12 },
  materialTitle: { color: colors.text, fontWeight: 'bold' },
  materialSub: { color: colors.muted, fontSize: 12, marginTop: 3 },
  materialAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialActionText: { fontSize: 18 },
  bottomSpacer: {
    height: 20,
  },
  reminderBadgeContainer: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  reminderBadgeText: {
    color: '#E65100',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e8ece8',
    ...shadow,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  nav: {
    fontSize: 20,
    color: colors.muted,
  },
  navText: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  navActive: {
    fontSize: 20,
    color: colors.primary,
  },
  navActiveText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
