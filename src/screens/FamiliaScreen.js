import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import BottomNav from '../components/BottomNav';
import { getPatientDashboard } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const cuidadores = [
  { id: 1, nome: 'Carlos (Filho)', telefone: '(84) 9 9999-1234', iniciais: 'CA', cor: COLORS.primaryLight, corTexto: COLORS.primary },
  { id: 2, nome: 'Lúcia (Filha)', telefone: '(84) 9 9988-5678', iniciais: 'LM', cor: COLORS.purpleLight, corTexto: COLORS.purple },
];

const alertas = [
  { id: 1, tipo: 'alerta', titulo: 'Lembrete não confirmado', desc: 'Sinvastatina · 22:00 de ontem', detalhe: 'Carlos foi notificado automaticamente.' },
  { id: 2, tipo: 'ok', titulo: 'Todos os remédios tomados', desc: 'Ontem · 20:05', detalhe: null },
];

export default function FamiliaScreen({ navigation }) {
  const { token } = useAuth();
  const [dados, setDados] = useState({ cuidadores, alertas });

  useEffect(() => {
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    getPatientDashboard(token)
      .then((dashboard) => {
        setDados({
          cuidadores: dashboard.caregivers || cuidadores,
          alertas: dashboard.alerts || alertas,
        });
      })
      .catch(() => {});
  }, [navigation, token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Família</Text>
        <TouchableOpacity>
          <Ionicons name="person-add-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Cuidadores cadastrados</Text>
        {dados.cuidadores.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={[styles.avatar, { backgroundColor: c.cor || COLORS.primaryLight }]}>
              <Text style={[styles.avatarText, { color: c.corTexto || COLORS.primary }]}>{c.iniciais}</Text>
            </View>
            <View style={styles.famInfo}>
              <Text style={styles.famNome}>{c.nome}</Text>
              <Text style={styles.famTel}>📱 {c.telefone}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Ativo</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Alertas recentes</Text>
        {dados.alertas.map((a) => (
          <View key={a.id} style={[styles.alertCard, a.tipo === 'ok' ? styles.alertOk : styles.alertWarn]}>
            <Text style={[styles.alertTitulo, a.tipo === 'ok' ? styles.alertTituloOk : styles.alertTituloWarn]}>
              {a.tipo === 'ok' ? '✅ ' : '⚠️ '}{a.titulo}
            </Text>
            <Text style={styles.alertDesc}>{a.desc}</Text>
            {a.detalhe && <Text style={styles.alertDetalhe}>{a.detalhe}</Text>}
          </View>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Se um remédio não for confirmado, seus cuidadores são avisados automaticamente.
          </Text>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="Familia" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  body: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', fontSize: 15 },
  famInfo: { flex: 1 },
  famNome: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  famTel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', color: COLORS.success },
  alertCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
  alertOk: { backgroundColor: COLORS.successLight, borderLeftColor: COLORS.success },
  alertWarn: { backgroundColor: '#fff8e6', borderLeftColor: COLORS.orange },
  alertTitulo: { fontSize: 14, fontWeight: '700' },
  alertTituloOk: { color: COLORS.success },
  alertTituloWarn: { color: COLORS.warning },
  alertDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  alertDetalhe: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  infoBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8,
  },
  infoText: { fontSize: 13, color: COLORS.primary, flex: 1, lineHeight: 19 },
});
