import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import BottomNavFamiliar from '../components/BottomNavFamiliar';
import { adicionarRemedio, listarRemedios, removerRemedio } from '../services/Remedioservice';
import { reagendarLembretesDosRemedios } from '../services/Lembreteservice';

function parseHorarios(valor) {
  return valor.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function RemediosFamiliarScreen({ navigation }) {
  const [remedios, setRemedios] = useState([]);
  const [modal, setModal] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaDose, setNovaDose] = useState('');
  const [novaCor, setNovaCor] = useState('Caixa azul');
  const [novosHorarios, setNovosHorarios] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const data = (await listarRemedios()) || [];
      setRemedios(data);
      reagendarLembretesDosRemedios(data).catch(() => {});
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function handleAdicionar() {
    const horarios = parseHorarios(novosHorarios);
    if (!novoNome.trim() || !novaDose.trim() || horarios.length === 0) {
      Alert.alert('Atencao', 'Digite nome, dose e pelo menos um horario.');
      return;
    }

    setSalvando(true);
    try {
      await adicionarRemedio(novoNome.trim(), novaDose.trim(), novaCor.trim() || 'Caixa azul', horarios);
      setNovoNome('');
      setNovaDose('');
      setNovaCor('Caixa azul');
      setNovosHorarios('');
      setModal(false);
      carregar();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(id) {
    try {
      await removerRemedio(id);
      carregar();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeFamiliar')}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Remedios</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.purple} />
          <Text style={styles.infoText}>Voce esta vendo os remedios do paciente vinculado.</Text>
        </View>

        {carregando ? (
          <ActivityIndicator color={COLORS.purple} style={{ marginTop: 30 }} />
        ) : remedios.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum remedio cadastrado</Text>
            <Text style={styles.emptyText}>Toque no botao + para adicionar.</Text>
          </View>
        ) : (
          remedios.map((rem) => (
            <View key={rem.id} style={styles.card}>
              <View style={styles.remIcon}>
                <Ionicons name="medkit" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.remInfo}>
                <Text style={styles.remNome}>{rem.nome}</Text>
                <Text style={styles.remDose}>{rem.cor_caixa || 'Caixa azul'} - {rem.dose}</Text>
                <View style={styles.horarios}>
                  {(rem.horarios || []).map((h) => (
                    <View key={h} style={styles.badge}>
                      <Text style={styles.badgeText}>{h}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemover(rem.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={22} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
        <Ionicons name="add" size={34} color={COLORS.white} />
      </TouchableOpacity>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adicionar remedio</Text>
            <TextInput style={styles.input} placeholder="Nome do remedio" value={novoNome} onChangeText={setNovoNome} />
            <TextInput style={styles.input} placeholder="Dose" value={novaDose} onChangeText={setNovaDose} />
            <TextInput style={styles.input} placeholder="Cor da caixa" value={novaCor} onChangeText={setNovaCor} />
            <TextInput style={styles.input} placeholder="Horarios: 08:00, 20:00" value={novosHorarios} onChangeText={setNovosHorarios} keyboardType="numbers-and-punctuation" />
            <TouchableOpacity style={styles.btnAdd} onPress={handleAdicionar} disabled={salvando}>
              {salvando ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnAddText}>Salvar remedio</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setModal(false)}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavFamiliar navigation={navigation} active="RemediosFamiliar" />
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
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  remIcon: { width: 54, height: 54, borderRadius: 14, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  remInfo: { flex: 1 },
  remNome: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  remDose: { fontSize: 14, color: COLORS.textMuted, marginTop: 3 },
  horarios: { flexDirection: 'row', gap: 7, marginTop: 8, flexWrap: 'wrap' },
  badge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  deleteBtn: { padding: 10 },
  empty: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18 },
  emptyTitle: { color: COLORS.text, fontSize: 19, fontWeight: '800' },
  emptyText: { color: COLORS.textMuted, fontSize: 15, marginTop: 4 },
  fab: { position: 'absolute', bottom: 82, right: 20, width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 26 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, fontSize: 17, color: COLORS.text, backgroundColor: '#f8f9ff', marginBottom: 12 },
  btnAdd: { backgroundColor: COLORS.purple, borderRadius: 16, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnAddText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  btnCancel: { paddingVertical: 14, alignItems: 'center' },
  btnCancelText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '700' },
});
