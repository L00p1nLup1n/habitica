<template>
  <div
    class="adventure-task-card"
    :class="[`priority-${task.priority}`, { synced: isSynced }]"
  >
    <div class="task-header">
      <div class="task-title-row">
        <h4 class="task-title">
          {{ task.title }}
        </h4>
        <div class="task-actions">
          <button
            v-if="!isSynced"
            class="btn btn-sm btn-sync"
            :disabled="syncing"
            @click="syncTask"
          >
            <div
              class="svg-icon icon-12"
              v-html="icons.sync"
            ></div>
          </button>
          <button
            v-else
            class="btn btn-sm btn-unsync"
            :disabled="syncing"
            @click="unsyncTask"
          >
            <div
              class="svg-icon icon-12"
              v-html="icons.check"
            ></div>
          </button>
          <button
            v-if="canEdit"
            class="btn btn-sm btn-edit"
            @click="$emit('edit', task)"
          >
            <div
              class="svg-icon icon-12"
              v-html="icons.edit"
            ></div>
          </button>
        </div>
      </div>
      <div class="task-meta">
        <span
          v-if="!canEdit"
          class="read-only-badge"
          title="Only the adventure owner can edit this task"
        >
          🔒 Read-only
        </span>
        <span
          class="story-points"
          :title="`Story Points: ${task.storyPoints}`"
        >
          <span class="points-icon">⭐</span>
          {{ task.storyPoints }}
        </span>
        <span
          class="priority-badge"
          :class="`priority-${task.priority}`"
        >
          {{ priorityLabel }}
        </span>
        <span
          v-if="task.type"
          class="task-type-badge"
        >
          {{ typeLabel }}
        </span>
      </div>
    </div>

    <p
      v-if="task.description"
      class="task-description"
    >
      {{ task.description }}
    </p>

    <div
      v-if="task.assignedTo && task.assignedTo.length > 0"
      class="task-assignees"
    >
      <div class="assignee-label">
        Assigned:
      </div>
      <div class="assignee-avatars">
        <div
          v-for="assignee in task.assignedTo"
          :key="assignee._id"
          class="assignee-avatar"
          :title="assignee.name"
        >
          {{ getInitials(assignee.name) }}
        </div>
      </div>
    </div>

    <div class="task-footer">
      <div class="task-rewards">
        <span
          class="reward-item"
          :title="`XP Reward: ${task.rewards.xp}`"
        >
          <span class="reward-icon">✨</span>
          {{ task.rewards.xp }} XP
        </span>
        <span
          class="reward-item"
          :title="`Gold Reward: ${task.rewards.gold}`"
        >
          <span class="reward-icon">💰</span>
          {{ task.rewards.gold }} Gold
        </span>
      </div>
      <div
        v-if="task.dueDate"
        class="task-due-date"
        :class="{ overdue: isOverdue }"
      >
        📅 {{ formattedDueDate }}
      </div>
    </div>
  </div>
</template>

<script>
import syncIcon from '@/assets/svg/sync.svg?raw';
import checkIcon from '@/assets/svg/check.svg?raw';
import editIcon from '@/assets/svg/edit.svg?raw';
import { mapState } from '@/libs/store';

export default {
  name: 'AdventureTaskCard',
  props: {
    task: {
      type: Object,
      required: true,
    },
    adventureId: {
      type: String,
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      syncing: false,
      icons: Object.freeze({
        sync: syncIcon,
        check: checkIcon,
        edit: editIcon,
      }),
    };
  },
  computed: {
    ...mapState({ user: 'user.data' }),
    isSynced() {
      if (!this.task.syncedHabiticaTasks) return false;
      return this.task.syncedHabiticaTasks.some(
        sync => sync.userId === this.user._id,
      );
    },
    priorityLabel() {
      const labels = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical',
      };
      return labels[this.task.priority] || 'Medium';
    },
    typeLabel() {
      const labels = {
        todo: 'To-Do',
        daily: 'Daily',
        habit: 'Habit',
      };
      return labels[this.task.type] || '';
    },
    formattedDueDate() {
      if (!this.task.dueDate) return '';
      const date = new Date(this.task.dueDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    },
    isOverdue() {
      if (!this.task.dueDate) return false;
      return new Date(this.task.dueDate) < new Date();
    },
  },
  methods: {
    async syncTask() {
      this.syncing = true;
      try {
        await this.$store.dispatch('adventures:syncTaskToPersonal', {
          adventureId: this.adventureId,
          taskId: this.task._id,
        });
        this.$emit('synced', this.task);
        // Refresh task to get updated sync status
        this.$emit('refresh');
      } catch (error) {
        console.error('Failed to sync task:', error);
        this.$root.$emit('habitica::show-snackbar', {
          text: 'Failed to sync task to your board',
          type: 'error',
        });
      } finally {
        this.syncing = false;
      }
    },
    async unsyncTask() {
      this.syncing = true;
      try {
        await this.$store.dispatch('adventures:unsyncTaskFromPersonal', {
          adventureId: this.adventureId,
          taskId: this.task._id,
        });
        this.$emit('unsynced', this.task);
        // Refresh task to get updated sync status
        this.$emit('refresh');
      } catch (error) {
        console.error('Failed to unsync task:', error);
        this.$root.$emit('habitica::show-snackbar', {
          text: 'Failed to remove task from your board',
          type: 'error',
        });
      } finally {
        this.syncing = false;
      }
    },
    getInitials(name) {
      if (!name) return 'U';
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/scss/colors.scss';

.adventure-task-card {
  background: $white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid $gray-400;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &.priority-low {
    border-left-color: $gray-300;
  }

  &.priority-medium {
    border-left-color: $blue-10;
  }

  &.priority-high {
    border-left-color: $orange-10;
  }

  &.priority-critical {
    border-left-color: $red-10;
  }

  &.synced {
    background: linear-gradient(to right, rgba(79, 42, 147, 0.05), $white);
  }
}

.task-header {
  margin-bottom: 0.5rem;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.task-title {
  font-size: 1rem;
  font-weight: 600;
  color: $gray-50;
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.task-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.btn-sync,
.btn-unsync,
.btn-edit {
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: $gray-200;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: $gray-600;
    color: $purple-300;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-sync {
  &:hover:not(:disabled) {
    color: $blue-10;
  }
}

.btn-unsync {
  color: $green-10;
  
  &:hover:not(:disabled) {
    color: $green-50;
  }
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.read-only-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba($gray-300, 0.2);
  color: $gray-200;
  border: 1px solid rgba($gray-300, 0.3);
}

.story-points {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: $orange-10;
}

.points-icon {
  font-size: 1rem;
}

.priority-badge,
.task-type-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge {
  &.priority-low {
    background: $gray-500;
    color: $gray-200;
  }

  &.priority-medium {
    background: rgba($blue-10, 0.15);
    color: $blue-10;
  }

  &.priority-high {
    background: rgba($orange-10, 0.15);
    color: $orange-10;
  }

  &.priority-critical {
    background: rgba($red-10, 0.15);
    color: $red-10;
  }
}

.task-type-badge {
  background: $gray-600;
  color: $gray-200;
}

.task-description {
  font-size: 0.875rem;
  color: $gray-100;
  line-height: 1.5;
  margin: 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-assignees {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid $gray-600;
}

.assignee-label {
  font-size: 0.75rem;
  color: $gray-200;
  font-weight: 600;
}

.assignee-avatars {
  display: flex;
  gap: 0.25rem;
}

.assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: $purple-300;
  color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 600;
  border: 2px solid $white;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid $gray-600;
}

.task-rewards {
  display: flex;
  gap: 0.75rem;
}

.reward-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: $gray-200;
}

.reward-icon {
  font-size: 0.875rem;
}

.task-due-date {
  font-size: 0.75rem;
  color: $gray-200;
  font-weight: 500;

  &.overdue {
    color: $red-10;
    font-weight: 600;
  }
}
</style>
