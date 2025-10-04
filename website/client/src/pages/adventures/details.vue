<template>
  <div class="adventure-details-page">
    <div
      v-if="loading"
      class="text-center py-5"
    >
      <div
        class="spinner-border"
        role="status"
      >
        <span class="sr-only">Loading...</span>
      </div>
    </div>

    <div
      v-else-if="adventure"
      class="container"
    >
      <!-- Header Section -->
      <div class="adventure-header mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <button
            class="btn btn-sm btn-secondary"
            @click="$router.push('/adventures')"
          >
            <span class="svg-icon">←</span> Back to Adventures
          </button>
          <b-dropdown
            v-if="isOwner"
            right
            variant="secondary"
            size="sm"
            text="Options"
          >
            <b-dropdown-item @click="editAdventure">
              Edit Adventure
            </b-dropdown-item>
            <b-dropdown-item
              class="text-warning"
              @click="archiveAdventure"
            >
              Archive Adventure
            </b-dropdown-item>
            <b-dropdown-divider />
            <b-dropdown-item
              class="text-danger"
              @click="deleteAdventurePermanently"
            >
              Delete Permanently
            </b-dropdown-item>
          </b-dropdown>
        </div>

        <div
          class="adventure-title-card"
          :style="{ borderLeftColor: adventure.color }"
        >
          <h1 class="mb-2">
            {{ adventure.name }}
          </h1>
          <p
            v-if="adventure.description"
            class="text-muted mb-3"
          >
            {{ adventure.description }}
          </p>
          <div class="d-flex align-items-center gap-3">
            <span
              class="badge"
              :style="{ backgroundColor: adventure.color, color: 'white' }"
            >
              {{ adventure.isPublic ? 'Public' : 'Private' }}
            </span>
            <span class="text-muted">
              Created by {{ adventure.owner?.profile?.name || 'Unknown' }}
            </span>
            <span class="text-muted">
              {{ adventure.members.length }} {{ adventure.members.length === 1 ? 'member' : 'members' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Invite Code Section -->
      <div
        v-if="isOwner || isMember"
        class="card mb-4"
      >
        <div class="card-body">
          <h5 class="card-title">
            Invite Code
          </h5>
          <p class="text-muted mb-2">
            Share this code with others to invite them to your adventure:
          </p>
          <div class="d-flex align-items-center gap-2">
            <code class="invite-code">{{ adventure.inviteCode }}</code>
            <button
              class="btn btn-sm btn-primary"
              @click="copyInviteCode"
            >
              Copy Code
            </button>
          </div>
        </div>
      </div>

      <!-- Tasks Section - Kanban Board -->
      <adventure-task-board
        :adventure-id="adventureId"
        :tasks="tasks"
        :loading="loadingTasks"
        :can-manage-tasks="isOwner"
        @create-task="openCreateTaskModal"
        @edit-task="openEditTaskModal"
        @task-synced="handleTaskSynced"
        @task-unsynced="handleTaskUnsynced"
        @task-moved="handleTaskMoved"
        @refresh="loadTasks"
      />

      <!-- Create/Edit Task Modal -->
      <create-adventure-task-modal
        :adventure-id="adventureId"
        :edit-task="editingTask"
        :is-owner="isOwner"
        @saved="handleTaskSaved"
        @reset="editingTask = null"
      />

      <!-- Members Section -->
      <div class="card">
        <div class="card-body">
          <h5 class="card-title mb-3">
            Members
          </h5>
          <div class="members-list">
            <div
              v-for="member in adventure.members"
              :key="getMemberId(member)"
              class="member-item d-flex align-items-center justify-content-between py-2"
            >
              <div class="d-flex align-items-center">
                <div class="avatar-placeholder mr-2">
                  {{ getMemberInitials(member) }}
                </div>
                <div>
                  <strong>{{ getMemberName(member) }}</strong>
                  <div class="text-muted small">
                    <span
                      v-if="isOwnerMember(member)"
                      class="badge badge-warning" style="color: white;"
                    >Owner</span>
                    <span
                      v-else
                      class="badge badge-info" style="color: white;"
                    >Member</span>
                  </div>
                </div>
              </div>
              <button
                v-if="isOwner && !isOwnerMember(member)"
                class="btn btn-sm btn-danger"
                @click="kickMember(getMemberId(member))"
              >
                Kick
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="container text-center py-5"
    >
      <h3>Adventure not found</h3>
      <button
        class="btn btn-primary mt-3"
        @click="$router.push('/adventures')"
      >
        Back to Adventures
      </button>
    </div>

    <!-- Character Creation Modal - Only for regular members (NOT owner) -->
    <!-- Modal is mandatory - cannot be closed until character is created -->
    <create-character
      v-if="showcreateCharacterModal && isMemberOnly"
      :adventure-id="adventureId"
      @character-created="handleCharacterCreated"
    />
  </div>
</template>

<script>
import CreateCharacter from './createCharacter.vue';
import AdventureTaskBoard from '@/components/adventures/adventureTaskBoard.vue';
import CreateAdventureTaskModal from '@/components/adventures/createAdventureTaskModal.vue';

export default {
  name: 'AdventureDetails',
  components: {
    CreateCharacter,
    AdventureTaskBoard,
    CreateAdventureTaskModal,
  },
  data () {
    return {
      adventure: null,
      tasks: [],
      loading: true,
      loadingTasks: false,
      showcreateCharacterModal: false,
      currentCharacter: null,
      editingTask: null,
    };
  },
  computed: {
    adventureId () {
      return this.$route.params.adventureId;
    },
    isOwner () {
      if (!this.adventure || !this.$store.state.user.data) return false;
      // adventure.owner can be either a string (ID) or an object with _id
      const ownerId = typeof this.adventure.owner === 'string'
        ? this.adventure.owner
        : this.adventure.owner._id;
      return ownerId === this.$store.state.user.data._id;
    },
    isMember () {
      if (!this.adventure || !this.$store.state.user.data) return false;
      const userId = this.$store.state.user.data._id;
      return this.adventure.members.some(member => this.getMemberId(member) === userId);
    },
    isMemberOnly () {
      // Member but NOT owner - only these users can create characters
      return this.isMember && !this.isOwner;
    },
  },
  async mounted () {
    await this.loadAdventure();

    if (this.adventure) {
      console.log('Loading adventure characters for:', this.adventureId);
      const characters = await this.$store.dispatch('adventures:getAdventureCharacters', this.adventureId);
      console.log('Characters loaded:', characters);
      this.$store.state.currentAdventure = this.adventure;
      console.log('currentAdventure set:', this.$store.state.currentAdventure);
      console.log('adventureCharacters in store:', this.$store.state.adventureCharacters);
    }

    await this.checkCharacterStatus();
    await this.loadTasks();
  },

  beforeDestroy() {
    // Clear adventure context before leaving
    this.$store.state.currentAdventure = null;
    this.$store.state.adventureCharacters = [];
  },

  methods: {
    getMemberId (member) {
      // Handle both string IDs and populated objects
      return typeof member === 'string' ? member : member._id;
    },
    getMemberName (member) {
      // Handle both string IDs and populated objects
      if (typeof member === 'string') {
        return `User ${member.substring(0, 8)}`;
      }
      return member.profile?.name || 'Unknown User';
    },
    getMemberInitials (member) {
      const name = this.getMemberName(member);
      return name.split(' ').map(n => n[0]).join('').substring(0, 2)
        .toUpperCase();
    },
    isOwnerMember (member) {
      if (!this.adventure) return false;
      const ownerId = typeof this.adventure.owner === 'string'
        ? this.adventure.owner
        : this.adventure.owner._id;
      const memberId = this.getMemberId(member);
      return memberId === ownerId;
    },
    async loadAdventure () {
      this.loading = true;
      try {
        this.adventure = await this.$store.dispatch('adventures:getDetails', this.adventureId);
        console.log('Adventure loaded:', this.adventure);
        console.log('Members array:', this.adventure.members);
        if (this.adventure.members.length > 0) {
          console.log('First member:', this.adventure.members[0]);
          console.log('First member type:', typeof this.adventure.members[0]);
        }
      } catch (error) {
        console.error('Failed to load adventure:', error);
        this.$root.$emit('habitica:error', { message: 'Failed to load adventure details' });
      } finally {
        this.loading = false;
      }
    },
    async loadTasks () {
      this.loadingTasks = true;
      try {
        this.tasks = await this.$store.dispatch('adventures:getAdventureTasks', {
          adventureId: this.adventureId,
        });
      } catch (error) {
        console.error('Failed to load tasks:', error);
        this.tasks = [];
      } finally {
        this.loadingTasks = false;
      }
    },
    copyInviteCode () {
      navigator.clipboard.writeText(this.adventure.inviteCode);
      this.$root.$emit('habitica:success', { message: 'Invite code copied to clipboard!' });
    },
    editAdventure () {
      // Navigate back to list with edit mode
      this.$router.push('/adventures');
      // Emit event to open edit modal (you may need to implement this)
      this.$root.$emit('adventure:edit', this.adventure);
    },
    openCreateTaskModal () {
      this.editingTask = null;
      this.$root.$emit('bv::show::modal', 'create-adventure-task-modal');
    },
    openEditTaskModal (task) {
      this.editingTask = task;
      this.$root.$emit('bv::show::modal', 'create-adventure-task-modal');
    },
    handleTaskSaved () {
      this.loadTasks();
      this.editingTask = null;
    },
    handleTaskSynced (task) {
      console.log('Task synced to personal board:', task);
      this.$root.$emit('habitica:success', {
        message: 'Task synced to your personal board!',
      });
    },
    handleTaskUnsynced (task) {
      console.log('Task unsynced from personal board:', task);
      this.$root.$emit('habitica:success', {
        message: 'Task removed from your personal board',
      });
    },
    handleTaskMoved ({ task, newStatus }) {
      console.log('Task moved:', task, 'to', newStatus);
    },
    async archiveAdventure () {
      if (!confirm('Are you sure you want to archive this adventure?')) return;

      try {
        await this.$store.dispatch('adventures:archive', this.adventureId);
        this.$root.$emit('habitica:success', { message: 'Adventure archived successfully' });
        this.$router.push('/adventures');
      } catch (error) {
        console.error('Failed to archive adventure:', error);
        this.$root.$emit('habitica:error', { message: 'Failed to archive adventure' });
      }
    },
    async kickMember (userId) {
      if (!confirm('Are you sure you want to kick this member from the adventure?')) return;

      try {
        await this.$store.dispatch('adventures:kickMember', {
          adventureId: this.adventureId,
          userId,
        });

        // Remove the member from the local adventure object
        this.adventure.members = this.adventure.members.filter(
          memberId => memberId !== userId,
        );

        this.$root.$emit('habitica:success', { message: 'Member kicked successfully' });
      } catch (error) {
        console.error('Failed to kick member:', error);
        const message = error.response?.data?.message || 'Failed to kick member';
        this.$root.$emit('habitica:error', { message });
      }
    },
    async deleteAdventurePermanently () {
      const warningMessage = 'Are you sure you want to PERMANENTLY DELETE this adventure? '
        + 'This action cannot be undone and will remove all adventure data, '
        + 'tasks, and member associations.';
      const confirmed = confirm(warningMessage);
      if (!confirmed) return;

      // Double confirmation for safety
      const finalWarning = 'FINAL WARNING: This will permanently delete the adventure. '
        + 'Type YES to confirm or cancel.';
      const doubleConfirm = confirm(finalWarning);
      if (!doubleConfirm) return;

      try {
        await this.$store.dispatch('adventures:deleteAdventure', this.adventureId);
        this.$root.$emit('habitica:success', {
          message: 'Adventure permanently deleted',
        });
        this.$router.push('/adventures');
      } catch (error) {
        console.error('Failed to delete adventure:', error);
        const message = error.response?.data?.message || 'Failed to delete adventure';
        this.$root.$emit('habitica:error', { message });
      }
    },

    async checkCharacterStatus () {
      // Only check character status if user is a regular member (NOT owner)
      if (!this.isMemberOnly) {
        return;
      }

      try {
        const character = await this.$store.dispatch('adventures:getCharacter', this.adventureId);
        
        if (!character) {
         this.showcreateCharacterModal = true;
        } else {
          this.currentCharacter = character;
        }
      } catch (error) {
        console.error('Failed to check character status:', error);
      }
    },

    handleCharacterCreated (character) {
      this.currentCharacter = character;
      this.showcreateCharacterModal = false;
      this.$root.$emit('habitica:success', {
        message: 'Character created successfully!',
      });
    },
  },
};
</script>

<style scoped lang="scss">
.adventure-details-page {
  padding: 2rem 0;
}

.adventure-title-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  border-left: 4px solid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.invite-code {
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  letter-spacing: 2px;
}

.task-item:last-child {
  border-bottom: none !important;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4f2a93;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.gap-3 {
  gap: 1rem;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
