import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

export default function LoginFamiliarScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [verSenha, setVerSenha] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.logoBox}>
              <Ionicons name="people" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>Área do Familiar</Text>
            <Text style={styles.appSub}>Acompanhe o tratamento de quem você ama</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color={COLORS.purple} />
              <Text style={styles.infoText}>
                Use o <Text style={styles.infoBold}>código do paciente</Text> fornecido pelo idoso para vincular sua conta.
              </Text>
            </View>

            <Text style={styles.label}>Seu e-mail</Text>
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
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textLight}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!verSenha}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setVerSenha(!verSenha)}
              >
                <Ionicons
                  name={verSenha ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Código do paciente</Text>
            <TextInput
              style={[styles.input, styles.inputCodigo]}
              placeholder="Ex: MARIA-2024"
              placeholderTextColor={COLORS.purple}
              value={codigo}
              onChangeText={setCodigo}
              autoCapitalize="characters"
            />
            <Text style={styles.codigoHint}>
              O idoso encontra o código dele na tela Perfil do app.
            </Text>

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => navigation.navigate('HomeFamiliar')}
            >
              <Ionicons name="people" size={18} color={COLORS.white} />
              <Text style={styles.btnText}>Entrar como familiar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCriar}>
              <Text style={styles.btnCriarText}>Criar conta de familiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnVoltar}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnVoltarText}>← Voltar para login do paciente</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.purple },
  header: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 28, paddingTop: 40, paddingBottom: 32,
  },
  backBtn: { marginBottom: 16 },
  logoBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  appName: { fontSize: 26, fontWeight: '700', color: COLORS.white },
  appSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: {
    flex: 1, backgroundColor: COLORS.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28,
  },
  infoBanner: {
    backgroundColor: COLORS.purpleLight, borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 22,
  },
  infoText: { fontSize: 13, color: '#4c1d95', flex: 1, lineHeight: 19 },
  infoBold: { fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: COLORS.text, backgroundColor: '#f8f9ff', marginBottom: 16,
  },
  inputCodigo: {
    borderColor: COLORS.purple, backgroundColor: COLORS.purpleLight,
    fontSize: 17, fontWeight: '700', letterSpacing: 1,
    color: COLORS.purple, marginBottom: 6,
  },
  codigoHint: { fontSize: 12, color: COLORS.textLight, marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  eyeBtn: { padding: 10 },
  btnPrimary: {
    backgroundColor: COLORS.purple, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 4, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  btnCriar: { paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  btnCriarText: { color: COLORS.purple, fontSize: 14, fontWeight: '600' },
  btnVoltar: { paddingVertical: 10, alignItems: 'center' },
  btnVoltarText: { color: COLORS.textMuted, fontSize: 13 },
});