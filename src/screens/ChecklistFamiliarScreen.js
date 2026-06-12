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
import BottomNavFamiliar from '../components/BottomNavFamiliar';
import { getChecklist, getHoje, marcarTomado } from '../services/Checklistservice';

export default function ChecklistFamiliarScreen({ navigation }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [marcandoId, setMarcandoId] = useState(null);
  const hoje = getHoje();

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

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeFamiliar')}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda de hoje</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.purple} />
          <Text style={styles.infoText}>Voce pode marcar remedios como tomados pelo paciente.</Text>
        </View>

        {carregando ? (
          <ActivityIndicator color={COLORS.purple} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Progresso do dia</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progresso}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{tomados} de {total} tomados</Text>

            {itens.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Sem remedios hoje</Text>
                <Text style={styles.emptyText}>Cadastre remedios para montar a agenda.</Text>
              </View>
            ) : (
              itens.map((item) => (
                <View key={item.id} style={[styles.card, item.tomado && styles.cardDone]}>
                  <View style={[styles.itemIcon, { backgroundColor: item.tomado ? COLORS.successLight : COLORS.purpleLight }]}>
                    <Ionicons name="medkit" size={24} color={item.tomado ? COLORS.success : COLORS.purple} />
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
                      {marcandoId === item.id ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnTomarText}>Marcar</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <BottomNavFamiliar navigation={navigation} active="ChecklistFamiliar" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.purple, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 21, fontWeight: '800', color: COLORS.white },
  body: { flex: 1, padding: 16 },
  infoBanner: { backgroundColor: COLORS.purpleLight, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16 },
  infoText: { fontSize: 15, color: '#4c1d95', flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 8 },
  progressTrack: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: COLORS.purple, borderRadius: 5 },
  progressLabel: { fontSize: 15, color: COLORS.textMuted, textAlign: 'right', marginBottom: 18 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  cardDone: { opacity: 0.72 },
  itemIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  itemSub: { fontSize: 15, color: COLORS.textMuted, marginTop: 3 },
  btnTomei: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.successLight, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  btnTomeiText: { fontSize: 15, fontWeight: '800', color: COLORS.success },
  btnTomar: { backgroundColor: COLORS.purple, minWidth: 82, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  btnTomarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  empty: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18 },
  emptyTitle: { color: COLORS.text, fontSize: 19, fontWeight: '800' },
  emptyText: { color: COLORS.textMuted, fontSize: 15, marginTop: 4 },
});
