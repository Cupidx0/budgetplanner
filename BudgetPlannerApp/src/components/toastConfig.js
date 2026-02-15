import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BaseToast } from 'react-native-toast-message';

const ConfirmToast = ({ text1, text2, props, hide }) => {
  const {
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
  } = props || {};

  const handleCancel = () => {
    if (typeof hide === 'function') {
      hide();
    }
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  const handleConfirm = async () => {
    if (typeof hide === 'function') {
      hide();
    }
    if (typeof onConfirm === 'function') {
      await onConfirm();
    }
  };

  return (
    <BaseToast
      text1={text1}
      text2={text2}
      style={styles.confirmBase}
      contentContainerStyle={styles.content}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      onPress={undefined}
      activeOpacity={1}
      renderTrailingIcon={() => (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
            <Text style={styles.cancelText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
            <Text style={styles.confirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

export const toastConfig = {
  confirm: ConfirmToast,
};

const styles = StyleSheet.create({
  confirmBase: {
    borderLeftColor: '#D97706',
  },
  content: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  text1: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  text2: {
    fontSize: 10,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
  },
  cancelButton: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  confirmButton: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
    marginLeft: 6,
  },
  cancelText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '600',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
