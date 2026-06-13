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
import { getChecklist, getHoje } from '../services/Checklistservice';
import { getUsuario } from '../services/authservice';
import { listarRemedios } from '../services/Remedioservice';
import { reagendarLembretesDosRemedios } from '../services/Lembreteservice';

export default function HomeScreen({ navigation }) {
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
  const proximo = itens.find((item) => !item.tomado);
  const iniciais = (usuario?.nome || 'Paciente')
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Ola,</Text>
          <Text style={styles.name}>{usuario?.nome || 'Paciente'}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Perfil')}>
          <Text style={styles.avatarText}>{iniciais}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {carregando ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : (
          <>
            {usuario?.codigo_paciente && (
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Codigo para a familia</Text>
                <Text selectable style={styles.codeText}>{usuario.codigo_paciente}</Text>
              </View>
            )}

            <View style={styles.nextCard}>
              <View style={styles.nextIcon}>
                <Ionicons name={proximo ? 'notifications' : 'checkmark-circle'} size={26} color={proximo ? COLORS.orange : COLORS.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>{proximo ? 'Proximo remedio' : 'Tudo certo por hoje'}</Text>
                <Text style={styles.nextMed}>{proximo ? proximo.nome_remedio : 'Nenhum remedio pendente'}</Text>
                <Text style={styles.nextTime}>{proximo ? `${proximo.horario} - ${proximo.dose}` : `${tomados} de ${total} tomados`}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>O que voce precisa?</Text>
            <View style={styles.grid}>
              <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Checklist')}>
                <View style={[styles.menuIcon, { backgroundColor: COLORS.successLight }]}>
                  <Ionicons name="checkbox" size={30} color={COLORS.success} />
                </View>
                <Text style={styles.menuName}>Agenda de hoje</Text>
                <Text style={styles.menuDesc}>{total ? `${tomados} de ${total} tomados` : 'Abrir checklist'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Remedios')}>
                <View style={[styles.menuIcon, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="medkit" size={30} color={COLORS.primary} />
                </View>
                <Text style={styles.menuName}>Remedios</Text>
                <Text style={styles.menuDesc}>Ver e cadastrar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Familia')}>
                <View style={[styles.menuIcon, { backgroundColor: COLORS.purpleLight }]}>
                  <Ionicons name="people" size={30} color={COLORS.purple} />
                </View>
                <Text style={styles.menuName}>Familia</Text>
                <Text style={styles.menuDesc}>Cuidadores vinculados</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav navigation={navigation} active="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  name: { fontSize: 25, fontWeight: '800', color: COLORS.white },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: 17 },
  body: { flex: 1, padding: 16 },
  codeCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 2, borderColor: COLORS.primaryLight },
  codeLabel: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700' },
  codeText: { color: COLORS.primary, fontSize: 28, fontWeight: '900', marginTop: 4 },
  nextCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
    marginBottom: 20,
  },
  nextIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#fff8e6', alignItems: 'center', justifyContent: 'center' },
  nextLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '800', textTransform: 'uppercase' },
  nextMed: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  nextTime: { fontSize: 15, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, width: '47%', minHeight: 148 },
  menuIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  menuName: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  menuDesc: { fontSize: 14, color: COLORS.textMuted, marginTop: 5 },
});
