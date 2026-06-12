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
import { listarFamiliares, listarNotificacoes } from '../services/Familiareservice';

function iniciais(nome) {
  return String(nome || 'Familiar')
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export default function FamiliaScreen({ navigation }) {
  const [familiares, setFamiliares] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregar() {
        setCarregando(true);
        try {
          const [listaFamiliares, listaNotificacoes] = await Promise.all([
            listarFamiliares(),
            listarNotificacoes().catch(() => []),
          ]);
          if (ativo) {
            setFamiliares(listaFamiliares || []);
            setNotificacoes(listaNotificacoes || []);
          }
        } catch (error) {
          if (ativo) Alert.alert('Erro', error.message);
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Familia</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {carregando ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Cuidadores vinculados</Text>
            {familiares.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nenhum familiar vinculado</Text>
                <Text style={styles.emptyText}>Compartilhe o codigo da tela inicial para alguem criar uma conta familiar.</Text>
              </View>
            ) : (
              familiares.map((familiar) => (
                <View key={familiar.id} style={styles.card}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{iniciais(familiar.nome)}</Text>
                  </View>
                  <View style={styles.famInfo}>
                    <Text style={styles.famNome}>{familiar.nome}</Text>
                    <Text selectable style={styles.famTel}>{familiar.email}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Ativo</Text>
                  </View>
                </View>
              ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Alertas recentes</Text>
            {notificacoes.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Sem alertas recentes</Text>
                <Text style={styles.emptyText}>Quando todos os remedios forem tomados, a familia pode ser avisada.</Text>
              </View>
            ) : (
              notificacoes.map((alerta) => (
                <View key={alerta.id} style={[styles.alertCard, alerta.lida ? styles.alertOk : styles.alertWarn]}>
                  <Text style={[styles.alertTitulo, alerta.lida ? styles.alertTituloOk : styles.alertTituloWarn]}>
                    {alerta.tipo === 'todos_tomados' ? 'Tudo certo' : 'Aviso'}
                  </Text>
                  <Text style={styles.alertDesc}>{alerta.mensagem}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <BottomNav navigation={navigation} active="Familia" />
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
  headerTitle: { fontSize: 21, fontWeight: '800', color: COLORS.white },
  body: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 10 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 16, color: COLORS.primary },
  famInfo: { flex: 1 },
  famNome: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  famTel: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '800', color: COLORS.success },
  alertCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
  alertOk: { backgroundColor: COLORS.successLight, borderLeftColor: COLORS.success },
  alertWarn: { backgroundColor: '#fff8e6', borderLeftColor: COLORS.orange },
  alertTitulo: { fontSize: 16, fontWeight: '800' },
  alertTituloOk: { color: COLORS.success },
  alertTituloWarn: { color: COLORS.warning },
  alertDesc: { fontSize: 15, color: COLORS.textMuted, marginTop: 4 },
  empty: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18, marginBottom: 10 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  emptyText: { color: COLORS.textMuted, fontSize: 15, marginTop: 4 },
});
