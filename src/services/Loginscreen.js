import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { login } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setCarregando(true);
    try {
      const data = await login(email.trim(), senha);
      if (data.usuario.tipo === 'familiar') {
        navigation.reset({ index: 0, routes: [{ name: 'HomeFamiliar' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="medkit" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>MedCare</Text>
            <Text style={styles.appSub}>Seu assistente de saúde</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Bem-vindo(a)!</Text>
            <Text style={styles.subtitle}>Entre para gerenciar seus remédios</Text>

            <Text style={styles.label}>Seu e-mail</Text>
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
                placeholder="••••••••"
                placeholderTextColor={COLORS.textLight}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!verSenha}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setVerSenha(!verSenha)}>
                <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, carregando && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={carregando}
            >
              {carregando
                ? <ActivityIndicator color={COLORS.white} />
                : <>
                    <Ionicons name="person" size={18} color={COLORS.white} />
                    <Text style={styles.btnText}>Entrar</Text>
                  </>
              }
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.btnFamiliar}
              onPress={() => navigation.navigate('LoginFamiliar')}
            >
              <Ionicons name="people" size={18} color={COLORS.primary} />
              <Text style={styles.btnFamiliarText}>Entrar como familiar / cuidador</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCriar}
              onPress={() => navigation.navigate('Cadastro')}
            >
              <Text style={styles.btnCriarText}>Criar conta nova</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 32 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  appSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text, backgroundColor: '#f8f9ff', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  eyeBtn: { padding: 10 },
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 4, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textLight },
  btnFamiliar: { borderWidth: 2, borderColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primaryLight },
  btnFamiliarText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  btnCriar: { paddingVertical: 12, alignItems: 'center' },
  btnCriarText: { color: COLORS.textMuted, fontSize: 14 },
});