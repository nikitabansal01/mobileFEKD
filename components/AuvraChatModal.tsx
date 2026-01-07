import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import type { RefreshStatus } from '@/services/rewardService';

// Action item interface (matches ActionPlanItem from homeService)
interface ActionItem {
  id: number;
  title: string;
  category: string;
  is_completed: boolean;
  target_hormone?: string;
}

interface AuvraChatModalProps {
  onClose: () => void;
  onResponse: (response: 'positive' | 'negative') => void;
  // New props for in-modal replacement
  actions?: ActionItem[];
  planId?: number;
  onReplaceItems?: (itemIds: number[]) => Promise<void>;
  isLoading?: boolean;
  refreshStatus?: RefreshStatus | null;
}

// Get category icon emoji
const getCategoryIcon = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'food': return '🍽️';
    case 'movement':
    case 'exercise': return '🏃';
    case 'mindfulness':
    case 'pause': return '🧘';
    default: return '✨';
  }
};

const AuvraChatModal: React.FC<AuvraChatModalProps> = ({
  onClose,
  onResponse,
  actions = [],
  planId,
  onReplaceItems,
  isLoading = false,
  refreshStatus = null
}) => {
  // Selection mode state
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [showConfirmMode, setShowConfirmMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Show ALL actions - completed ones will be grayed out
  const availableActions = actions;
  // Count selectable (non-completed) actions
  const selectableActions = actions.filter(a => !a.is_completed);
  const allCompleted = actions.length > 0 && selectableActions.length === 0;

  // Handle "I want to change it" click
  const handleWantToChange = () => {
    // Always show selection mode if there are ANY actions
    // Even if all completed, show the selection view with a message
    if (actions.length === 0) {
      // No actions at all - just close
      onResponse('positive');
      return;
    }

    // Check if ANY actions are non-completed (selectable)
    const nonCompletedActions = actions.filter(a => !a.is_completed);
    if (nonCompletedActions.length === 0) {
      // All actions are completed - still show selection mode
      // renderSelectionView will display an appropriate message
    }

    // Show selection mode - completed items will be grayed out
    setShowSelectionMode(true);
  };

  // Handle checkbox toggle
  const toggleItem = (itemId: number) => {
    // Don't allow selecting completed items
    const action = actions.find(a => a.id === itemId);
    if (action?.is_completed) return;

    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Handle "Replace Selected" click
  const handleReplaceSelected = async () => {
    if (selectedItems.size === 0 || !onReplaceItems) return;

    // If we know refresh status and user has no refreshes left, block immediately.
    if (refreshStatus && refreshStatus.can_refresh === false) {
      // Keep them in selection mode so they can cancel; don't hit backend.
      setShowConfirmMode(false);
      return;
    }

    // Ask for confirmation before consuming a refresh
    setShowConfirmMode(true);
  };

  // Handle cancel - go back to initial view
  const handleCancel = () => {
    setShowSelectionMode(false);
    setShowConfirmMode(false);
    setSelectedItems(new Set());
  };

  const handleConfirmReplace = async () => {
    if (selectedItems.size === 0 || !onReplaceItems) return;
    await onReplaceItems(Array.from(selectedItems));
    // Parent will close modal on completion; keep state as-is.
  };

  // Render initial question view
  const renderInitialView = () => (
    <>
      {/* Main chat bubble */}
      <View style={styles.chatBubble}>
        <LinearGradient
          colors={['rgba(104, 58, 244, 0.3)', 'rgba(228, 176, 236, 0.3)', 'rgba(187, 68, 113, 0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBubble}
        >
          <Text style={styles.mainMessage}>
            How does your action plan look today?
          </Text>
        </LinearGradient>
      </View>

      {/* Response options */}
      <View style={styles.responseContainer}>
        <TouchableOpacity
          style={styles.responseButton}
          onPress={() => onResponse('positive')}
        >
          <Text style={styles.responseText}>👍 It works for me</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.responseButton}
          onPress={handleWantToChange}
        >
          <Text style={styles.responseText}>👎 I want to change it</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Render selection mode view
  const renderSelectionView = () => (
    <>
      {/* Header */}
      <View style={styles.selectionHeader}>
        <Text style={styles.selectionTitle}>
          {allCompleted ? 'All actions completed!' : 'Select actions to replace'}
        </Text>
        <Text style={styles.selectionSubtitle}>
          {allCompleted
            ? 'You\'ve already done all your actions today. Great job! 🎉'
            : 'We\'ll find better alternatives for you 💜'
          }
        </Text>
      </View>

      {/* Action list with checkboxes */}
      <ScrollView
        style={styles.actionList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {availableActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionItem,
              selectedItems.has(action.id) && styles.actionItemSelected,
              action.is_completed && styles.actionItemCompleted  // Gray out completed
            ]}
            onPress={() => toggleItem(action.id)}
            disabled={isLoading || action.is_completed}  // Disable completed items
          >
            <View style={styles.checkbox}>
              {selectedItems.has(action.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={[
              styles.categoryIcon,
              action.is_completed && styles.completedText
            ]}>
              {getCategoryIcon(action.category)}
            </Text>
            <Text
              style={[
                styles.actionTitle,
                action.is_completed && styles.completedText
              ]}
              numberOfLines={2}
            >
              {action.title}
              {action.is_completed && ' ✓'}  {/* Show checkmark for completed */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.selectionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.replaceButton,
            (selectedItems.size === 0 || isLoading) && styles.replaceButtonDisabled
          ]}
          onPress={handleReplaceSelected}
          disabled={selectedItems.size === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.replaceButtonText}>
              Replace {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Daily refresh limit message (if known) */}
      {refreshStatus && refreshStatus.can_refresh === false && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitBannerText}>
            Daily refresh limit reached ({refreshStatus.limit}/day). Try again tomorrow.
          </Text>
        </View>
      )}
    </>
  );

  const renderConfirmView = () => {
    const count = selectedItems.size;
    const remaining = refreshStatus?.remaining;

    return (
      <>
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>Confirm replacement</Text>
          <Text style={styles.selectionSubtitle}>
            This will use {count > 0 ? '1' : '0'} refresh token to replace {count} action{count === 1 ? '' : 's'}.
            {typeof remaining === 'number' ? ` (${remaining} left today)` : ''}
          </Text>
        </View>

        <View style={styles.selectionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowConfirmMode(false)}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.replaceButton, isLoading && styles.replaceButtonDisabled]}
            onPress={handleConfirmReplace}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.replaceButtonText}>Yes, replace</Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        disabled={isLoading}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>

      {showSelectionMode ? (showConfirmMode ? renderConfirmView() : renderSelectionView()) : renderInitialView()}

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#683AF4" />
          <Text style={styles.loadingText}>Finding better options...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: responsiveHeight(12),
    left: responsiveWidth(5),
    right: responsiveWidth(5),
    zIndex: 1000,
    backgroundColor: '#FFEDF7',
    borderRadius: 15,
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(6),
    paddingBottom: responsiveHeight(5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: responsiveHeight(50),
  },
  chatBubble: {
    marginBottom: responsiveHeight(1.5),
  },
  gradientBubble: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(10),
    borderRadius: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  mainMessage: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter400',
    color: '#000000',
    lineHeight: responsiveHeight(2.2),
  },
  responseContainer: {
    alignItems: 'flex-end',
    gap: responsiveHeight(0.8),
  },
  responseButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#6F6F6F',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.2),
    borderRadius: 10,
    maxWidth: responsiveWidth(50),
  },
  limitBanner: {
    marginTop: responsiveHeight(1.5),
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(4),
    backgroundColor: 'rgba(193, 126, 201, 0.12)',
    borderRadius: 10,
  },
  limitBannerText: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Inter500',
    color: '#6F6F6F',
    textAlign: 'center',
  },
  responseText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter400',
    color: '#000000',
    lineHeight: responsiveHeight(2.2),
  },
  closeButton: {
    position: 'absolute',
    top: responsiveHeight(1),
    right: responsiveWidth(2),
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    borderRadius: responsiveWidth(3),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  closeButtonText: {
    fontSize: responsiveFontSize(2.5),
    color: '#666666',
    fontFamily: 'Inter600',
    lineHeight: responsiveHeight(2.5),
  },
  // Selection mode styles
  selectionHeader: {
    marginBottom: responsiveHeight(1.5),
  },
  selectionTitle: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: 'Inter600',
    color: '#000000',
    marginBottom: responsiveHeight(0.3),
  },
  selectionSubtitle: {
    fontSize: moderateScale(11, 1.5),
    fontFamily: 'Inter400',
    color: '#666666',
  },
  actionList: {
    maxHeight: responsiveHeight(20),
    marginBottom: responsiveHeight(1.5),
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(1.2),
    marginBottom: responsiveHeight(0.8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionItemSelected: {
    borderColor: '#683AF4',
    backgroundColor: 'rgba(104, 58, 244, 0.05)',
  },
  actionItemCompleted: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  completedText: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  checkbox: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#683AF4',
    marginRight: responsiveWidth(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: moderateScale(10),
    color: '#683AF4',
    fontFamily: 'Inter600',
  },
  categoryIcon: {
    fontSize: moderateScale(14),
    marginRight: responsiveWidth(2),
  },
  actionTitle: {
    flex: 1,
    fontSize: moderateScale(11, 1.5),
    fontFamily: 'Inter400',
    color: '#000000',
  },
  selectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveWidth(3),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6F6F6F',
    paddingVertical: responsiveHeight(1.2),
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter500',
    color: '#666666',
  },
  replaceButton: {
    flex: 1,
    backgroundColor: '#683AF4',
    paddingVertical: responsiveHeight(1.2),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  replaceButtonText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter500',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 237, 247, 0.95)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: responsiveHeight(1),
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter400',
    color: '#683AF4',
  },
});

export default AuvraChatModal;
