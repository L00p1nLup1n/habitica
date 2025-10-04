<template>
  <b-modal
    id="manage-quotes-modal"
    :title="$t('manageCustomQuotes')"
    size="lg"
    :hide-footer="true"
  >
    <div class="manage-quotes-modal">
      <!-- Enable/Disable Toggle -->
      <div class="settings-section">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4>{{ $t('customQuotesFeature') }}</h4>
            <p class="text-muted mb-0">
              {{ $t('customQuotesDescription') }}
            </p>
          </div>
          <toggle-switch
            v-model="enabled"
            @change="toggleCustomQuotes"
          />
        </div>
      </div>

      <hr>

      <!-- Add New Quote Form -->
      <div
        v-if="enabled"
        class="add-quote-section"
      >
        <h5>{{ $t(editingIndex !== null ? 'editQuote' : 'addNewQuote') }}</h5>
        <form @submit.prevent="saveQuote">
          <div class="form-group">
            <label>{{ $t('quoteText') }} *</label>
            <textarea
              v-model="newQuote.text"
              class="form-control"
              :placeholder="$t('quoteTextPlaceholder')"
              rows="3"
              maxlength="500"
              required
            ></textarea>
            <small class="form-text text-muted">
              {{ newQuote.text.length }}/500 {{ $t('characters') }}
            </small>
          </div>
          <div class="form-group">
            <label>{{ $t('quoteAuthor') }}</label>
            <input
              v-model="newQuote.author"
              type="text"
              class="form-control"
              :placeholder="$t('quoteAuthorPlaceholder')"
              maxlength="100"
            >
          </div>
          <div class="d-flex gap-2">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!newQuote.text.trim() || saving"
            >
              {{ editingIndex !== null ? $t('updateQuote') : $t('addQuote') }}
            </button>
            <button
              v-if="editingIndex !== null"
              type="button"
              class="btn btn-secondary"
              @click="cancelEdit"
            >
              {{ $t('cancel') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Quotes List -->
      <div
        v-if="enabled && quotes.length > 0"
        class="quotes-list-section mt-4"
      >
        <h5>{{ $t('yourQuotes') }} ({{ quotes.length }})</h5>
        <div class="quotes-list">
          <div
            v-for="(quoteItem, index) in quotes"
            :key="index"
            class="quote-item"
            :class="{ 'editing': editingIndex === index }"
          >
            <div class="quote-item-content">
              <p class="quote-item-text">
                "{{ quoteItem.text }}"
              </p>
              <p
                v-if="quoteItem.author"
                class="quote-item-author"
              >
                — {{ quoteItem.author }}
              </p>
            </div>
            <div class="quote-item-actions">
              <button
                class="btn btn-sm btn-secondary"
                @click="editQuote(index)"
              >
                {{ $t('edit') }}
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="deleteQuote(index)"
              >
                {{ $t('delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="enabled && quotes.length === 0"
        class="empty-state mt-4"
      >
        <p class="text-muted text-center">
          {{ $t('noQuotesYet') }}
        </p>
      </div>
    </div>
  </b-modal>
</template>

<script>
import axios from 'axios';
import toggleSwitch from '@/components/ui/toggleSwitch.vue';

export default {
  name: 'ManageQuotesModal',
  components: {
    toggleSwitch,
  },
  data () {
    return {
      enabled: false,
      quotes: [],
      newQuote: {
        text: '',
        author: '',
      },
      editingIndex: null,
      saving: false,
      loading: false,
    };
  },
  mounted () {
    this.$root.$on('bv::modal::show', (bvEvent, modalId) => {
      if (modalId === 'manage-quotes-modal') {
        this.loadQuotes();
      }
    });
  },
  beforeDestroy () {
    this.$root.$off('bv::modal::show');
  },
  methods: {
    async loadQuotes () {
      try {
        this.loading = true;
        const response = await axios.get('/api/v3/user/quotes/daily');
        // Get full user preferences to check enabled status
        const userResponse = await axios.get('/api/v3/user');
        if (userResponse.data && userResponse.data.data) {
          const customQuotes = userResponse.data.data.preferences.customQuotes;
          this.enabled = customQuotes.enabled;
          this.quotes = customQuotes.quotes || [];
        }
      } catch (error) {
        console.error('Failed to load quotes:', error);
      } finally {
        this.loading = false;
      }
    },
    async toggleCustomQuotes () {
      try {
        await axios.put('/api/v3/user/quotes/settings', {
          enabled: this.enabled,
        });
        // Refresh the quote display
        this.$root.$emit('reload-daily-quote');
      } catch (error) {
        // Revert toggle
        this.enabled = !this.enabled;
        console.error('Failed to update settings:', error);
      }
    },
    async saveQuote () {
      if (!this.newQuote.text.trim()) return;

      try {
        this.saving = true;
        if (this.editingIndex !== null) {
          // Update existing quote (using index)
          await axios.put(`/api/v3/user/quotes/${this.editingIndex}`, {
            text: this.newQuote.text.trim(),
            author: this.newQuote.author.trim(),
          });
        } else {
          // Add new quote
          await axios.post('/api/v3/user/quotes', {
            text: this.newQuote.text.trim(),
            author: this.newQuote.author.trim(),
          });
        }

        // Reset form and reload
        this.newQuote = { text: '', author: '' };
        this.editingIndex = null;
        await this.loadQuotes();
        this.$root.$emit('reload-daily-quote');
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to save quote';
        console.error('Failed to save quote:', message);
        console.error('Failed to save quote:', error);
      } finally {
        this.saving = false;
      }
    },
    editQuote (index) {
      this.editingIndex = index;
      const quote = this.quotes[index];
      this.newQuote = {
        text: quote.text,
        author: quote.author || '',
      };
      // Scroll to form
      this.$nextTick(() => {
        this.$el.querySelector('textarea').focus();
      });
    },
    async deleteQuote (index) {
      if (!confirm(this.$t('confirmDeleteQuote'))) return;

      try {
        await axios.delete(`/api/v3/user/quotes/${index}`);
        await this.loadQuotes();
        this.$root.$emit('reload-daily-quote');
      } catch (error) {
        console.error('Failed to delete quote:', error);
        alert('Failed to delete quote. Please try again.');
      }
    },
    cancelEdit () {
      this.editingIndex = null;
      this.newQuote = { text: '', author: '' };
    },
  },
};
</script>

<style lang="scss" scoped>
  @import '@/assets/scss/colors.scss';

  .manage-quotes-modal {
    padding: 16px;
  }

  .settings-section {
    h4 {
      font-size: 18px;
      margin-bottom: 4px;
      color: $gray-50;
    }

    p {
      font-size: 14px;
    }
  }

  .add-quote-section {
    h5 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: $gray-50;
    }

    textarea.form-control {
      resize: vertical;
    }
  }

  .quotes-list-section {
    h5 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: $gray-50;
    }
  }

  .quotes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .quote-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: $gray-700;
    border-radius: 6px;
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &:hover {
      background-color: $gray-600;
    }

    &.editing {
      border-color: $purple-300;
      background-color: $purple-50;
    }
  }

  .quote-item-content {
    flex: 1;
    min-width: 0;
    margin-right: 16px;
  }

  .quote-item-text {
    font-size: 14px;
    font-style: italic;
    color: $gray-50;
    margin-bottom: 4px;
    word-wrap: break-word;
  }

  .quote-item-author {
    font-size: 12px;
    color: $gray-200;
    margin-bottom: 0;
    font-weight: 500;
  }

  .quote-item-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .empty-state {
    padding: 32px 16px;
    text-align: center;

    p {
      font-size: 16px;
      margin: 0;
    }
  }

  hr {
    border-color: $gray-500;
    margin: 24px 0;
  }

  .d-flex.gap-2 {
    gap: 8px;
  }

  @media (max-width: 768px) {
    .quote-item {
      flex-direction: column;
      align-items: stretch;
    }

    .quote-item-content {
      margin-right: 0;
      margin-bottom: 12px;
    }

    .quote-item-actions {
      flex-direction: column;

      button {
        width: 100%;
      }
    }
  }
</style>
