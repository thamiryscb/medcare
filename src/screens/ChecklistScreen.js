import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import BottomNav from '../components/BottomNav';
import { getChecklist, getHoje, marcarTomado } from '../services/Checklistservice';

function dataBonita() {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());
}

export default function ChecklistScreen({ navigation, route }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [marcandoId, setMarcandoId] = useState(null);
  const hoje = getHoje();
  const lembrete = route.params?.lembrete;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await getChecklist(hoje);
      setItens(data.itens || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setCarregando(false);
    }
  }, [hoje]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function handleTomar(id) {
    setMarcandoId(id);
    try {
      await marcarTomado(hoje, id);
      await carregar();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setMarcandoId(null);
    }
  }

  const tomados = itens.filter((item) => item.tomado).length;
  const total = itens.length;
  const progresso = total ? Math.round((tomados / total) * 100) : 0;
  const corDestaque = lembrete ? COLORS.orange : COLORS.primary;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, lembrete && styles.headerAlarme]}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda de hoje</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {carregando ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={styles.dateText}>{dataBonita()}</Text>
            <Text style={styles.sectionTitle}>Progresso do dia</Text>
            {lembrete && (
              <View style={styles.alarmBanner}>
                <Ionicons name="alarm" size={34} color={COLORS.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alarmTitle}>Hora do remedio</Text>
                  <Text style={styles.alarmText}>{lembrete.nome}</Text>
                  <Text style={styles.alarmSub}>{lembrete.dose} - {lembrete.corCaixa} - {lembrete.horario}</Text>
                </View>
              </View>
            )}

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progresso}%`, backgroundColor: corDestaque }]} />
            </View>
            <Text style={styles.progressLabel}>{tomados} de {total} tomados</Text>

            {itens.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={42} color={COLORS.primary} />
                <Text style={styles.emptyTitle}>Sem remedios hoje</Text>
                <Text style={styles.emptyText}>Cadastre remedios para montar a agenda.</Text>
              </View>
            ) : (
              itens.map((item) => {
                const destacado = lembrete && (
                  item.remedio_id === lembrete.remedioId ||
                  (item.nome_remedio === lembrete.nome && item.horario === lembrete.horario)
                );

                return (
                <View key={item.id} style={[styles.card, item.tomado && styles.cardDone, destacado && styles.cardAlarm]}>
                  <View style={[styles.itemIcon, { backgroundColor: item.tomado ? COLORS.successLight : destacado ? '#fff3e0' : COLORS.primaryLight }]}>
                    <Ionicons name={destacado ? 'alarm' : 'medkit'} size={24} color={item.tomado ? COLORS.success : destacado ? COLORS.warning : COLORS.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemNome}>{item.nome_remedio}</Text>
                    <Text style={styles.itemSub}>{item.horario} - {item.dose}</Text>
                  </View>
                  {item.tomado ? (
                    <View style={styles.btnTomei}>
                      <Ionicons name="checkmark" size={18} color={COLORS.success} />
                      <Text style={styles.btnTomeiText}>Tomei</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.btnTomar} onPress={() => handleTomar(item.id)} disabled={marcandoId === item.id}>
                      {marcandoId === item.id ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnTomarText}>Tomei</Text>}
                    </TouchableOpacity>
                  )}
                </View>
                );
              })
            )}

            {total > 0 && tomados === total && (
              <View style={styles.successBanner}>
                <Ionicons name="trophy" size={26} color={COLORS.success} />
                <Text style={styles.successText}>Parabens! Todos os remedios foram tomados hoje.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <BottomNav navigation={navigation} active="Checklist" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAlarme: { backgroundColor: COLORS.orange },
  headerTitle: { fontSize: 21, fontWeight: '800', color: COLORS.white },
  body: { flex: 1, padding: 16 },
  dateText: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 8 },
  progressTrack: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 5 },
  progressLabel: { fontSize: 15, color: COLORS.textMuted, textAlign: 'right', marginBottom: 18 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  cardAlarm: { borderWidth: 3, borderColor: COLORS.orange, backgroundColor: '#fffaf0' },
  cardDone: { opacity: 0.72 },
  itemIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  itemSub: { fontSize: 15, color: COLORS.textMuted, marginTop: 3 },
  btnTomei: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.successLight, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  btnTomeiText: { fontSize: 15, fontWeight: '800', color: COLORS.success },
  btnTomar: { backgroundColor: COLORS.primary, minWidth: 82, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  btnTomarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  successBanner: { backgroundColor: COLORS.successLight, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  successText: { fontSize: 16, fontWeight: '700', color: COLORS.success, flex: 1 },
  empty: { alignItems: 'center', padding: 28, backgroundColor: COLORS.white, borderRadius: 16 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginTop: 10 },
  emptyText: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', marginTop: 4 },
  alarmBanner: {
    backgroundColor: '#fff3e0',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: COLORS.orange,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  alarmTitle: { color: COLORS.warning, fontSize: 22, fontWeight: '900' },
  alarmText: { color: COLORS.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
  alarmSub: { color: COLORS.textMuted, fontSize: 16, marginTop: 2 },
});
