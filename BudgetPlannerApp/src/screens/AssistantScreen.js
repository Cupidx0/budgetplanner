import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { assistantTips } from '../data/mockData';

function buildAssistantReply(prompt) {
  const text = prompt.trim().toLowerCase();

  if (!text) {
    return 'Ask the budget assistant about savings, bills, or monthly cash flow.';
  }

  if (text.includes('save') || text.includes('savings')) {
    return 'Your strongest move is to automate a transfer of $280 each payday. That protects your emergency fund while keeping monthly spending flexible.';
  }

  if (text.includes('bill') || text.includes('expense') || text.includes('spend')) {
    return 'Your fixed costs are well controlled. Start by cutting lifestyle and subscription spend first, then reallocate that gap to your savings target.';
  }

  if (text.includes('cash') || text.includes('left') || text.includes('remaining')) {
    return 'Based on the current plan, you have about $1,620 available after essentials and your savings target. That is a healthy runway for irregular expenses.';
  }

  return 'The current plan is balanced. Focus on keeping essentials below 60% of net income and redirect the remaining surplus toward savings and debt reduction.';
}

export default function AssistantScreen() {
  const [prompt, setPrompt] = useState('How much cash do I have left after my monthly bills?');
  const [reply, setReply] = useState(
    'Your spending is under control. The smartest move this month is to protect the emergency fund and route an extra 10% toward long-term savings.'
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Assistant</Text>
      <Text style={styles.pageTitle}>Budget guidance</Text>

      <View style={styles.panel}>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder="Ask about savings, cash flow, or bills"
          placeholderTextColor="#7e8aa5"
          style={styles.textarea}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={() => setReply(buildAssistantReply(prompt))}>
          <Text style={styles.primaryButtonText}>Ask assistant</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.replyBox}>
        <Text style={styles.replyText}>{reply}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Helpful tips</Text>
        <View style={styles.tipsList}>
          {assistantTips.map((tip) => (
            <Text key={tip} style={styles.tipItem}>• {tip}</Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    padding: 20,
    gap: 18,
  },
  eyebrow: {
    color: '#7d86a8',
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: '#1a2540',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#1d2b4d',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  textarea: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e9f4',
    backgroundColor: '#f7f9ff',
    padding: 16,
    fontSize: 15,
    color: '#1a2540',
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: '#5b7cff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  replyBox: {
    backgroundColor: '#edf3ff',
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#5b7cff',
  },
  replyText: {
    color: '#1d2b4d',
    fontSize: 15,
    lineHeight: 24,
  },
  panelTitle: {
    color: '#1a2540',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    color: '#4e5c7d',
    fontSize: 14,
    lineHeight: 22,
  },
});
