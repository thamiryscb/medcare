import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import BottomNav from '../components/BottomNav';
import { createMedication, deleteMedication, getMedications } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const remediosIniciais = [
  { id: 1, nome: 'Losartana 50mg', dose: '1 comprimido', cor: '#e6f0ff', corBox: 'Caixa branca', horarios: ['08:00', '20:00'], tomado: true },
  { id: 2, nome: 'Metformina 500mg', dose: '1 comprimido', cor: '#fff3e0', corBox: 'Caixa amarela', horarios: ['12:00', '18:00'], tomado: true },
  { id: 3, nome: 'Ácido Fólico 5mg', dose: '1 comprimido', cor: '#e6f7ee', corBox: 'Caixa verde', horarios: ['08:00'], tomado: false },
  { id: 4, nome: 'Sinvastatina 20mg', dose: '1 comprimido', cor: '#fce4ec', corBox: 'Caixa rosa', horarios: ['22:00'], tomado: false },
];

export default function RemediosScreen({ navigation }) {
  const { token } = useAuth();
  const [remedios, setRemedios] = useState(remediosIniciais);
  const [modal, setModal] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaDose, setNovaDose] = useState('');
  const [novoHorario, setNovoHorario] = useState('');

  useEffect(() => {
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    carregarRemedios();
  }, [navigation, token]);

  async function carregarRemedios() {
    const data = await getMedications(token).catch(() => null);
    if (data?.medications) setRemedios(data.medications);
  }

  async function adicionarRemedio() {
    if (!novoNome.trim()) return;

    const response = await createMedication(token, 'me', {
      name: novoNome,
      dose: novaDose || '1 comprimido',
      boxColor: 'Caixa azul',
      uiColor: '#e6f0ff',
      scheduleTimes: novoHorario ? [novoHorario] : ['08:00'],
    }).catch(() => null);

    if (response?.medication) {
      setRemedios([...remedios, response.medication]);
    }

    setNovoNome(''); setNovaDose(''); setNovoHorario('');
    setModal(false);
  }

  async function removerRemedio(id) {
    const original = remedios;
    setRemedios(remedios.filter(r => r.id !== id));
    const response = await deleteMedication(token, id).catch(() => null);
    if (!response?.deleted) setRemedios(original);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Remédios</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {remedios.map((rem) => (
          <View key={rem.id} style={styles.card}>
            <View style={[styles.remIcon, { backgroundColor: rem.cor }]}>
              <Ionicons name="medkit" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.remInfo}>
              <Text style={styles.remNome}>{rem.nome}</Text>
              <Text style={styles.remDose}>{rem.corBox} · {rem.dose}</Text>
              <View style={styles.horarios}>
                {rem.horarios.map((h) => (
                  <View key={h} style={styles.badge}>
                    <Text style={styles.badgeText}>{h}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.cardRight}>
              {rem.tomado && (
                <View style={styles.okBadge}>
                  <Ionicons name="checkmark" size={14} color={COLORS.success} />
                </View>
              )}
              <TouchableOpacity onPress={() => removerRemedio(rem.id)} style={{ marginTop: 8 }}>
                <Ionicons name="trash-outline" size={18} color="#ccc" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
        <Ionicons name="add" size={30} color={COLORS.white} />
      </TouchableOpacity>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adicionar Remédio</Text>
            <Text style={styles.fieldLabel}>Nome do remédio</Text>
            <TextInput style={styles.input} placeholder="Ex: Losartana 50mg" value={novoNome} onChangeText={setNovoNome} />
            <Text style={styles.fieldLabel}>Dose</Text>
            <TextInput style={styles.input} placeholder="Ex: 1 comprimido" value={novaDose} onChangeText={setNovaDose} />
            <Text style={styles.fieldLabel}>Horário principal</Text>
            <TextInput style={styles.input} placeholder="Ex: 08:00" value={novoHorario} onChangeText={setNovoHorario} keyboardType="numbers-and-punctuation" />
            <TouchableOpacity style={styles.btnAdd} onPress={adicionarRemedio}>
              <Text style={styles.btnAddText}>Salvar Remédio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setModal(false)}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} active="Remedios" />
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
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  remIcon: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  remInfo: { flex: 1 },
  remNome: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  remDose: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  horarios: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  cardRight: { alignItems: 'center' },
  okBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.successLight, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute', bottom: 80, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 13, fontSize: 15, color: COLORS.text, backgroundColor: '#f8f9ff', marginBottom: 14,
  },
  btnAdd: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  btnAddText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  btnCancel: { paddingVertical: 12, alignItems: 'center' },
  btnCancelText: { color: COLORS.textMuted, fontSize: 15 },
});
