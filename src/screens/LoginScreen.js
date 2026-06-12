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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atencao', 'Digite e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      const data = await login(email.trim(), senha);
      const destino = data.usuario?.tipo === 'familiar' ? 'HomeFamiliar' : 'Home';
      navigation.reset({ index: 0, routes: [{ name: destino }] });
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
            <View style={styles.logoBox}>
              <Ionicons name="medkit" size={34} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>MedCare</Text>
            <Text style={styles.appSub}>Remedios em dia, familia tranquila.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Entrar</Text>
            <Text style={styles.subtitle}>Acesse com seu e-mail e senha.</Text>

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="maria@email.com"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Sua senha"
                placeholderTextColor={COLORS.textLight}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!verSenha}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setVerSenha(!verSenha)}>
                <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={carregando}>
              {carregando ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="person" size={20} color={COLORS.white} />
                  <Text style={styles.btnText}>Entrar</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnFamiliar} onPress={() => navigation.navigate('LoginFamiliar')}>
              <Ionicons name="people" size={20} color={COLORS.purple} />
              <Text style={styles.btnFamiliarText}>Sou familiar ou cuidador</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCriar} onPress={() => navigation.navigate('Cadastro', { tipo: 'paciente' })}>
              <Text style={styles.btnCriarText}>Criar conta de paciente</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingTop: 44, paddingBottom: 34 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appName: { fontSize: 34, fontWeight: '800', color: COLORS.white },
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
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  eyeBtn: { padding: 10 },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  btnFamiliar: {
    borderWidth: 2,
    borderColor: COLORS.purple,
    borderRadius: 16,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.purpleLight,
  },
  btnFamiliarText: { color: COLORS.purple, fontSize: 16, fontWeight: '800' },
  btnCriar: { paddingVertical: 18, alignItems: 'center' },
  btnCriarText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '700' },
});
