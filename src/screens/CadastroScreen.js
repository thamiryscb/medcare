import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { cadastro } from '../services/authservice';

export default function CadastroScreen({ navigation, route }) {
  const initialTipo = route.params?.tipo || 'paciente';
  const [tipo, setTipo] = useState(initialTipo);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigoPaciente, setCodigoPaciente] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro() {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Atencao', 'Preencha nome, e-mail e senha.');
      return;
    }

    if (tipo === 'familiar' && !codigoPaciente.trim()) {
      Alert.alert('Atencao', 'Digite o codigo do paciente.');
      return;
    }

    setCarregando(true);
    try {
      const data = await cadastro(
        email.trim(),
        senha,
        nome.trim(),
        tipo,
        tipo === 'familiar' ? codigoPaciente.trim().toUpperCase() : undefined
      );

      const mensagem = data.codigoPaciente
        ? `Conta criada. Guarde este codigo para a familia: ${data.codigoPaciente}`
        : 'Conta criada. Agora faca login.';

      Alert.alert('Tudo certo', mensagem, [
        { text: 'Entrar', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Use poucos dados para comecar.</Text>

          <View style={styles.tipoRow}>
            <TouchableOpacity
              style={[styles.tipoBtn, tipo === 'paciente' && styles.tipoBtnActive]}
              onPress={() => setTipo('paciente')}
            >
              <Ionicons name="person" size={20} color={tipo === 'paciente' ? COLORS.white : COLORS.primary} />
              <Text style={[styles.tipoText, tipo === 'paciente' && styles.tipoTextActive]}>Paciente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipoBtn, tipo === 'familiar' && styles.tipoBtnFamiliarActive]}
              onPress={() => setTipo('familiar')}
            >
              <Ionicons name="people" size={20} color={tipo === 'familiar' ? COLORS.white : COLORS.purple} />
              <Text style={[styles.tipoText, tipo === 'familiar' && styles.tipoTextActive]}>Familiar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Maria Aparecida" />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="maria@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput style={styles.input} value={senha} onChangeText={setSenha} secureTextEntry placeholder="Minimo 6 caracteres" />

          {tipo === 'familiar' && (
            <>
              <Text style={styles.label}>Codigo do paciente</Text>
              <TextInput
                style={styles.input}
                value={codigoPaciente}
                onChangeText={setCodigoPaciente}
                placeholder="Ex: MARIA-2024"
                autoCapitalize="characters"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.primary, tipo === 'familiar' && { backgroundColor: COLORS.purple }]}
            onPress={handleCadastro}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryText}>Criar conta</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: 24, gap: 10 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { color: COLORS.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: COLORS.textMuted, fontSize: 16, marginBottom: 12 },
  tipoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  tipoBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.white,
  },
  tipoBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tipoBtnFamiliarActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  tipoText: { color: COLORS.textMuted, fontWeight: '800', fontSize: 15 },
  tipoTextActive: { color: COLORS.white },
  label: { color: COLORS.textMuted, fontSize: 15, fontWeight: '700', marginTop: 4 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    color: COLORS.text,
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 18,
  },
  primaryText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
});
