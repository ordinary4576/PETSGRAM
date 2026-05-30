import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import Toast from 'react-native-toast-message';
import { Award, LogOut, ShieldAlert } from 'lucide-react-native';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  // Fetch gamified badge milestones achieved by user
  const { data: badges = [], isLoading, refetch } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: async () => {
      // In production: GET /api/v1/users/:id/badges
      const res = await apiClient.get('/admin/moderation'); // tests auth connection
      // Return beautiful mock gamified badges for rendering
      return [
        { id: 'b1', title: 'Noble Foster Care', iconType: 'gold', description: 'Awarded for shelter allocations' },
        { id: 'b2', title: 'Community Savior', iconType: 'silver', description: 'Assigned for active rescue alerts' }
      ];
    },
    enabled: !!user
  });

  const handleLogout = async () => {
    Alert.alert(
      '🐾 Sign Out',
      'Are you sure you want to end your active session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            Toast.show({
              type: 'info',
              text1: 'Signed Out',
              text2: 'Session token keychains purged.'
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{user?.name?.substring(0, 2).toUpperCase() || 'US'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'Anonymous User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'USER'}</Text>
          </View>
        </View>

        {/* Dynamic RBAC Controls mapping moderation triggers */}
        {(user?.role === 'MODERATOR' || user?.role === 'ADMIN') && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>🛡️ Moderation Desk</Text>
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => Toast.show({ type: 'info', text1: 'Loading moderators logs...' })}
            >
              <ShieldAlert color="#d97452" size={20} />
              <Text style={styles.adminBtnText}>Open Flagged Content Queue</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>🏆 Gamified Badges Unlocked</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#d97452" />
          ) : (
            <View style={styles.badgesGrid}>
              {badges.map((badge: any) => (
                <View key={badge.id} style={styles.badgeCard}>
                  <Award color={badge.iconType === 'gold' ? '#e69138' : '#8e8276'} size={32} />
                  <Text style={styles.badgeTitle}>{badge.title}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#ffffff" size={18} />
          <Text style={styles.logoutText}>End active Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf6f0'
  },
  container: {
    padding: 24,
    gap: 24
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eae3db',
    gap: 8,
    shadowColor: '#4a3f35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d97452',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4a3f35'
  },
  profileEmail: {
    fontSize: 13,
    color: '#8e8276',
    fontWeight: '600'
  },
  roleBadge: {
    backgroundColor: '#faf6f0',
    borderWidth: 1,
    borderColor: '#eae3db',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#d97452'
  },
  adminSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eae3db',
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4a3f35',
    marginBottom: 4
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf6f0',
    borderWidth: 1,
    borderColor: '#eae3db',
    padding: 12,
    borderRadius: 8,
    gap: 10
  },
  adminBtnText: {
    fontSize: 13,
    color: '#4a3f35',
    fontWeight: '700'
  },
  badgesSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eae3db',
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  badgesGrid: {
    flexDirection: 'row',
    gap: 12
  },
  badgeCard: {
    flex: 1,
    backgroundColor: '#faf6f0',
    borderWidth: 1,
    borderColor: '#eae3db',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a3f35',
    textAlign: 'center'
  },
  badgeDesc: {
    fontSize: 9,
    color: '#8e8276',
    textAlign: 'center'
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d97452',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  }
});
