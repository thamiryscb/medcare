import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import BottomNav from '../components/BottomNav';
import { cadastrarFamiliar as criarFamiliar, listarFamiliares, listarNotificacoes } from '../services/Familiareservice';
import { getUsuario } from '../services/authservice';

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
  const [aba, setAba] = useState('lista');
  const [usuario, setUsuario] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [usuarioLogado, listaFamiliares, listaNotificacoes] = await Promise.all([
        getUsuario(),
        listarFamiliares(),
        listarNotificacoes().catch(() => []),
      ]);
      setUsuario(usuarioLogado);
      setFamiliares(listaFamiliares || []);
      setNotificacoes(listaNotificacoes || []);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      carregar().catch(() => {});
      return () => {
        ativo = false;
      };
    }, [carregar])
  );

  async function cadastrarFamiliar() {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Atencao', 'Preencha nome, e-mail e senha.');
      return;
    }

    if (!usuario?.codigo_paciente) {
      Alert.alert('Atencao', 'Nao encontrei o codigo do paciente.');
      return;
    }

    setSalvando(true);
    try {
      await criarFamiliar(nome.trim(), email.trim(), senha);
      setNome('');
      setEmail('');
      setSenha('');
      setAba('lista');
      await carregar();
      Alert.alert('Familiar cadastrado', 'A conta do familiar foi criada e vinculada a este paciente.');
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setSalvando(false);
    }
  }

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
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabButton, aba === 'lista' && styles.tabButtonActive]}
            onPress={() => setAba('lista')}
          >
            <Text style={[styles.tabText, aba === 'lista' && styles.tabTextActive]}>Familiares</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, aba === 'cadastro' && styles.tabButtonActive]}
            onPress={() => setAba('cadastro')}
          >
            <Text style={[styles.tabText, aba === 'cadastro' && styles.tabTextActive]}>Cadastrar</Text>
          </TouchableOpacity>
        </View>

        {carregando ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : aba === 'cadastro' ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Cadastrar familiar</Text>
            <Text style={styles.formText}>Crie uma conta para filho, filha, cuidador ou outra pessoa de confianca.</Text>

            <Text style={styles.inputLabel}>Nome do familiar</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Ex: Carlos Filho" />

            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="familiar@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Senha inicial</Text>
            <TextInput style={styles.input} value={senha} onChangeText={setSenha} placeholder="Minimo 6 caracteres" secureTextEntry />

            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Codigo usado no vinculo</Text>
              <Text selectable style={styles.codeText}>{usuario?.codigo_paciente || '-'}</Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={cadastrarFamiliar} disabled={salvando}>
              {salvando ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Salvar familiar</Text>}
            </TouchableOpacity>
          </View>
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
  tabs: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, padding: 5, marginBottom: 16 },
  tabButton: { flex: 1, minHeight: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tabButtonActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '900' },
  tabTextActive: { color: COLORS.white },
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
  formCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 18 },
  formTitle: { color: COLORS.text, fontSize: 24, fontWeight: '900' },
  formText: { color: COLORS.textMuted, fontSize: 16, lineHeight: 22, marginTop: 4, marginBottom: 16 },
  inputLabel: { color: COLORS.textMuted, fontSize: 16, fontWeight: '800', marginBottom: 7 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 15,
    fontSize: 18,
    color: COLORS.text,
    backgroundColor: '#f8f9ff',
    marginBottom: 14,
  },
  codeBox: { backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16 },
  codeLabel: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  codeText: { color: COLORS.primary, fontSize: 24, fontWeight: '900', marginTop: 2 },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 16, minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: COLORS.white, fontSize: 19, fontWeight: '900' },
});
