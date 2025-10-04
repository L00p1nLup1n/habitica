<template>
  <div class="adventure-task-board">
    <div class="board-header">
      <div class="board-header-content">
        <h2 class="board-title">
          📋 Task Board
        </h2>
        <span
          v-if="!canManageTasks"
          class="permission-badge view-only"
          title="Only the adventure owner can create and edit tasks"
        >
          👁️ View Only
        </span>
      </div>
      <div class="board-actions">
        <button
          v-if="canManageTasks"
          class="btn btn-primary"
          @click="$emit('create-task')"
        >
          <div
            class="svg-icon icon-10"
            v-html="icons.plus"
          ></div>
          <span class="ml-2">Add Task</span>
        </button>
      </div>
    </div>

    <div class="board-stats">
      <div class="stat-item">
        <span class="stat-label">Total Tasks:</span>
        <span class="stat-value">{{ totalTasks }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Story Points:</span>
        <span class="stat-value">{{ totalStoryPoints }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Completed:</span>
        <span class="stat-value text-success">{{ completedTasks }}</span>
      </div>
    </div>

    <div
      v-if="loading"
      class="board-loading"
    >
      <div class="loading-spinner"></div>
      <p>Loading tasks...</p>
    </div>

    <div
      v-else
      class="board-columns"
    >
      <div
        v-for="column in columns"
        :key="column.key"
        class="board-column"
        :class="`column-${column.key}`"
      >
        <div class="column-header">
          <h3 class="column-title">
            <span class="column-icon">{{ column.icon }}</span>
            {{ column.label }}
          </h3>
          <span class="column-count">{{ getColumnTasks(column.key).length }}</span>
        </div>

        <div
          class="column-content"
          @drop="onDrop($event, column.key)"
          @dragover.prevent
          @dragenter.prevent
        >
          <adventure-task-card
            v-for="task in getColumnTasks(column.key)"
            :key="task._id"
            :task="task"
            :adventure-id="adventureId"
            :can-edit="canManageTasks"
            :draggable="canManageTasks"
            @dragstart="onDragStart($event, task)"
            @edit="$emit('edit-task', task)"
            @synced="$emit('task-synced', task)"
            @unsynced="$emit('task-unsynced', task)"
            @refresh="$emit('refresh')"
          />

          <div
            v-if="getColumnTasks(column.key).length === 0"
            class="column-empty"
          >
            <p>{{ column.emptyText }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AdventureTaskCard from './adventureTaskCard.vue';
import plusIcon from '@/assets/svg/positive.svg?raw';
import { mapState } from '@/libs/store';

export default {
  name: 'AdventureTaskBoard',
  components: {
    AdventureTaskCard,
  },
  props: {
    adventureId: {
      type: String,
      required: true,
    },
    tasks: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    canManageTasks: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      draggedTask: null,
      icons: Object.freeze({
        plus: plusIcon,
      }),
      columns: [
        {
          key: 'backlog',
          label: 'Backlog',
          icon: '📥',
          emptyText: 'No tasks in backlog',
        },
        {
          key: 'todo',
          label: 'To Do',
          icon: '📝',
          emptyText: 'No tasks to do',
        },
        {
          key: 'inProgress',
          label: 'In Progress',
          icon: '🔥',
          emptyText: 'No tasks in progress',
        },
        {
          key: 'review',
          label: 'Review',
          icon: '👀',
          emptyText: 'No tasks in review',
        },
        {
          key: 'done',
          label: 'Done',
          icon: '✅',
          emptyText: 'No completed tasks',
        },
      ],
    };
  },
  computed: {
    ...mapState({ user: 'user.data' }),
    totalTasks() {
      return this.tasks.length;
    },
    totalStoryPoints() {
      return this.tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    },
    completedTasks() {
      return this.tasks.filter(task => task.status === 'done').length;
    },
  },
  methods: {
    getColumnTasks(status) {
      return this.tasks.filter(task => task.status === status);
    },
    onDragStart(event, task) {
      if (!this.canManageTasks) return;
      this.draggedTask = task;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task._id);
    },
    async onDrop(event, newStatus) {
      if (!this.canManageTasks || !this.draggedTask) return;

      event.preventDefault();
      const task = this.draggedTask;

      if (task.status === newStatus) {
        this.draggedTask = null;
        return;
      }

      try {
        await this.$store.dispatch('adventures:updateAdventureTask', {
          adventureId: this.adventureId,
          taskId: task._id,
          updates: { status: newStatus },
        });

        // Update local task status
        task.status = newStatus;

        this.$root.$emit('habitica::show-snackbar', {
          text: `Task moved to ${this.columns.find(c => c.key === newStatus).label}`,
          type: 'success',
        });

        this.$emit('task-moved', { task, newStatus });
      } catch (error) {
        console.error('Failed to move task:', error);
        this.$root.$emit('habitica::show-snackbar', {
          text: 'Failed to move task',
          type: 'error',
        });
      } finally {
        this.draggedTask = null;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/scss/colors.scss';

.adventure-task-board {
  padding: 1.5rem;
  background: $gray-700;
  border-radius: 12px;
  min-height: 600px;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.board-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.board-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: $purple-300;
  margin: 0;
}

.permission-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  
  &.view-only {
    background: rgba($orange-10, 0.15);
    color: $orange-10;
    border: 1px solid rgba($orange-10, 0.3);
  }
}

.board-actions {
  display: flex;
  gap: 0.75rem;
}

.board-stats {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: $white;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.stat-label {
  font-size: 0.875rem;
  color: $gray-200;
  font-weight: 500;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: $gray-50;

  &.text-success {
    color: $green-10;
  }
}

.board-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: $gray-200;

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid $gray-500;
    border-top-color: $purple-300;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

.board-columns {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  min-height: 500px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.board-column {
  background: $white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 800px;

  &.column-backlog {
    .column-header {
      background: linear-gradient(135deg, rgba($gray-300, 0.2), rgba($gray-400, 0.1));
    }
  }

  &.column-todo {
    .column-header {
      background: linear-gradient(135deg, rgba($blue-10, 0.2), rgba($blue-50, 0.1));
    }
  }

  &.column-inProgress {
    .column-header {
      background: linear-gradient(135deg, rgba($orange-10, 0.2), rgba($orange-50, 0.1));
    }
  }

  &.column-review {
    .column-header {
      background: linear-gradient(135deg, rgba($purple-300, 0.2), rgba($purple-400, 0.1));
    }
  }

  &.column-done {
    .column-header {
      background: linear-gradient(135deg, rgba($green-10, 0.2), rgba($green-50, 0.1));
    }
  }
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 2px solid $gray-600;
  border-radius: 8px 8px 0 0;
}

.column-title {
  font-size: 1rem;
  font-weight: 700;
  color: $gray-50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.column-icon {
  font-size: 1.25rem;
}

.column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  background: $purple-300;
  color: $white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.column-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  min-height: 300px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: $gray-700;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: $gray-400;
    border-radius: 3px;

    &:hover {
      background: $gray-300;
    }
  }
}

.column-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;

  p {
    color: $gray-300;
    font-size: 0.875rem;
    font-style: italic;
    margin: 0;
  }
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .svg-icon {
    width: 10px;
    height: 10px;
  }
}
</style>
