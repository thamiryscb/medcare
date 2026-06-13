import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'medcare-remedios';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function parseHorario(horario) {
  const match = String(horario || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

async function configurarCanal() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Alarmes de remedios',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 700, 400, 700],
    lightColor: '#ff7a00',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function prepararNotificacoes() {
  if (Platform.OS === 'web') return false;

  await configurarCanal();

  const atual = await Notifications.getPermissionsAsync();
  let status = atual.status;
  if (status !== 'granted') {
    const pedido = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowBadge: false,
      },
    });
    status = pedido.status;
  }

  return status === 'granted';
}

export async function cancelarLembretesMedCare() {
  if (Platform.OS === 'web') return;

  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  const lembretes = agendadas.filter((item) => item.content.data?.medcareReminder);

  await Promise.all(
    lembretes.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}

export async function reagendarLembretesDosRemedios(remedios) {
  if (Platform.OS === 'web') return { ok: false, agendados: 0 };

  const permitido = await prepararNotificacoes();
  if (!permitido) return { ok: false, agendados: 0 };

  await cancelarLembretesMedCare();

  let agendados = 0;
  for (const remedio of remedios || []) {
    for (const horario of remedio.horarios || []) {
      const parsed = parseHorario(horario);
      if (!parsed) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Hora do remedio: ${remedio.nome}`,
          body: `${remedio.dose} - ${remedio.cor_caixa || 'Caixa azul'} - ${horario}`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          color: '#ff7a00',
          data: {
            medcareReminder: true,
            remedioId: remedio.id,
            nome: remedio.nome,
            dose: remedio.dose,
            corCaixa: remedio.cor_caixa || 'Caixa azul',
            horario,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: parsed.hour,
          minute: parsed.minute,
          channelId: CHANNEL_ID,
        },
      });
      agendados += 1;
    }
  }

  return { ok: true, agendados };
}

export function observarToqueEmNotificacao(navigationRef) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    if (!data.medcareReminder || !navigationRef.current) return;

    navigationRef.current.navigate('Checklist', {
      lembrete: {
        remedioId: data.remedioId,
        nome: data.nome,
        dose: data.dose,
        corCaixa: data.corCaixa,
        horario: data.horario,
      },
    });
  });
}

export async function abrirUltimaNotificacaoSeExistir(navigationRef) {
  const response = await Notifications.getLastNotificationResponseAsync();
  const data = response?.notification?.request?.content?.data || {};
  if (!data.medcareReminder || !navigationRef.current) return;

  navigationRef.current.navigate('Checklist', {
    lembrete: {
      remedioId: data.remedioId,
      nome: data.nome,
      dose: data.dose,
      corCaixa: data.corCaixa,
      horario: data.horario,
    },
  });
}
