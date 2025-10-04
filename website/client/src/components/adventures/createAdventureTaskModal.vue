<template>
  <b-modal
    id="create-adventure-task-modal"
    :title="isEditing ? 'Edit Task' : 'Create New Task'"
    size="lg"
    @hidden="resetForm"
  >
    <div
      v-if="!isOwner"
      class="alert alert-warning"
    >
      <strong>⚠️ View Only</strong> - Only the adventure owner can create or edit tasks.
    </div>

    <div class="task-form">
      <div class="form-group">
        <label for="task-title">
          Task Title <span class="text-danger">*</span>
        </label>
        <input
          id="task-title"
          v-model="form.title"
          type="text"
          class="form-control"
          placeholder="Enter task title..."
          maxlength="200"
          :disabled="!isOwner"
        >
      </div>

      <div class="form-group">
        <label for="task-description">Description</label>
        <textarea
          id="task-description"
          v-model="form.description"
          class="form-control"
          placeholder="Describe the task..."
          rows="4"
          maxlength="1000"
          :disabled="!isOwner"
        ></textarea>
      </div>

      <div class="row">
        <div class="col-md-4">
          <div class="form-group">
            <label for="task-type">
              Task Type <span class="text-danger">*</span>
            </label>
            <select
              id="task-type"
              v-model="form.type"
              class="form-control"
              :disabled="!isOwner"
            >
              <option value="todo">
                To-Do (One-time)
              </option>
              <option value="daily">
                Daily (Repeating)
              </option>
              <option value="habit">
                Habit (Flexible)
              </option>
            </select>
          </div>
        </div>

        <div class="col-md-4">
          <div class="form-group">
            <label for="task-story-points">
              Story Points <span class="text-danger">*</span>
            </label>
            <select
              id="task-story-points"
              v-model.number="form.storyPoints"
              class="form-control"
              :disabled="!isOwner"
            >
              <option
                v-for="points in storyPointsOptions"
                :key="points"
                :value="points"
              >
                {{ points }} {{ points === 1 ? 'point' : 'points' }}
              </option>
            </select>
            <small class="form-text text-muted">
              Fibonacci scale for effort estimation
            </small>
          </div>
        </div>

        <div class="col-md-4">
          <div class="form-group">
            <label for="task-priority">
              Priority <span class="text-danger">*</span>
            </label>
            <select
              id="task-priority"
              v-model="form.priority"
              class="form-control"
              :disabled="!isOwner"
            >
              <option value="low">
                Low
              </option>
              <option value="medium">
                Medium
              </option>
              <option value="high">
                High
              </option>
              <option value="critical">
                Critical
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="task-status">
              Status <span class="text-danger">*</span>
            </label>
            <select
              id="task-status"
              v-model="form.status"
              class="form-control"
              :disabled="!isOwner"
            >
              <option value="backlog">
                📥 Backlog
              </option>
              <option value="todo">
                📝 To Do
              </option>
              <option value="inProgress">
                🔥 In Progress
              </option>
              <option value="review">
                👀 Review
              </option>
              <option value="done">
                ✅ Done
              </option>
            </select>
          </div>
        </div>

        <div class="col-md-6">
          <div class="form-group">
            <label for="task-due-date">Due Date</label>
            <input
              id="task-due-date"
              v-model="form.dueDate"
              type="date"
              class="form-control"
              :disabled="!isOwner"
            >
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Tags</label>
        <div class="tags-input">
          <span
            v-for="(tag, index) in form.tags"
            :key="index"
            class="tag-badge"
          >
            {{ tag }}
            <button
              type="button"
              class="tag-remove"
              @click="removeTag(index)"
            >
              ×
            </button>
          </span>
          <input
            v-model="newTag"
            type="text"
            class="tag-input"
            placeholder="Add tag..."
            :disabled="!isOwner"
            @keydown.enter.prevent="addTag"
            @keydown.comma.prevent="addTag"
          >
        </div>
        <small class="form-text text-muted">
          Press Enter or comma to add tags
        </small>
      </div>

      <div class="reward-preview">
        <h5>Estimated Rewards</h5>
        <div class="rewards-display">
          <div class="reward-item">
            <span class="reward-icon">✨</span>
            <span class="reward-value">{{ calculatedXP }} XP</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">💰</span>
            <span class="reward-value">{{ calculatedGold }} Gold</span>
          </div>
        </div>
        <small class="text-muted">
          Based on {{ form.storyPoints }} story points × {{ priorityMultiplier }}x priority
        </small>
      </div>
    </div>

    <template #modal-footer>
      <button
        class="btn btn-secondary"
        @click="$bvModal.hide('create-adventure-task-modal')"
      >
        Cancel
      </button>
      <button
        v-if="isOwner"
        class="btn btn-primary"
        :disabled="!isFormValid || saving"
        @click="saveTask"
      >
        <span v-if="saving">Saving...</span>
        <span v-else>{{ isEditing ? 'Update Task' : 'Create Task' }}</span>
      </button>
    </template>
  </b-modal>
</template>

<script>
export default {
  name: 'CreateAdventureTaskModal',
  props: {
    adventureId: {
      type: String,
      required: true,
    },
    editTask: {
      type: Object,
      default: null,
    },
    isOwner: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      saving: false,
      newTag: '',
      form: {
        title: '',
        description: '',
        type: 'todo',
        storyPoints: 3,
        priority: 'medium',
        status: 'backlog',
        dueDate: '',
        tags: [],
      },
      storyPointsOptions: [1, 2, 3, 5, 8, 13],
    };
  },
  computed: {
    isEditing() {
      return !!this.editTask;
    },
    isFormValid() {
      return (
        this.form.title.trim().length > 0
        && this.form.type
        && this.form.storyPoints
        && this.form.priority
        && this.form.status
      );
    },
    priorityMultiplier() {
      const multipliers = {
        low: 0.8,
        medium: 1.0,
        high: 1.5,
        critical: 2.0,
      };
      return multipliers[this.form.priority] || 1.0;
    },
    calculatedXP() {
      const baseXP = 20;
      return Math.round(baseXP * this.form.storyPoints * this.priorityMultiplier);
    },
    calculatedGold() {
      const baseGold = 10;
      return Math.round(baseGold * this.form.storyPoints * this.priorityMultiplier);
    },
  },
  watch: {
    editTask: {
      immediate: true,
      handler(task) {
        if (task) {
          this.form = {
            title: task.title || '',
            description: task.description || '',
            type: task.type || 'todo',
            storyPoints: task.storyPoints || 3,
            priority: task.priority || 'medium',
            status: task.status || 'backlog',
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            tags: task.tags ? [...task.tags] : [],
          };
        }
      },
    },
  },
  methods: {
    addTag() {
      const tag = this.newTag.trim();
      if (tag && !this.form.tags.includes(tag)) {
        this.form.tags.push(tag);
        this.newTag = '';
      }
    },
    removeTag(index) {
      this.form.tags.splice(index, 1);
    },
    resetForm() {
      this.form = {
        title: '',
        description: '',
        type: 'todo',
        storyPoints: 3,
        priority: 'medium',
        status: 'backlog',
        dueDate: '',
        tags: [],
      };
      this.newTag = '';
      this.$emit('reset');
    },
    async saveTask() {
      if (!this.isFormValid) return;

      this.saving = true;
      try {
        const taskData = {
          ...this.form,
          dueDate: this.form.dueDate || undefined,
        };

        if (this.isEditing) {
          await this.$store.dispatch('adventures:updateAdventureTask', {
            adventureId: this.adventureId,
            taskId: this.editTask._id,
            updates: taskData,
          });
          this.$root.$emit('habitica::show-snackbar', {
            text: 'Task updated successfully',
            type: 'success',
          });
        } else {
          await this.$store.dispatch('adventures:createAdventureTask', {
            adventureId: this.adventureId,
            taskData,
          });
          this.$root.$emit('habitica::show-snackbar', {
            text: 'Task created successfully',
            type: 'success',
          });
        }

        this.$emit('saved');
        this.$bvModal.hide('create-adventure-task-modal');
      } catch (error) {
        console.error('Failed to save task:', error);
        this.$root.$emit('habitica::show-snackbar', {
          text: `Failed to ${this.isEditing ? 'update' : 'create'} task`,
          type: 'error',
        });
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/scss/colors.scss';

.task-form {
  .form-group {
    margin-bottom: 1.5rem;

    label {
      font-weight: 600;
      color: $gray-50;
      margin-bottom: 0.5rem;
      display: block;
    }
  }

  .form-control {
    border: 1px solid $gray-400;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;

    &:focus {
      border-color: $purple-300;
      box-shadow: 0 0 0 3px rgba(79, 42, 147, 0.1);
    }
  }

  textarea.form-control {
    resize: vertical;
  }
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
  border: 1px solid $gray-400;
  border-radius: 6px;
  min-height: 42px;

  &:focus-within {
    border-color: $purple-300;
    box-shadow: 0 0 0 3px rgba(79, 42, 147, 0.1);
  }
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: $purple-300;
  color: $white;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-remove {
  background: transparent;
  border: none;
  color: $white;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
  cursor: pointer;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }
}

.tag-input {
  flex: 1;
  border: none;
  outline: none;
  min-width: 120px;
  padding: 0.25rem;
  font-size: 0.875rem;
}

.reward-preview {
  margin-top: 2rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba($purple-300, 0.1), rgba($purple-400, 0.05));
  border-radius: 8px;
  border: 1px solid rgba($purple-300, 0.2);

  h5 {
    font-size: 1rem;
    font-weight: 700;
    color: $purple-300;
    margin-bottom: 1rem;
  }
}

.rewards-display {
  display: flex;
  gap: 2rem;
  margin-bottom: 0.5rem;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: $gray-50;

  .reward-icon {
    font-size: 1.5rem;
  }
}

.text-danger {
  color: $red-10;
}
</style>
