<template>
  <div
    v-if="quote"
    class="quote-of-the-day"
  >
    <div class="quote-container">
      <div class="quote-icon">
        <div
          class="svg-icon"
          v-html="icons.quote"
        ></div>
      </div>
      <div class="quote-content">
        <p class="quote-text">
          "{{ quote.text }}"
        </p>
        <p
          v-if="quote.author"
          class="quote-author"
        >
          — {{ quote.author }}
        </p>
        <span
          v-if="isCustom"
          class="custom-badge"
        >{{
          $t("customQuote")
        }}</span>
      </div>
      <button
        class="btn btn-sm btn-secondary manage-quotes-btn"
        @click="openManageQuotes"
      >
        {{ $t("manageQuotes") }}
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import quoteIcon from '@/assets/svg/quote.svg?raw';

export default {
  name: 'QuoteOfTheDay',
  data () {
    return {
      quote: null,
      isCustom: false,
      loading: false,
      icons: Object.freeze({
        quote: quoteIcon,
      }),
    };
  },
  async mounted () {
    await this.fetchDailyQuote();
  },
  methods: {
    async fetchDailyQuote () {
      try {
        this.loading = true;
        const response = await axios.get('/api/v3/user/quotes/daily');
        if (response.data && response.data.data) {
          this.quote = response.data.data.quote;
          this.isCustom = response.data.data.isCustom;
        }
      } catch (error) {
        // Silently fail - quote is optional UI element
        console.error('Failed to fetch daily quote:', error);
      } finally {
        this.loading = false;
      }
    },
    openManageQuotes () {
      this.$root.$emit('bv::show::modal', 'manage-quotes-modal');
    },
  },
};
</script>

<style lang="scss" scoped>
@import "@/assets/scss/colors.scss";

.quote-of-the-day {
  margin-bottom: 24px;
  padding: 16px 24px;
  background: linear-gradient(135deg, $purple-50 0%, $blue-10 100%);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quote-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.quote-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  color: $purple-300;
  opacity: 0.6;

  .svg-icon {
    width: 100%;
    height: 100%;
    color: white;
  }
}

.quote-content {
  flex: 1;
  min-width: 0;
}

.quote-text {
  font-size: 16px;
  font-style: italic;
  color: $white;
  margin-bottom: 4px;
  line-height: 1.5;
  font-weight: 500;
}

.quote-author {
  font-size: 14px;
  color: $white;
  margin-bottom: 0;
  font-weight: 600;
}

.custom-badge {
  display: inline-block;
  padding: 2px 8px;
  background-color: $purple-300;
  color: $white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 4px;
}

.manage-quotes-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .quote-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .quote-icon {
    display: none;
  }

  .manage-quotes-btn {
    align-self: stretch;
    width: 100%;
  }
}
</style>
