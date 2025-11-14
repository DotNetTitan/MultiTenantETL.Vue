<template>
  <div class="ai-chatbot">
    <!-- Floating Chat Button -->
    <v-btn
      v-if="!isOpen"
      icon
      size="large"
      color="primary"
      class="chat-fab"
      elevation="8"
      @click="toggleChat"
    >
      <v-icon>mdi-robot</v-icon>
    </v-btn>

    <!-- Chat Window -->
    <v-card
      v-if="isOpen"
      class="chat-window"
      elevation="12"
    >
      <v-card-title class="d-flex align-center pa-3 primary chat-header">
        <v-icon class="mr-2 text-white">mdi-robot</v-icon>
        <span class="text-white">AI Assistant</span>
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
          <p>Hi! I'm your AI assistant. Ask me anything about this page or the ETL platform.</p>
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
              <span class="text-caption">{{ msg.role === 'user' ? 'You' : 'AI Assistant' }}</span>
            </div>
            <div class="message-text">{{ msg.content }}</div>
          </div>
        </div>

        <div v-if="isLoading" class="message assistant mb-3">
          <div class="message-content">
            <div class="message-header mb-1">
              <v-icon size="small" class="mr-1">mdi-robot</v-icon>
              <span class="text-caption">AI Assistant</span>
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
import { ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { getChatResponse } from '@/services/geminiService';

const route = useRoute();
const isOpen = ref(false);
const userInput = ref('');
const messages = ref([]);
const isLoading = ref(false);
const messagesContainer = ref(null);

// Get current page context from route
const getCurrentPage = () => {
  const path = route.path.split('/')[1] || 'dashboard';
  return path;
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
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

// Clear messages when route changes
watch(() => route.path, () => {
  messages.value = [];
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

.messages-container {
  flex: 1;
  overflow-y: auto;
  background: rgba(var(--v-theme-surface), 0.5);
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

@media (max-width: 600px) {
  .chat-window {
    width: calc(100vw - 32px);
    height: calc(100vh - 100px);
  }
  
  .ai-chatbot {
    bottom: 16px;
    right: 16px;
  }
}
</style>
