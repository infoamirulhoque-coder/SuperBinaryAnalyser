import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { useApp, FOREX_PAIRS } from '@/contexts/AppContext';

const GROUPS = ['Major', 'Cross', 'Exotic'];

export function PairSelector() {
  const { selectedPairs, activePair, togglePair, setActivePair } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeGroup, setActiveGroup] = useState('Major');

  const filteredPairs = FOREX_PAIRS.filter((p) => p.group === activeGroup);

  return (
    <>
      {/* Horizontal active pairs list */}
      <View style={styles.row}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {FOREX_PAIRS.filter((p) => selectedPairs.includes(p.symbol)).map((pair) => {
            const isActive = pair.symbol === activePair;
            return (
              <TouchableOpacity
                key={pair.symbol}
                onPress={() => setActivePair(pair.symbol)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.pairChipActive}>
                    <Text style={styles.pairChipTextActive}>{pair.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.pairChip}>
                    <Text style={styles.pairChipText}>{pair.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn} activeOpacity={0.8}>
            <MaterialIcons name="add" size={18} color={Colors.gold} />
            <Text style={styles.addBtnText}>Pairs</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={['#111827', '#0d1117']} style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Trading Pairs</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.selectedCount}>
                {selectedPairs.length} pairs selected
              </Text>

              {/* Group tabs */}
              <View style={styles.groupTabs}>
                {GROUPS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.groupTab, activeGroup === g && styles.groupTabActive]}
                    onPress={() => setActiveGroup(g)}
                  >
                    <Text style={[styles.groupTabText, activeGroup === g && styles.groupTabTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pairs grid */}
              <ScrollView style={styles.pairsScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.pairsGrid}>
                  {filteredPairs.map((pair) => {
                    const isSelected = selectedPairs.includes(pair.symbol);
                    return (
                      <TouchableOpacity
                        key={pair.symbol}
                        style={[styles.pairItem, isSelected && styles.pairItemSelected]}
                        onPress={() => togglePair(pair.symbol)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.pairItemText, isSelected && styles.pairItemTextSelected]}>
                          {pair.label}
                        </Text>
                        {isSelected && (
                          <MaterialIcons name="check" size={14} color={Colors.bg} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.doneBtnGrad}>
                  <Text style={styles.doneBtnText}>Done ({selectedPairs.length} selected)</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { height: 52 },
  scrollContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, gap: Spacing.sm },
  pairChip: {
    height: 36, paddingHorizontal: Spacing.md, justifyContent: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  pairChipActive: {
    height: 36, paddingHorizontal: Spacing.md, justifyContent: 'center',
    borderRadius: Radius.full,
  },
  pairChipText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  pairChipTextActive: { fontSize: Fonts.sizes.sm, color: Colors.bg, fontWeight: Fonts.weights.bold },
  addBtn: {
    height: 36, paddingHorizontal: Spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: 4,
    borderRadius: Radius.full, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.gold,
  },
  addBtnText: { fontSize: Fonts.sizes.sm, color: Colors.gold, fontWeight: Fonts.weights.medium },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContainer: { maxHeight: '85%' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, gap: Spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: Fonts.sizes.xl, color: Colors.textPrimary, fontWeight: Fonts.weights.bold },
  selectedCount: { fontSize: Fonts.sizes.sm, color: Colors.gold },
  groupTabs: { flexDirection: 'row', gap: Spacing.sm },
  groupTab: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  groupTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  groupTabText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  groupTabTextActive: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  pairsScroll: { maxHeight: 300 },
  pairsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pairItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  pairItemSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pairItemText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  pairItemTextSelected: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  doneBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  doneBtnGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
  doneBtnText: { fontSize: Fonts.sizes.base, color: Colors.bg, fontWeight: Fonts.weights.bold },
});
