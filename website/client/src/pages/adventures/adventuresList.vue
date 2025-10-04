<template>
  <div class="standard-page projects-list-page">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="page-title">
          Adventures
        </h1>
        <p class="subtitle">
          Create your own adventures or join others using an invite code!
        </p>
      </div>
      <div class="header-actions">
        <button class="btn btn-success mr-2 d-flex align-items-center" style="margin-bottom: 8px ;"
          @click="showJoinAdventureModal">
          <div class="svg-icon icon-10" style="margin-right: 8px;" v-html="icons.positive"></div>
          <span>Join Adventure</span>
        </button>
        <button class="btn btn-primary d-flex align-items-center" @click="showCreateAdventureModal">
          <div class="svg-icon icon-10" style="margin-right: 8px;" v-html="icons.positive"></div>
          <span>Create Adventure</span>
        </button>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="row mb-4">
      <div class="col-md-6">
        <input v-model="searchText" class="form-control" type="text" placeholder="Search adventures...">
      </div>
      <div class="col-md-6 text-right">
        <div class="btn-group">
          <button class="btn btn-secondary" :class="{ active: filterStatus === 'all' }" @click="filterStatus = 'all'">
            {{ $t('all') }}
          </button>
          <button class="btn btn-secondary" :class="{ active: filterStatus === 'active' }"
            @click="filterStatus = 'active'">
            {{ $t('active') }}
          </button>
          <button class="btn btn-secondary" :class="{ active: filterStatus === 'archived' }"
            @click="filterStatus = 'archived'">
            Archived
          </button>
        </div>
      </div>
    </div>

    <!-- Adventures Grid -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-3">
        Loading adventures...
      </p>
    </div>

    <!-- Adventures List -->
    <template v-else>
      <div v-if="filteredAdventures.length === 0" class="empty-state text-center py-5">
        <div class="empty-icon mb-3">
          �️
        </div>
        <h3>No adventures yet</h3>
        <p class="text-muted">
          Create your first adventure or join one using an invite code!
        </p>
        <div class="mt-3">
          <button class="btn btn-primary d-flex align-items-center" style="margin: 0 auto;"
            @click="showCreateAdventureModal">
            <div class="svg-icon icon-10" style="margin-right: 8px;" v-html="icons.positive"></div>
            <span>Create Adventure</span>
          </button>
        </div>
      </div>

      <div v-else class="projects-grid row">
        <div v-for="adventure in filteredAdventures" :key="adventure._id" class="col-md-6 col-lg-4 mb-4">
          <adventure-card :adventure="adventure" :show-join-button="false" @click="openAdventure(adventure)"
            @edit="editAdventure(adventure)" @archive="archiveAdventure(adventure)" />
        </div>
      </div>
    </template>

    <!-- Create Adventure Modal -->
    <b-modal id="create-adventure-modal" :title="editingAdventure ? 'Edit Adventure' : 'Create New Adventure'" size="lg"
      @hidden="resetForm">
      <div class="form-group">
        <label>Adventure Name</label>
        <input v-model="adventureForm.name" class="form-control" type="text" placeholder="Enter adventure name">
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea v-model="adventureForm.description" class="form-control" rows="3"
          placeholder="Describe your adventure and what you hope to achieve"></textarea>
      </div>

      <div class="form-group">
        <label>Color Theme</label>
        <div class="color-picker">
          <button v-for="color in availableColors" :key="color" class="color-btn"
            :class="{ active: adventureForm.color === color }" :style="{ backgroundColor: color }"
            @click="adventureForm.color = color"></button>
        </div>
      </div>

      <template #modal-footer>
        <button class="btn btn-secondary" @click="$bvModal.hide('create-adventure-modal')">
          {{ $t('cancel') }}
        </button>
        <button class="btn btn-primary" @click="saveAdventure">
          {{ editingAdventure ? 'Save Changes' : 'Create Adventure' }}
        </button>
      </template>
    </b-modal>

    <!-- Join Adventure Modal -->
    <b-modal id="join-adventure-modal" title="Join Adventure by Code" @hidden="resetJoinForm">
      <p class="text-muted mb-3">
        Enter the adventure code shared by the adventure owner to join.
      </p>
      <div class="form-group">
        <label>Adventure Code</label>
        <input v-model="joinAdventureCode" class="form-control" type="text"
          placeholder="Enter 6-digit code (e.g., ABC123)" maxlength="6" style="text-transform: uppercase;">
      </div>
      <div v-if="joinError" class="alert alert-danger">
        {{ joinError }}
      </div>

      <template #modal-footer>
        <button class="btn btn-secondary" @click="$bvModal.hide('join-adventure-modal')">
          {{ $t('cancel') }}
        </button>
        <button class="btn btn-success" :disabled="!joinAdventureCode || joinAdventureCode.length < 6"
          @click="submitJoinAdventure">
          Join Adventure
        </button>
      </template>
    </b-modal>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/colors.scss';

.projects-list-page {
  padding: 2rem;
}

.page-title {
  color: $purple-300;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: $gray-200;
  margin-bottom: 0;
}

.projects-grid {
  margin-top: 1rem;
}

.empty-state {
  background: $white;
  border-radius: 8px;
  padding: 3rem;

  .empty-icon {
    font-size: 4rem;
    opacity: 0.5;
  }
}

.color-picker {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-btn {
  width: 40px;
  height: 40px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: $purple-300;
    box-shadow: 0 0 0 2px rgba($purple-300, 0.2);
  }
}
</style>

<script>
import AdventureCard from './adventureCard';
import positiveIcon from '@/assets/svg/positive.svg?raw';

export default {
  name: 'AdventuresList',
  components: {
    AdventureCard,
  },
  data() {
    return {
      loading: false,
      searchText: '',
      filterStatus: 'active',
      adventures: [],
      editingAdventure: null,
      joinAdventureCode: '',
      joinError: '',
      adventureForm: {
        name: '',
        description: '',
        color: '#4f2a93',
        isPublic: false,
      },
      availableColors: [
        '#4f2a93', // purple
        '#16a085', // teal
        '#e74c3c', // red
        '#f39c12', // orange
        '#3498db', // blue
        '#9b59b6', // violet
        '#e67e22', // carrot
        '#1abc9c', // turquoise
      ],
      icons: Object.freeze({
        positive: positiveIcon,
      }),
    };
  },
  computed: {
    filteredAdventures() {
      let filtered = this.adventures;

      // Filter by status
      if (this.filterStatus !== 'all') {
        filtered = filtered.filter(p => {
          if (this.filterStatus === 'active') return !p.archived;
          if (this.filterStatus === 'archived') return p.archived;
          return true;
        });
      }

      // Filter by search text
      if (this.searchText) {
        const search = this.searchText.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search)
          || (p.description && p.description.toLowerCase().includes(search)));
      }

      return filtered;
    },
  },
  mounted() {
    this.loadAdventures();
  },
  methods: {
    async loadAdventures() {
      this.loading = true;
      try {
        await this.$store.dispatch('adventures:fetchAll');
        this.adventures = this.$store.state.adventures.data || [];
      } catch (error) {
        console.error('Failed to load adventures:', error);
        this.$root.$emit('habitica:error', { message: 'Failed to load adventures' });
      } finally {
        this.loading = false;
      }
    },
    showJoinAdventureModal() {
      this.resetJoinForm();
      this.$bvModal.show('join-adventure-modal');
    },
    showCreateAdventureModal() {
      this.editingAdventure = null;
      this.resetForm();
      this.$bvModal.show('create-adventure-modal');
    },
    editAdventure(adventure) {
      this.editingAdventure = adventure;
      this.adventureForm = {
        name: adventure.name,
        description: adventure.description,
        color: adventure.color,
        isPublic: adventure.isPublic || false,
      };
      this.$bvModal.show('create-adventure-modal');
    },
    async saveAdventure() {
      try {
        if (this.editingAdventure) {
          await this.$store.dispatch('adventures:update', {
            adventureId: this.editingAdventure._id,
            updates: this.adventureForm,
          });
          this.adventures = this.$store.state.adventures.data || [];
        } else {
          await this.$store.dispatch('adventures:create', this.adventureForm);
          this.adventures = this.$store.state.adventures.data || [];
        }

        this.$bvModal.hide('create-adventure-modal');
      } catch (error) {
        console.error('Failed to save adventure:', error);
        this.$root.$emit('habitica:error', { message: 'Failed to save adventure' });
      }
    },
    resetForm() {
      this.adventureForm = {
        name: '',
        description: '',
        color: '#4f2a93',
        isPublic: false,
      };
      this.editingAdventure = null;
    },
    resetJoinForm() {
      this.joinAdventureCode = '';
      this.joinError = '';
    },
    async submitJoinAdventure() {
      this.joinError = '';

      if (!this.joinAdventureCode || this.joinAdventureCode.length !== 6) {
        this.joinError = 'Please enter a valid 6-character invite code';
        return;
      }

      try {
        await this.$store.dispatch('adventures:joinByCode', this.joinAdventureCode);
        this.adventures = this.$store.state.adventures.data || [];
        this.$bvModal.hide('join-adventure-modal');
        this.$root.$emit('habitica:success', { message: 'Successfully joined the adventure!' });
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.joinError = 'Invalid invite code. Please check and try again.';
        } else if (error.response && error.response.status === 400) {
          this.joinError = 'You are already a member of this adventure.';
        } else {
          this.joinError = 'Failed to join adventure. Please try again.';
        }
        console.error('Failed to join adventure:', error);
      }
    },

    openAdventure(adventure) {
      this.$router.push({ name: 'adventureDetails', params: { adventureId: adventure._id } });
    },
    async archiveAdventure(adventure) {
      if (confirm('Are you sure you want to archive this adventure?')) {
        try {
          await this.$store.dispatch('adventures:archive', adventure._id);
          this.adventures = this.$store.state.adventures.data || [];
          this.$root.$emit('habitica:success', { message: 'Adventure archived successfully' });
        } catch (error) {
          console.error('Failed to archive adventure:', error);
          this.$root.$emit('habitica:error', { message: 'Failed to archive adventure' });
        }
      }
    },
  },
};
</script>
