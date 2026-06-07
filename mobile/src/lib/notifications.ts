import { Platform } from "react-native";

import * as Notifications from "expo-notifications";

export type NotificationBlockRow = {
  id: string;
  name: string;
  start_time: string;
  repeat_rule: string | null;
  applies_to: string[] | null;
};

const CHANNEL_ID = "block-reminders";
const REMINDER_MINUTES = 10;
const LOOKAHEAD_DAYS = 14;
const MAX_SCHEDULED_NOTIFICATIONS = 64;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let channelConfigured = false;

export async function requestBlockNotificationsPermission() {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function syncBlockNotifications(blocks: NotificationBlockRow[]) {
  await ensureChannel();

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const notifications = buildNotificationSchedule(blocks, new Date());

  for (const item of notifications) {
    await Notifications.scheduleNotificationAsync({
      content: {
        channelId: CHANNEL_ID,
        title: "Bloque en 10 minutos",
        body: `${item.name} empieza a las ${formatTime(item.startTime)}`,
        data: {
          blockId: item.id,
          kind: "block-reminder",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.fireAt,
      },
    });
  }
}

export async function cancelBlockNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function ensureChannel() {
  if (Platform.OS !== "android" || channelConfigured) return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Recordatorios de bloques",
    importance: Notifications.AndroidImportance.HIGH,
    sound: null,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  channelConfigured = true;
}

function buildNotificationSchedule(blocks: NotificationBlockRow[], now: Date) {
  const upcoming: { id: string; name: string; startTime: string; fireAt: Date }[] = [];
  const startOfToday = startOfDay(now);

  for (let dayOffset = 0; dayOffset < LOOKAHEAD_DAYS; dayOffset += 1) {
    const day = addDays(startOfToday, dayOffset);
    const dayCode = getDayCode(day);

    for (const block of blocks) {
      if (!matchesDay(block, dayCode)) continue;

      const startTime = parseTime(block.start_time);
      if (!startTime) continue;

      const blockStart = new Date(day);
      blockStart.setHours(startTime.hours, startTime.minutes, 0, 0);

      const fireAt = new Date(blockStart.getTime() - REMINDER_MINUTES * 60 * 1000);
      if (fireAt <= now) continue;

      upcoming.push({
        id: block.id,
        name: block.name,
        startTime: block.start_time,
        fireAt,
      });
    }
  }

  return upcoming.sort((left, right) => left.fireAt.getTime() - right.fireAt.getTime()).slice(0, MAX_SCHEDULED_NOTIFICATIONS);
}

function matchesDay(block: NotificationBlockRow, dayCode: string) {
  if (block.repeat_rule === "daily") return true;
  if (block.repeat_rule === "weekdays") return ["mon", "tue", "wed", "thu", "fri"].includes(dayCode);
  if (Array.isArray(block.applies_to) && block.applies_to.length > 0) return block.applies_to.includes(dayCode);
  return true;
}

function parseTime(value: string) {
  const [hoursText, minutesText] = value.slice(0, 5).split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return { hours, minutes };
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 0, 0, 0, 0);
}

function getDayCode(date: Date) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getDay()];
}
