import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import BottomNavFamiliar from '../components/BottomNavFamiliar';
import { getChecklist, markChecklistItemTaken } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const itensIniciais = [
  { id: 1, nome: 'Losartana 50mg', horario: '08:00', dose: '1 comprimido', cor: '#e6f0ff', tomado: true },
  { id: 2, nome: 'Metformina 500mg', horario: '08:00', dose: '1 comprimido', cor: '#fff3e0', tomado: true },
  { id: 3, nome: 'Ácido Fólico 5mg', horario: '08:00', dose: '1 comprimido', cor: '#e6f7ee', tomado: true },
  { id: 4, nome: 'Metformina 500mg', horario: '12:00', dose: '1 comprimido', cor: '#fff3e0', tomado: false },
  { id: 5, nome: 'Sinvastatina 20mg', horario: '22:00', dose: '1 comprimido', cor: '#fce4ec', tomado: false },
];

export default function ChecklistFamiliarScreen({ navigation }) {
  const { token, patient } = useAuth();
  const [itens, setItens] = useState(itensIniciais);

  useEffect(() => {
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    carregarChecklist();
  }, [navigation, token]);

  async function carregarChecklist() {
    const data = await getChecklist(token).catch(() => null);
    if (data?.items) setItens(data.items);
  }

  async function marcarTomado(id) {
    const original = itens;
    setItens(itens.map(i => i.id === id ? { ...i, tomado: true } : i));
    const response = await markChecklistItemTaken(token, id, true).catch(() => null);
    if (!response?.taken) setItens(original);
  }

  const tomados = itens.filter(i => i.tomado).length;
  const total = itens.length;
  const progresso = total === 0 ? 0 : Math.round((tomados / total) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeFamiliar')}>
          <Ionicons name="arrow-back" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Check-list de Hoje</Text>
          <Text style={styles.headerSub}>{patient?.fullName || 'Paciente vinculado'}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={18} color={COLORS.purple} />
          <Text style={styles.infoText}>Você pode marcar remédios como tomados em nome de {patient?.fullName || 'paciente vinculado'}.</Text>
        </View>

        <Text style={styles.sectionTitle}>Progresso do dia</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progresso}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{tomados} de {total} tomados</Text>

        {itens.map((item) => (
          <View key={item.id} style={[styles.card, item.tomado && styles.cardDone]}>
            <View style={[styles.itemIcon, { backgroundColor: item.cor }]}>
              <Ionicons name="medkit" size={22} color={item.tomado ? COLORS.success : COLORS.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemNome}>{item.nome}</Text>
              <Text style={styles.itemSub}>{item.horario} · {item.dose}</Text>
            </View>
            {item.tomado ? (
              <View style={styles.btnTomei}>
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.btnTomeiText}>Tomei</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.btnTomar} onPress={() => marcarTomado(item.id)}>
                <Text style={styles.btnTomarText}>Marcar</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {tomados === total && (
          <View style={styles.successBanner}>
            <Ionicons name="trophy" size={24} color={COLORS.success} />
            <Text style={styles.successText}>Todos os remédios confirmados hoje!</Text>
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNavFamiliar navigation={navigation} active="ChecklistFamiliar" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.purple, padding: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  body: { flex: 1, padding: 16 },
  infoBanner: {
    backgroundColor: COLORS.purpleLight, borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
  },
  infoText: { fontSize: 13, color: '#4c1d95', flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  progressTrack: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: COLORS.purple, borderRadius: 4 },
  progressLabel: { fontSize: 12, color: COLORS.textMuted, textAlign: 'right', marginBottom: 18 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardDone: { opacity: 0.65 },
  itemIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  itemSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  btnTomei: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.successLight, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  btnTomeiText: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  btnTomar: { backgroundColor: COLORS.purple, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnTomarText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  successBanner: { backgroundColor: COLORS.successLight, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  successText: { fontSize: 14, fontWeight: '600', color: COLORS.success, flex: 1 },
});
