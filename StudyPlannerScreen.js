// StudyPlannerScreen.js

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
  Alert,
  Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { colors, shadow } from './theme';

const STORAGE_KEY = 'STUDY_PLANS';

// Show notifications while the native app is open
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const padNumber = number =>
  String(number).padStart(2, '0');

const dayOptions = Array.from(
  { length: 31 },
  (_, index) => {
    const day = index + 1;

    return {
      label: padNumber(day),
      value: padNumber(day),
    };
  }
);

const monthOptions = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const hourOptions = Array.from(
  { length: 12 },
  (_, index) => {
    const hour = index + 1;

    return {
      label: padNumber(hour),
      value: padNumber(hour),
    };
  }
);

const minuteOptions = Array.from(
  { length: 60 },
  (_, index) => ({
    label: padNumber(index),
    value: padNumber(index),
  })
);

const periodOptions = [
  {
    label: 'AM',
    value: 'AM',
  },
  {
    label: 'PM',
    value: 'PM',
  },
];

export default function StudyPlannerScreen({
  navigation,
}) {
  const today = new Date();

  const webTimersRef = useRef({});

  const [subject, setSubject] = useState('');

  const [selectedDay, setSelectedDay] =
    useState(padNumber(today.getDate()));

  const [selectedMonth, setSelectedMonth] =
    useState(
      padNumber(today.getMonth() + 1)
    );

  const [selectedYear] = useState(
    today.getFullYear()
  );

  const [selectedHour, setSelectedHour] =
    useState('06');

  const [selectedMinute, setSelectedMinute] =
    useState('00');

  const [selectedPeriod, setSelectedPeriod] =
    useState('PM');

  const [showDayDropdown, setShowDayDropdown] =
    useState(false);

  const [
    showMonthDropdown,
    setShowMonthDropdown,
  ] = useState(false);

  const [
    showHourDropdown,
    setShowHourDropdown,
  ] = useState(false);

  const [
    showMinuteDropdown,
    setShowMinuteDropdown,
  ] = useState(false);

  const [
    showPeriodDropdown,
    setShowPeriodDropdown,
  ] = useState(false);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] =
    useState(true);

  const [currentTime, setCurrentTime] =
    useState(new Date());

  useEffect(() => {
    initialisePlanner();

    const statusTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => {
      clearInterval(statusTimer);

      Object.values(
        webTimersRef.current
      ).forEach(timerId => {
        clearTimeout(timerId);
      });
    };
  }, []);

  const initialisePlanner = async () => {
    try {
      await configureNotifications();

      const savedPlans = await loadPlans();

      if (Platform.OS === 'web') {
        restoreWebNotifications(savedPlans);
      }
    } finally {
      setLoadingPlans(false);
    }
  };

  // =====================================================
  // NOTIFICATION PERMISSION
  // =====================================================

  const configureNotifications = async () => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      if (
        Platform.OS === 'android'
      ) {
        await Notifications.setNotificationChannelAsync(
          'study-reminders',
          {
            name: 'Study Reminders',
            importance:
              Notifications.AndroidImportance
                .HIGH,
            vibrationPattern: [
              0,
              250,
              250,
              250,
            ],
            sound: 'default',
          }
        );
      }

      if (!Device.isDevice) {
        console.log(
          'Native notifications require a physical device.'
        );

        return;
      }

      const currentPermission =
        await Notifications.getPermissionsAsync();

      if (
        currentPermission.status !==
        'granted'
      ) {
        await Notifications.requestPermissionsAsync();
      }
    } catch (error) {
      console.error(
        'Notification configuration error:',
        error
      );
    }
  };

  const requestWebNotificationPermission =
    async () => {
      if (Platform.OS !== 'web') {
        return true;
      }

      if (
        typeof window === 'undefined' ||
        !('Notification' in window)
      ) {
        window.alert(
          'This browser does not support notifications.'
        );

        return false;
      }

      if (
        window.Notification.permission ===
        'granted'
      ) {
        return true;
      }

      if (
        window.Notification.permission ===
        'denied'
      ) {
        window.alert(
          'Chrome notifications are blocked. Open the site settings and allow notifications for Expo Snack.'
        );

        return false;
      }

      try {
        const permission =
          await window.Notification.requestPermission();

        if (permission !== 'granted') {
          window.alert(
            'Notification permission was not granted.'
          );

          return false;
        }

        return true;
      } catch (error) {
        console.error(
          'Web permission error:',
          error
        );

        window.alert(
          'Unable to request Chrome notification permission.'
        );

        return false;
      }
    };

  // =====================================================
  // STORAGE
  // =====================================================

  const loadPlans = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(
          STORAGE_KEY
        );

      if (!saved) {
        setPlans([]);
        return [];
      }

      const parsedPlans = JSON.parse(saved);

      if (!Array.isArray(parsedPlans)) {
        setPlans([]);
        return [];
      }

      setPlans(parsedPlans);

      return parsedPlans;
    } catch (error) {
      console.error(
        'Load plans error:',
        error
      );

      setPlans([]);
      return [];
    }
  };

  const savePlans = async newPlans => {
    try {
      setPlans(newPlans);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newPlans)
      );

      return true;
    } catch (error) {
      console.error(
        'Save plans error:',
        error
      );

      return false;
    }
  };

  // =====================================================
  // DATE AND TIME HELPERS
  // =====================================================

  const getSelectedMonthLabel = () => {
    return (
      monthOptions.find(
        item =>
          item.value === selectedMonth
      )?.label || 'Month'
    );
  };

  const convertTo24Hour = (
    hour,
    period
  ) => {
    let convertedHour =
      Number(hour);

    if (
      period === 'AM' &&
      convertedHour === 12
    ) {
      convertedHour = 0;
    }

    if (
      period === 'PM' &&
      convertedHour !== 12
    ) {
      convertedHour += 12;
    }

    return padNumber(convertedHour);
  };

  const getSelectedTimeLabel = () => {
    return `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
  };

  const getSelectedDateValue = () => {
    return `${selectedYear}-${selectedMonth}-${selectedDay}`;
  };

  const getFriendlyDate = () => {
    return `${selectedDay} ${getSelectedMonthLabel()} ${selectedYear}`;
  };

  const createSelectedDate = () => {
    const hour24 = convertTo24Hour(
      selectedHour,
      selectedPeriod
    );

    return new Date(
      selectedYear,
      Number(selectedMonth) - 1,
      Number(selectedDay),
      Number(hour24),
      Number(selectedMinute),
      0,
      0
    );
  };

  const isValidSelectedDate =
    dateObject => {
      return (
        dateObject.getFullYear() ===
          selectedYear &&
        dateObject.getMonth() ===
          Number(selectedMonth) - 1 &&
        dateObject.getDate() ===
          Number(selectedDay)
      );
    };

  // =====================================================
  // WEB NOTIFICATIONS
  // =====================================================

  const showWebNotification = plan => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined'
    ) {
      return;
    }

    if (
      !('Notification' in window) ||
      window.Notification.permission !==
        'granted'
    ) {
      return;
    }

    try {
      const notification =
        new window.Notification(
          '📚 Study Reminder',
          {
            body: `Time to study ${plan.subject}`,
            tag: `study-plan-${plan.id}`,
            requireInteraction: true,
          }
        );

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error(
        'Chrome notification error:',
        error
      );
    }
  };

  const scheduleWebNotification = plan => {
    if (Platform.OS !== 'web') {
      return;
    }

    const targetDate = new Date(
      plan.fullDate
    );

    const delay =
      targetDate.getTime() -
      Date.now();

    if (delay <= 0) {
      return;
    }

    if (
      webTimersRef.current[plan.id]
    ) {
      clearTimeout(
        webTimersRef.current[plan.id]
      );
    }

    // Browsers have a maximum timeout length.
    // Longer reminders are checked again later.
    const maximumDelay = 2147483647;

    const scheduleTimer = () => {
      const remaining =
        targetDate.getTime() -
        Date.now();

      if (remaining <= 0) {
        showWebNotification(plan);

        delete webTimersRef.current[
          plan.id
        ];

        setCurrentTime(new Date());

        return;
      }

      const timerDelay = Math.min(
        remaining,
        maximumDelay
      );

      webTimersRef.current[plan.id] =
        setTimeout(
          scheduleTimer,
          timerDelay
        );
    };

    scheduleTimer();
  };

  const restoreWebNotifications =
    savedPlans => {
      savedPlans.forEach(plan => {
        const planDate = new Date(
          plan.fullDate
        );

        if (planDate > new Date()) {
          scheduleWebNotification(plan);
        }
      });
    };

  // =====================================================
  // NATIVE NOTIFICATION
  // =====================================================

  const scheduleNativeNotification =
    async (
      dateObject,
      subjectName
    ) => {
      if (Platform.OS === 'web') {
        return null;
      }

      try {
        if (!Device.isDevice) {
          Alert.alert(
            'Physical Device Required',
            'Native notifications should be tested on a physical Android or iOS device.'
          );

          return null;
        }

        const permission =
          await Notifications.getPermissionsAsync();

        if (
          permission.status !== 'granted'
        ) {
          const requestedPermission =
            await Notifications.requestPermissionsAsync();

          if (
            requestedPermission.status !==
            'granted'
          ) {
            Alert.alert(
              'Permission Required',
              'Please allow notifications to receive study reminders.'
            );

            return null;
          }
        }

        const notificationId =
          await Notifications.scheduleNotificationAsync(
            {
              content: {
                title:
                  '📚 Study Reminder',
                body: `Time to study ${subjectName}`,
                sound: 'default',
                data: {
                  screen: 'Planner',
                },
              },

              trigger: {
                type:
                  Notifications
                    .SchedulableTriggerInputTypes
                    .DATE,

                date: dateObject,

                channelId:
                  Platform.OS ===
                  'android'
                    ? 'study-reminders'
                    : undefined,
              },
            }
          );

        return notificationId;
      } catch (error) {
        console.error(
          'Native notification error:',
          error
        );

        return null;
      }
    };

  // =====================================================
  // ADD PLAN
  // =====================================================

  const addPlan = async () => {
    const cleanSubject =
      subject.trim();

    if (!cleanSubject) {
      showMessage(
        'Missing Information',
        'Please enter a subject.'
      );

      return;
    }

    const finalDate =
      createSelectedDate();

    if (
      Number.isNaN(
        finalDate.getTime()
      ) ||
      !isValidSelectedDate(finalDate)
    ) {
      showMessage(
        'Invalid Date',
        'The selected date does not exist. Please choose a valid day and month.'
      );

      return;
    }

    if (finalDate <= new Date()) {
      showMessage(
        'Invalid Time',
        'Please select a future date and time.'
      );

      return;
    }

    let notificationId = null;

    if (Platform.OS === 'web') {
      const permissionGranted =
        await requestWebNotificationPermission();

      if (!permissionGranted) {
        return;
      }
    } else {
      notificationId =
        await scheduleNativeNotification(
          finalDate,
          cleanSubject
        );
    }

    const newPlan = {
      id: Date.now().toString(),

      subject: cleanSubject,

      date: getSelectedDateValue(),

      friendlyDate:
        getFriendlyDate(),

      day: selectedDay,

      month:
        getSelectedMonthLabel(),

      year: selectedYear,

      hour: selectedHour,

      minute: selectedMinute,

      period: selectedPeriod,

      timeLabel:
        getSelectedTimeLabel(),

      fullDate:
        finalDate.toISOString(),

      notificationId,
    };

    const updatedPlans = [
      newPlan,
      ...plans,
    ];

    const saved =
      await savePlans(updatedPlans);

    if (!saved) {
      showMessage(
        'Error',
        'The study reminder could not be saved.'
      );

      return;
    }

    if (Platform.OS === 'web') {
      scheduleWebNotification(
        newPlan
      );
    }

    setSubject('');

    showMessage(
      'Reminder Scheduled',
      `${cleanSubject} is scheduled for ${getFriendlyDate()} at ${getSelectedTimeLabel()}.`
    );
  };

  // =====================================================
  // DELETE PLAN
  // =====================================================

  const confirmDeletePlan = async plan => {
    try {
      if (
        plan.notificationId &&
        Platform.OS !== 'web'
      ) {
        try {
          await Notifications.cancelScheduledNotificationAsync(
            plan.notificationId
          );
        } catch (notificationError) {
          console.log(
            'Notification cancellation skipped:',
            notificationError
          );
        }
      }

      if (
        Platform.OS === 'web' &&
        webTimersRef.current[plan.id]
      ) {
        clearTimeout(
          webTimersRef.current[plan.id]
        );

        delete webTimersRef.current[
          plan.id
        ];
      }

      const updatedPlans =
        plans.filter(
          item =>
            String(item.id) !==
            String(plan.id)
        );

      const saved =
        await savePlans(updatedPlans);

      if (!saved) {
        throw new Error(
          'Unable to update saved plans.'
        );
      }

      showMessage(
        'Deleted',
        'Study reminder deleted successfully.'
      );
    } catch (error) {
      console.error(
        'Delete plan error:',
        error
      );

      showMessage(
        'Error',
        'Failed to delete the study reminder.'
      );
    }
  };

  const deletePlan = plan => {
    if (Platform.OS === 'web') {
      const shouldDelete =
        window.confirm(
          `Are you sure you want to delete the reminder for "${plan.subject}"?`
        );

      if (shouldDelete) {
        confirmDeletePlan(plan);
      }

      return;
    }

    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete the reminder for "${plan.subject}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            confirmDeletePlan(plan),
        },
      ]
    );
  };

  // =====================================================
  // MESSAGES AND STATUS
  // =====================================================

  const showMessage = (
    title,
    message
  ) => {
    if (Platform.OS === 'web') {
      window.alert(
        `${title}\n\n${message}`
      );

      return;
    }

    Alert.alert(title, message);
  };

  const getStatus = plan => {
    const planDate = new Date(
      plan.fullDate
    );

    return planDate <= currentTime
      ? 'Completed'
      : 'Scheduled';
  };

  // =====================================================
  // DROPDOWN COMPONENT
  // =====================================================

  const closeAllDropdowns = except => {
    if (except !== 'day') {
      setShowDayDropdown(false);
    }

    if (except !== 'month') {
      setShowMonthDropdown(false);
    }

    if (except !== 'hour') {
      setShowHourDropdown(false);
    }

    if (except !== 'minute') {
      setShowMinuteDropdown(false);
    }

    if (except !== 'period') {
      setShowPeriodDropdown(false);
    }
  };

  const Dropdown = ({
    title,
    value,
    isOpen,
    setOpen,
    options,
    onSelect,
    dropdownName,
    compact = false,
  }) => {
    const toggleDropdown = () => {
      closeAllDropdowns(
        dropdownName
      );

      setOpen(!isOpen);
    };

    return (
      <View
        style={[
          styles.dropdownWrapper,
          compact &&
            styles.compactDropdownWrapper,
        ]}
      >
        <Text style={styles.miniLabel}>
          {title}
        </Text>

        <TouchableOpacity
          style={[
            styles.dropdownHeader,
            compact &&
              styles.compactDropdownHeader,
          ]}
          onPress={toggleDropdown}
          activeOpacity={0.8}
        >
          <Text
            style={styles.dropdownText}
          >
            {value}
          </Text>

          <Text
            style={styles.dropdownArrow}
          >
            {isOpen ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {isOpen && (
          <View
            style={styles.dropdownList}
          >
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={
                styles.dropdownScroll
              }
            >
              {options.map(item => (
                <TouchableOpacity
                  key={`${dropdownName}-${item.value}`}
                  style={
                    styles.dropdownItem
                  }
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={
                      styles.dropdownItemText
                    }
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <Text style={styles.title}>
        Study Planner
      </Text>

      <Text style={styles.subtitle}>
        Schedule your study sessions and
        receive reminders
      </Text>

      <View style={styles.card}>
        <Text style={styles.icon}>
          📅
        </Text>

        <Text style={styles.cardTitle}>
          Create Study Schedule
        </Text>

        <Text style={styles.fieldLabel}>
          Subject
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Subject e.g. Database Systems"
          placeholderTextColor={
            colors.muted
          }
          value={subject}
          onChangeText={setSubject}
          returnKeyType="done"
        />

        <Text style={styles.label}>
          Select Date
        </Text>

        <View style={styles.dropdownRow}>
          <Dropdown
            title="Day"
            value={selectedDay}
            isOpen={showDayDropdown}
            setOpen={
              setShowDayDropdown
            }
            options={dayOptions}
            onSelect={setSelectedDay}
            dropdownName="day"
          />

          <View style={styles.rowGap} />

          <Dropdown
            title="Month"
            value={
              getSelectedMonthLabel()
            }
            isOpen={
              showMonthDropdown
            }
            setOpen={
              setShowMonthDropdown
            }
            options={monthOptions}
            onSelect={
              setSelectedMonth
            }
            dropdownName="month"
          />
        </View>

        <View
          style={styles.selectedBox}
        >
          <Text
            style={
              styles.selectedDateText
            }
          >
            📅 {getFriendlyDate()}
          </Text>
        </View>

        <Text style={styles.label}>
          Select Time
        </Text>

        <View style={styles.timeRow}>
          <Dropdown
            title="Hour"
            value={selectedHour}
            isOpen={
              showHourDropdown
            }
            setOpen={
              setShowHourDropdown
            }
            options={hourOptions}
            onSelect={
              setSelectedHour
            }
            dropdownName="hour"
            compact
          />

          <Text
            style={styles.timeColon}
          >
            :
          </Text>

          <Dropdown
            title="Minute"
            value={selectedMinute}
            isOpen={
              showMinuteDropdown
            }
            setOpen={
              setShowMinuteDropdown
            }
            options={minuteOptions}
            onSelect={
              setSelectedMinute
            }
            dropdownName="minute"
            compact
          />

          <View
            style={styles.smallRowGap}
          />

          <Dropdown
            title="AM/PM"
            value={selectedPeriod}
            isOpen={
              showPeriodDropdown
            }
            setOpen={
              setShowPeriodDropdown
            }
            options={periodOptions}
            onSelect={
              setSelectedPeriod
            }
            dropdownName="period"
            compact
          />
        </View>

        <View
          style={styles.selectedBox}
        >
          <Text
            style={
              styles.selectedTimeText
            }
          >
            ⏰ {getSelectedTimeLabel()}
          </Text>
        </View>

        {Platform.OS === 'web' && (
          <View
            style={
              styles.notificationNote
            }
          >
            <Text
              style={
                styles.notificationNoteText
              }
            >
              🔔 Chrome will ask for
              notification permission when
              you set your first reminder.
              Keep this browser page open to
              receive it.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={addPlan}
          activeOpacity={0.85}
        >
          <Text
            style={styles.buttonText}
          >
            🔔 Set Reminder
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>
        Scheduled Plans
      </Text>

      {loadingPlans ? (
        <View style={styles.emptyBox}>
          <Text
            style={styles.emptyText}
          >
            Loading study plans...
          </Text>
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text
            style={styles.emptyTitle}
          >
            No schedule yet
          </Text>

          <Text
            style={styles.emptyText}
          >
            Add your first study
            reminder.
          </Text>
        </View>
      ) : (
        plans.map(plan => {
          const status =
            getStatus(plan);

          return (
            <View
              key={String(plan.id)}
              style={styles.planCard}
            >
              <View style={styles.row}>
                <View
                  style={
                    styles.planInformation
                  }
                >
                  <Text
                    style={styles.subject}
                  >
                    📘 {plan.subject}
                  </Text>

                  <Text
                    style={styles.detail}
                  >
                    📅{' '}
                    {plan.friendlyDate ||
                      plan.date}
                  </Text>

                  <Text
                    style={styles.detail}
                  >
                    ⏰{' '}
                    {plan.timeLabel ||
                      plan.time}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.status,

                    status ===
                    'Completed'
                      ? styles.completed
                      : styles.scheduled,
                  ]}
                >
                  {status}
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.deleteButton
                }
                onPress={() =>
                  deletePlan(plan)
                }
              >
                <Text
                  style={
                    styles.deleteText
                  }
                >
                  🗑️ Delete Reminder
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          navigation.goBack()
        }
      >
        <Text
          style={styles.buttonText}
        >
          🏠 Back Home
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  contentContainer: {
    padding: 22,
    paddingBottom: 55,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 35,
  },

  subtitle: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 18,
  },

  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 24,
    marginBottom: 25,
    overflow: 'visible',
    ...shadow,
  },

  icon: {
    fontSize: 42,
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },

  fieldLabel: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },

  input: {
    backgroundColor: colors.bg,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 15,
    color: colors.text,
    fontSize: 15,
  },

  label: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    marginTop: 5,
  },

  miniLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 5,
  },

  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    zIndex: 20,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 10,
  },

  rowGap: {
    width: 12,
  },

  smallRowGap: {
    width: 8,
  },

  dropdownWrapper: {
    flex: 1,
    position: 'relative',
  },

  compactDropdownWrapper: {
    minWidth: 70,
  },

  dropdownHeader: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 15,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  compactDropdownHeader: {
    paddingHorizontal: 11,
    paddingVertical: 14,
  },

  dropdownText: {
    fontWeight: 'bold',
    color: colors.text,
    fontSize: 14,
  },

  dropdownArrow: {
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 5,
  },

  dropdownList: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    maxHeight: 230,
    ...shadow,
  },

  dropdownScroll: {
    maxHeight: 230,
  },

  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  dropdownItemText: {
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  timeColon: {
    fontSize: 25,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 5,
    marginTop: 17,
  },

  selectedBox: {
    backgroundColor:
      colors.softPurple,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  selectedDateText: {
    color: colors.primary,
    fontWeight: 'bold',
  },

  selectedTimeText: {
    color: colors.primary,
    fontWeight: 'bold',
  },

  notificationNote: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
  },

  notificationNoteText: {
    color: '#795548',
    fontSize: 12,
    lineHeight: 18,
  },

  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
  },

  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  section: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },

  emptyBox: {
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 20,
    ...shadow,
  },

  emptyTitle: {
    fontWeight: 'bold',
    color: colors.text,
  },

  emptyText: {
    color: colors.muted,
    marginTop: 5,
  },

  planCard: {
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    ...shadow,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  planInformation: {
    flex: 1,
    marginRight: 10,
  },

  subject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },

  detail: {
    color: colors.muted,
    marginTop: 6,
  },

  status: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },

  scheduled: {
    backgroundColor:
      colors.softPurple,
    color: colors.primary,
  },

  completed: {
    backgroundColor:
      colors.softGreen ||
      '#E8F5E9',

    color:
      colors.secondary ||
      '#2E7D32',
  },

  deleteButton: {
    marginTop: 15,
    backgroundColor: '#FFECEC',
    padding: 12,
    borderRadius: 12,
  },

  deleteText: {
    textAlign: 'center',
    color: '#E53935',
    fontWeight: 'bold',
  },

  backButton: {
    backgroundColor:
      colors.primaryDark,
    padding: 16,
    borderRadius: 14,
    marginTop: 15,
    marginBottom: 40,
  },
});