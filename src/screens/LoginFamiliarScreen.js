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
import { login } from '../services/authservice';

export default function LoginFamiliarScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atencao', 'Digite e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      const data = await login(email.trim(), senha);
      if (data.usuario?.tipo !== 'familiar') {
        Alert.alert('Conta de paciente', 'Esta conta e de paciente. Vou abrir a area do paciente.');
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        return;
      }
      navigation.reset({ index: 0, routes: [{ name: 'HomeFamiliar' }] });
    } catch (error) {
      Alert.alert('Erro ao entrar', error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={26} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.logoBox}>
              <Ionicons name="people" size={34} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>Area da familia</Text>
            <Text style={styles.appSub}>Acompanhe os remedios com seguranca.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Entrar</Text>
            <Text style={styles.subtitle}>Use a conta criada com o codigo do paciente.</Text>

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="carlos@email.com"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor={COLORS.textLight}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={carregando}>
              {carregando ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Entrar como familiar</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCriar} onPress={() => navigation.navigate('Cadastro', { tipo: 'familiar' })}>
              <Text style={styles.btnCriarText}>Criar conta de familiar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.purple },
  header: { backgroundColor: COLORS.purple, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 34 },
  backBtn: { marginBottom: 16 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appName: { fontSize: 30, fontWeight: '800', color: COLORS.white },
  appSub: { fontSize: 16, color: 'rgba(255,255,255,0.86)', marginTop: 6 },
  card: { flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: COLORS.textMuted, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted, marginBottom: 7 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 17,
    color: COLORS.text,
    backgroundColor: '#f8f9ff',
    marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  btnCriar: { paddingVertical: 18, alignItems: 'center' },
  btnCriarText: { color: COLORS.purple, fontSize: 16, fontWeight: '800' },
});
