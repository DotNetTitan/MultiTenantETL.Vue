<template>
  <div class="ai-chatbot">
    <!-- Floating Chat Button with Hint -->
    <div v-if="!isOpen" class="chat-fab-container">
      <v-btn
        icon
        size="large"
        color="primary"
        class="chat-fab"
        elevation="8"
        @click="toggleChat"
      >
        <v-icon>mdi-robot</v-icon>
      </v-btn>
      
      <!-- Help Hint Tooltip -->
      <div
        v-if="showHint"
        v-motion
        :initial="{ opacity: 0, x: 20, scale: 0.9 }"
        :enter="{ 
          opacity: 1, 
          x: 0, 
          scale: 1,
          transition: { 
            type: 'spring',
            stiffness: 200,
            damping: 20
          }
        }"
        :leave="{ 
          opacity: 0, 
          x: 30, 
          scale: 0.7,
          transition: { 
            duration: 400,
            ease: [0.4, 0, 0.2, 1]
          }
        }"
        :visible="{ 
          scale: [1, 1.02, 1],
          transition: { 
            duration: 2000,
            repeat: Infinity,
            ease: 'easeInOut'
          }
        }"
        class="help-hint"
        @click="toggleChat"
      >
        <div class="hint-content">
          <v-icon size="small" class="mr-1">mdi-help-circle</v-icon>
          <span>Need help? Ask Maeve!</span>
        </div>
        <v-btn
          icon
          size="x-small"
          variant="text"
          class="hint-close"
          @click.stop="dismissHint"
        >
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Chat Window -->
    <v-card
      v-if="isOpen"
      class="chat-window"
      elevation="12"
    >
      <v-card-title class="d-flex align-center pa-3 primary chat-header">
        <v-icon class="mr-2 text-white">mdi-robot</v-icon>
        <span class="text-white">Maeve</span>
        <v-spacer />
        <v-btn
          icon
          size="small"
          variant="text"
          class="close-btn"
          @click="toggleChat"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- Messages Area -->
      <v-card-text
        ref="messagesContainer"
        class="messages-container pa-3"
      >
        <div v-if="messages.length === 0" class="text-center text-medium-emphasis py-8">
          <v-icon size="48" class="mb-2">mdi-chat-question</v-icon>
          <p>Hi! I'm Maeve, your AI assistant. Ask me anything about this page or the ETL platform.</p>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message mb-3"
          :class="msg.role"
        >
          <div class="message-content">
            <div class="message-header mb-1">
              <v-icon size="small" class="mr-1">
                {{ msg.role === 'user' ? 'mdi-account' : 'mdi-robot' }}
              </v-icon>
              <span class="text-caption">{{ msg.role === 'user' ? 'You' : 'Maeve' }}</span>
            </div>
            <div class="message-text">{{ msg.content }}</div>
          </div>
        </div>

        <div v-if="isLoading" class="message assistant mb-3">
          <div class="message-content">
            <div class="message-header mb-1">
              <v-icon size="small" class="mr-1">mdi-robot</v-icon>
              <span class="text-caption">Maeve</span>
            </div>
            <div class="message-text">
              <v-progress-circular
                indeterminate
                size="20"
                width="2"
                class="mr-2"
              />
              Thinking...
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Input Area -->
      <v-card-actions class="pa-3">
        <v-text-field
          v-model="userInput"
          placeholder="Ask me anything..."
          variant="outlined"
          density="compact"
          hide-details
          @keyup.enter="sendMessage"
        >
          <template #append-inner>
            <v-btn
              icon
              size="small"
              :disabled="!userInput.trim() || isLoading"
              @click="sendMessage"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getChatResponse } from '@/services/geminiService';

const route = useRoute();
const isOpen = ref(false);
const userInput = ref('');
const messages = ref([]);
const isLoading = ref(false);
const messagesContainer = ref(null);
const showHint = ref(false);
const hintTimer = ref(null);
const hintDismissed = ref(false);

// Get current page context from route
const getCurrentPage = () => {
  const path = route.path.split('/')[1] || 'dashboard';
  return path;
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    dismissHint();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  const message = userInput.value.trim();
  userInput.value = '';

  // Add user message
  messages.value.push({
    role: 'user',
    content: message
  });

  scrollToBottom();
  isLoading.value = true;

  try {
    const currentPage = getCurrentPage();
    const response = await getChatResponse(message, currentPage, messages.value);

    // Add assistant response
    messages.value.push({
      role: 'assistant',
      content: response
    });

    scrollToBottom();
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.'
    });
  } finally {
    isLoading.value = false;
  }
};

// Inactivity hint logic
const startHintTimer = () => {
  clearHintTimer();
  if (!hintDismissed.value && !isOpen.value) {
    hintTimer.value = setTimeout(() => {
      showHint.value = true;
    }, 5000); // Show after 5 seconds of inactivity
  }
};

const clearHintTimer = () => {
  if (hintTimer.value) {
    clearTimeout(hintTimer.value);
    hintTimer.value = null;
  }
};

const dismissHint = () => {
  showHint.value = false;
  hintDismissed.value = true;
  clearHintTimer();
};

const resetHintTimer = () => {
  // Only reset if hint is not currently showing
  if (!showHint.value) {
    clearHintTimer();
    startHintTimer();
  }
};

// Track user activity (but not when hint is visible)
const handleUserActivity = () => {
  if (!isOpen.value && !showHint.value) {
    resetHintTimer();
  }
};

// Clear messages when route changes
watch(() => route.path, () => {
  messages.value = [];
  hintDismissed.value = false; // Reset hint dismissal on page change
  resetHintTimer();
});

// Watch chat open state
watch(isOpen, (newValue) => {
  if (newValue) {
    clearHintTimer();
    showHint.value = false;
  } else {
    startHintTimer();
  }
});

onMounted(() => {
  // Start hint timer on mount
  startHintTimer();
  
  // Listen for user activity
  window.addEventListener('mousemove', handleUserActivity);
  window.addEventListener('keydown', handleUserActivity);
  window.addEventListener('click', handleUserActivity);
  window.addEventListener('scroll', handleUserActivity);
});

onUnmounted(() => {
  clearHintTimer();
  
  // Clean up event listeners
  window.removeEventListener('mousemove', handleUserActivity);
  window.removeEventListener('keydown', handleUserActivity);
  window.removeEventListener('click', handleUserActivity);
  window.removeEventListener('scroll', handleUserActivity);
});
</script>

<style scoped>
.ai-chatbot {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.chat-fab {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.chat-window {
  width: 380px;
  height: 500px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
}

.chat-header {
  flex-shrink: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  background: rgba(var(--v-theme-surface), 0.5);
  -webkit-overflow-scrolling: touch;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
}

.message.user .message-content {
  background: rgb(var(--v-theme-primary));
  color: white;
}

.message.assistant .message-content {
  background: rgba(var(--v-theme-surface-variant), 1);
}

.message-header {
  display: flex;
  align-items: center;
  opacity: 0.7;
}

.message-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Light mode only improvements - don't touch dark mode */
.v-theme--light .chat-window {
  border: 1px solid #E0E0E0;
}

.v-theme--light .messages-container {
  background: #F5F5F5;
}

.v-theme--light .message.assistant .message-content {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  color: #212121;
}

.v-theme--light .message.assistant .message-header {
  color: #616161;
}

.v-theme--light .message.assistant .message-text {
  color: #212121;
}

/* Light mode header - make it visible */
.v-theme--light .v-card-title.primary {
  background-color: #1976D2 !important;
}

.v-theme--light .v-card-title.primary * {
  color: white !important;
}

/* Light mode placeholder text */
.v-theme--light .v-text-field input::placeholder {
  color: #616161 !important;
  opacity: 1 !important;
}

/* Light mode input border */
.v-theme--light .v-card-actions {
  border-top: 1px solid #E0E0E0;
}

/* Chat FAB Container */
.chat-fab-container {
  position: relative;
}

/* Help Hint Tooltip */
.help-hint {
  position: absolute;
  bottom: 8px;
  right: 76px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
  color: rgb(var(--v-theme-on-surface));
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
  z-index: 999;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.help-hint:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.hint-content {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
}

.hint-content .v-icon {
  color: rgb(var(--v-theme-primary));
}

.hint-close {
  opacity: 0.6;
  margin-left: 4px;
  color: rgb(var(--v-theme-on-surface));
}

.hint-close:hover {
  opacity: 1;
  background: rgba(var(--v-theme-on-surface), 0.1);
}

/* Light mode hint */
.v-theme--light .help-hint {
  background: #FFFFFF;
  border: 1px solid #2196F3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.v-theme--light .help-hint:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Dark mode hint */
.v-theme--dark .help-hint {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-primary), 0.6);
}

/* Hide chatbot completely on mobile and tablet */
@media (max-width: 960px) {
  .ai-chatbot {
    display: none !important;
  }
}
</style>
