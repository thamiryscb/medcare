import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import BottomNav from '../components/BottomNav';

const menuItems = [
  { screen: 'Remedios', icon: 'medkit', color: COLORS.primaryLight, iconColor: COLORS.primary, name: 'Meus Remédios', desc: 'Ver e cadastrar remédios' },
  { screen: 'Checklist', icon: 'checkbox', color: COLORS.successLight, iconColor: COLORS.success, name: 'Check-list Hoje', desc: '3 de 5 tomados' },
  { screen: 'Familia', icon: 'people', color: COLORS.purpleLight, iconColor: COLORS.purple, name: 'Família', desc: 'Alertas e cuidadores' },
];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.name}>Maria Aparecida</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>MA</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.nextCard}>
          <View style={styles.nextIcon}>
            <Ionicons name="notifications" size={22} color={COLORS.orange} />
          </View>
          <View>
            <Text style={styles.nextLabel}>Próximo lembrete</Text>
            <Text style={styles.nextMed}>Losartana 50mg</Text>
            <Text style={styles.nextTime}>Hoje às 12:00</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>O que você precisa?</Text>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={26} color={item.iconColor} />
              </View>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} active="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  body: { flex: 1, padding: 16 },
  nextCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderLeftWidth: 4, borderLeftColor: COLORS.orange, marginBottom: 20,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  nextIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#fff8e6', alignItems: 'center', justifyContent: 'center',
  },
  nextLabel: { fontSize: 11, color: COLORS.orange, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextMed: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  nextTime: { fontSize: 13, color: COLORS.textMuted },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textLight,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, width: '47%',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  menuIcon: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  menuName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  menuDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
});