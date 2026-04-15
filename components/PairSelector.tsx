import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { useApp, FOREX_PAIRS } from '@/contexts/AppContext';

const GROUPS = ['Major', 'Cross', 'Exotic', 'Crypto'];

export function PairSelector() {
  const { selectedPairs, activePair, togglePair, setActivePair } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeGroup, setActiveGroup] = useState('Major');
  const modalAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const filteredPairs = FOREX_PAIRS.filter(p => p.group === activeGroup);

  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(modalAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 250, useNativeDriver: true }),
    ]).start(() => setModalVisible(false));
  };

  const groupCounts = GROUPS.map(g => ({
    group: g,
    count: FOREX_PAIRS.filter(p => p.group === g && selectedPairs.includes(p.symbol)).length,
  }));

  return (
    <>
      <View style={styles.row}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {FOREX_PAIRS.filter(p => selectedPairs.includes(p.symbol)).map(pair => {
            const isActive = pair.symbol === activePair;
            return (
              <TouchableOpacity
                key={pair.symbol}
                onPress={() => setActivePair(pair.symbol)}
                activeOpacity={0.75}
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

          <TouchableOpacity onPress={openModal} style={styles.addBtn} activeOpacity={0.8}>
            <MaterialIcons name="add-circle-outline" size={16} color={Colors.gold} />
            <Text style={styles.addBtnText}>+ Pairs ({FOREX_PAIRS.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal visible={modalVisible} animationType="none" transparent onRequestClose={closeModal}>
        <Animated.View style={[styles.modalOverlay, { opacity: modalAnim }]}>
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient colors={['#131b2e', '#0d1117']} style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <MaterialIcons name="currency-exchange" size={20} color={Colors.gold} />
                  <Text style={styles.modalTitle}>Trading Pairs</Text>
                </View>
                <View style={styles.modalHeaderRight}>
                  <View style={styles.selectedCountBadge}>
                    <Text style={styles.selectedCountText}>{selectedPairs.length} Active</Text>
                  </View>
                  <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Group tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupTabsScroll}>
                <View style={styles.groupTabs}>
                  {GROUPS.map(g => {
                    const gc = groupCounts.find(x => x.group === g);
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.groupTab, activeGroup === g && styles.groupTabActive]}
                        onPress={() => setActiveGroup(g)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.groupTabText, activeGroup === g && styles.groupTabTextActive]}>
                          {g}
                        </Text>
                        {gc && gc.count > 0 && (
                          <View style={[styles.groupCountBadge, activeGroup === g && styles.groupCountBadgeActive]}>
                            <Text style={[styles.groupCountText, activeGroup === g && { color: Colors.bg }]}>
                              {gc.count}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Pairs grid */}
              <ScrollView style={styles.pairsScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.pairsGrid}>
                  {filteredPairs.map(pair => {
                    const isSelected = selectedPairs.includes(pair.symbol);
                    return (
                      <TouchableOpacity
                        key={pair.symbol}
                        style={[styles.pairItem, isSelected && styles.pairItemSelected]}
                        onPress={() => togglePair(pair.symbol)}
                        activeOpacity={0.8}
                      >
                        {isSelected && (
                          <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={StyleSheet.absoluteFill} borderRadius={Radius.md} />
                        )}
                        <Text style={[styles.pairItemText, isSelected && styles.pairItemTextSelected]}>
                          {pair.label}
                        </Text>
                        {isSelected && <MaterialIcons name="check-circle" size={12} color={Colors.bg} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.doneBtn} onPress={closeModal} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.doneBtnGrad}>
                  <MaterialIcons name="check" size={18} color={Colors.bg} />
                  <Text style={styles.doneBtnText}>Done · {selectedPairs.length} pairs selected</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
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
  pairChipActive: { height: 36, paddingHorizontal: Spacing.md, justifyContent: 'center', borderRadius: Radius.full },
  pairChipText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  pairChipTextActive: { fontSize: Fonts.sizes.sm, color: Colors.bg, fontWeight: Fonts.weights.bold },
  addBtn: {
    height: 36, paddingHorizontal: Spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: 5, borderRadius: Radius.full,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.gold,
    backgroundColor: Colors.goldGlow,
  },
  addBtnText: { fontSize: Fonts.sizes.xs, color: Colors.gold, fontWeight: Fonts.weights.semibold },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContainer: { maxHeight: '88%' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, gap: Spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalTitle: { fontSize: Fonts.sizes.xl, color: Colors.textPrimary, fontWeight: Fonts.weights.bold },
  modalHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  selectedCountBadge: {
    backgroundColor: `${Colors.gold}20`, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.gold}40`,
  },
  selectedCountText: { fontSize: Fonts.sizes.xs, color: Colors.gold, fontWeight: Fonts.weights.bold },
  closeBtn: { padding: 4 },
  groupTabsScroll: { flexGrow: 0 },
  groupTabs: { flexDirection: 'row', gap: Spacing.sm },
  groupTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  groupTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  groupTabText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  groupTabTextActive: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  groupCountBadge: {
    backgroundColor: `${Colors.gold}25`, borderRadius: Radius.full,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  groupCountBadgeActive: { backgroundColor: Colors.bg },
  groupCountText: { fontSize: 9, color: Colors.gold, fontWeight: Fonts.weights.black },
  pairsScroll: { maxHeight: 320 },
  pairsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pairItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, overflow: 'hidden',
  },
  pairItemSelected: { borderColor: Colors.gold },
  pairItemText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  pairItemTextSelected: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  doneBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  doneBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  doneBtnText: { fontSize: Fonts.sizes.base, color: Colors.bg, fontWeight: Fonts.weights.bold },
});
