import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import BottomNavFamiliar from '../components/BottomNavFamiliar';

export default function HomeFamiliarScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Você está acompanhando</Text>
          <Text style={styles.headerName}>Carlos (Familiar)</Text>
        </View>
        <TouchableOpacity style={styles.sairBtn} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.pacienteCard}>
          <View style={styles.pacienteAvatar}>
            <Text style={styles.pacienteAvatarText}>MA</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pacienteLabel}>Paciente vinculado</Text>
            <Text style={styles.pacienteNome}>Maria Aparecida</Text>
            <Text style={styles.pacienteCodigo}>Código: MARIA-2024</Text>
          </View>
          <View style={styles.statusOnline}>
            <Text style={styles.statusOnlineText}>● Ativo</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resumo de hoje</Text>
        <View style={styles.resumoGrid}>
          <View style={[styles.resumoCard, { borderLeftColor: COLORS.success }]}>
            <Text style={styles.resumoNum}>3</Text>
            <Text style={styles.resumoLabel}>Tomados</Text>
          </View>
          <View style={[styles.resumoCard, { borderLeftColor: COLORS.orange }]}>
            <Text style={styles.resumoNum}>2</Text>
            <Text style={styles.resumoLabel}>Pendentes</Text>
          </View>
          <View style={[styles.resumoCard, { borderLeftColor: COLORS.primary }]}>
            <Text style={styles.resumoNum}>5</Text>
            <Text style={styles.resumoLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.alertaCard}>
          <Ionicons name="warning" size={22} color={COLORS.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertaTitulo}>Lembrete não confirmado</Text>
            <Text style={styles.alertaDesc}>Sinvastatina · previsto para 22:00 de ontem</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>O que você quer fazer?</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('RemediosFamiliar')}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="medkit" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.menuName}>Ver Remédios</Text>
            <Text style={styles.menuDesc}>Ver e cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('ChecklistFamiliar')}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="checkbox" size={26} color={COLORS.success} />
            </View>
            <Text style={styles.menuName}>Check-list Hoje</Text>
            <Text style={styles.menuDesc}>3 de 5 tomados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard}>
            <View style={[styles.menuIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="notifications" size={26} color={COLORS.orange} />
            </View>
            <Text style={styles.menuName}>Alertas</Text>
            <Text style={styles.menuDesc}>1 alerta ativo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.purpleLight }]}>
              <Ionicons name="stats-chart" size={26} color={COLORS.purple} />
            </View>
            <Text style={styles.menuName}>Histórico</Text>
            <Text style={styles.menuDesc}>Últimos 30 dias</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>

      <BottomNavFamiliar navigation={navigation} active="HomeFamiliar" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  headerName: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  sairBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 16 },
  pacienteCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20,
    borderWidth: 2, borderColor: COLORS.purpleLight,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  pacienteAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  pacienteAvatarText: { fontWeight: '700', fontSize: 17, color: COLORS.primary },
  pacienteLabel: { fontSize: 11, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  pacienteNome: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  pacienteCodigo: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusOnline: { backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusOnlineText: { fontSize: 11, fontWeight: '700', color: COLORS.success },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  resumoGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  resumoCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderLeftWidth: 4,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  resumoNum: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  resumoLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  alertaCard: {
    backgroundColor: '#fff8e6', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.orange, marginBottom: 20,
  },
  alertaTitulo: { fontSize: 14, fontWeight: '700', color: COLORS.warning },
  alertaDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, width: '47%',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  menuIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  menuName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  menuDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
});