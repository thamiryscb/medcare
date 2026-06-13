import React, { useCallback, useState } from 'react';
import {
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
import { getUsuario, logout } from '../services/authservice';

function iniciais(nome) {
  return String(nome || 'Paciente')
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export default function PerfilScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      getUsuario().then((data) => {
        if (ativo) setUsuario(data);
      });

      return () => {
        ativo = false;
      };
    }, [])
  );

  async function handleSair() {
    Alert.alert('Sair da conta', 'Deseja sair do MedCare?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciais(usuario?.nome)}</Text>
        </View>

        <Text style={styles.name}>{usuario?.nome || 'Paciente'}</Text>
        <Text style={styles.role}>{usuario?.tipo === 'familiar' ? 'Familiar ou cuidador' : 'Paciente'}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Nome</Text>
          <Text selectable style={styles.value}>{usuario?.nome || '-'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>E-mail</Text>
          <Text selectable style={styles.value}>{usuario?.email || '-'}</Text>
        </View>

        {usuario?.codigo_paciente && (
          <View style={styles.codeCard}>
            <Text style={styles.label}>Codigo para cadastrar familiares</Text>
            <Text selectable style={styles.code}>{usuario.codigo_paciente}</Text>
          </View>
        )}

        <View style={styles.helpCard}>
          <Ionicons name="shield-checkmark" size={26} color={COLORS.primary} />
          <Text style={styles.helpText}>
            Compartilhe o codigo apenas com familiares ou cuidadores de confianca.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSair}>
          <Ionicons name="log-out-outline" size={26} color={COLORS.white} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
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
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  avatarText: { color: COLORS.white, fontSize: 30, fontWeight: '900' },
  name: { color: COLORS.text, fontSize: 26, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  role: { color: COLORS.textMuted, fontSize: 17, marginTop: 4, marginBottom: 20 },
  infoCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  label: { color: COLORS.textMuted, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  value: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  codeCard: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  code: { color: COLORS.primary, fontSize: 30, fontWeight: '900' },
  helpCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 22,
  },
  helpText: { flex: 1, color: COLORS.textMuted, fontSize: 16, lineHeight: 22 },
  logoutButton: {
    width: '100%',
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: '#b42318',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  logoutText: { color: COLORS.white, fontSize: 20, fontWeight: '900' },
});
