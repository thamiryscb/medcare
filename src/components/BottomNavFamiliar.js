import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

const tabs = [
  { name: 'HomeFamiliar', label: 'Início', icon: 'home-outline', iconActive: 'home' },
  { name: 'ChecklistFamiliar', label: 'Agenda', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'RemediosFamiliar', label: 'Remédios', icon: 'medkit-outline', iconActive: 'medkit' },
];

export default function BottomNavFamiliar({ navigation, active }) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = active === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.name)}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={24}
              color={isActive ? COLORS.purple : COLORS.textLight}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  labelActive: {
    color: COLORS.purple,
    fontWeight: '600',
  },
});
