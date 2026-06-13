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
import { getChecklist, getHoje } from '../services/Checklistservice';
import { getUsuario } from '../services/authservice';
import { listarRemedios } from '../services/Remedioservice';
import { reagendarLembretesDosRemedios } from '../services/Lembreteservice';

export default function HomeFamiliarScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregar() {
        setCarregando(true);
        try {
          const usuarioLogado = await getUsuario();
          const [checklist, remedios] = await Promise.all([
            getChecklist(getHoje()),
            listarRemedios().catch(() => []),
          ]);
          if (ativo) {
            setUsuario(usuarioLogado);
            setItens(checklist.itens || []);
          }
          reagendarLembretesDosRemedios(remedios || []).catch(() => {});
        } catch (error) {
          if (ativo) Alert.alert('Aviso', error.message);
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregar();
      return () => {
        ativo = false;
      };
    }, [])
  );

  const tomados = itens.filter((item) => item.tomado).length;
  const total = itens.length;
  const pendentes = Math.max(total - tomados, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>Voce esta acompanhando</Text>
          <Text style={styles.headerName}>{usuario?.nome || 'Familiar'}</Text>
        </View>
        <TouchableOpacity style={styles.sairBtn} onPress={() => navigation.navigate('Perfil')}>
          <Ionicons name="person-circle-outline" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {carregando ? (
          <ActivityIndicator color={COLORS.purple} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Resumo de hoje</Text>
            <View style={styles.resumoGrid}>
              <View style={[styles.resumoCard, { borderLeftColor: COLORS.success }]}>
                <Text style={styles.resumoNum}>{tomados}</Text>
                <Text style={styles.resumoLabel}>Tomados</Text>
              </View>
              <View style={[styles.resumoCard, { borderLeftColor: COLORS.orange }]}>
                <Text style={styles.resumoNum}>{pendentes}</Text>
                <Text style={styles.resumoLabel}>Pendentes</Text>
              </View>
              <View style={[styles.resumoCard, { borderLeftColor: COLORS.primary }]}>
                <Text style={styles.resumoNum}>{total}</Text>
                <Text style={styles.resumoLabel}>Total</Text>
              </View>
            </View>

            {pendentes > 0 ? (
              <View style={styles.alertaCard}>
                <Ionicons name="warning" size={24} color={COLORS.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertaTitulo}>Ainda ha remedios pendentes</Text>
                  <Text style={styles.alertaDesc}>Abra a agenda para conferir os horarios.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.okCard}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <Text style={styles.okText}>Todos os remedios de hoje foram confirmados.</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>O que voce quer fazer?</Text>
            <View style={styles.menuGrid}>
              <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('ChecklistFamiliar')}>
                <View style={[styles.menuIcon, { backgroundColor: COLORS.successLight }]}>
                  <Ionicons name="checkbox" size={30} color={COLORS.success} />
                </View>
                <Text style={styles.menuName}>Agenda</Text>
                <Text style={styles.menuDesc}>Marcar remedios</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('RemediosFamiliar')}>
                <View style={[styles.menuIcon, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="medkit" size={30} color={COLORS.primary} />
                </View>
                <Text style={styles.menuName}>Remedios</Text>
                <Text style={styles.menuDesc}>Ver e cadastrar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <BottomNavFamiliar navigation={navigation} active="HomeFamiliar" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  headerName: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  sairBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 10 },
  resumoGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  resumoCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderLeftWidth: 4 },
  resumoNum: { fontSize: 30, fontWeight: '900', color: COLORS.text },
  resumoLabel: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  alertaCard: { backgroundColor: '#fff8e6', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderLeftColor: COLORS.orange, marginBottom: 20 },
  alertaTitulo: { fontSize: 17, fontWeight: '800', color: COLORS.warning },
  alertaDesc: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  okCard: { backgroundColor: COLORS.successLight, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  okText: { flex: 1, color: COLORS.success, fontSize: 16, fontWeight: '800' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, width: '47%', minHeight: 148 },
  menuIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  menuName: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  menuDesc: { fontSize: 14, color: COLORS.textMuted, marginTop: 5 },
});
