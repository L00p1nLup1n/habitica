<template>
  <div
    class="standard-page project-tasks-page"
    @click="openCreateBtn ? openCreateBtn = false : null"
  >
    <!-- Task Modal -->
    <task-modal
      v-if="workingTask._id || taskFormPurpose === 'create'"
      ref="taskModal"
      :task="workingTask"
      :purpose="taskFormPurpose"
      :project-id="projectId"
      @cancel="cancelTaskModal()"
      @taskCreated="loadTasks"
      @taskEdited="loadTasks"
      @taskDestroyed="taskDestroyed"
    />

    <!-- Header -->
    <div class="d-flex flex-wrap align-items-center mb-4">
      <div class="project-header-info">
        <router-link
          to="/adventures"
          class="back-link"
        >
          <div
            class="svg-icon icon-16"
            v-html="icons.back"
          ></div>
          Back to Adventures
        </router-link>
        <div class="d-flex align-items-center mt-2">
          <div class="project-emoji mr-2">
            {{ adventure.emoji }}
          </div>
          <div>
            <h1 class="project-name">
              {{ adventure.name }}
            </h1>
            <p
              v-if="adventure.description"
              class="project-description"
            >
              {{ adventure.description }}
            </p>
          </div>
        </div>
      </div>

      <div class="ml-auto d-flex align-items-center">
        <input
          v-model="searchText"
          class="form-control input-search mr-3"
          type="text"
          placeholder="Search tasks..."
        >

        <toggle-switch
          id="taskMirrorToggle"
          class="mr-3"
          label="Mirror Tasks"
          :checked="isMirroringAdventure"
          hover-text="Copy adventure tasks to your personal task list"
          @change="changeMirrorPreference"
        />

        <div class="create-task-area">
          <button
            v-if="canManageTasks"
            class="btn btn-primary create-btn d-flex align-items-center"
            :class="{open: openCreateBtn}"
            @click.stop.prevent="openCreateBtn = !openCreateBtn"
          >
            <div
              class="svg-icon icon-10 color"
              v-html="icons.positive"
            ></div>
            <div class="ml-75 mr-1">
              Add Task
            </div>
          </button>
          <div
            v-if="openCreateBtn"
            class="dropdown"
          >
            <div
              v-for="type in columns"
              :key="type"
              class="dropdown-item d-flex px-2 py-1"
              @click="createTask(type)"
            >
              <div class="d-flex align-items-center justify-content-center task-icon">
                <div
                  class="svg-icon m-auto"
                  :class="`icon-${type}`"
                  v-html="icons[type]"
                ></div>
              </div>
              <div class="task-label ml-2">
                {{ $t(type) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Stats -->
    <div class="project-stats-row row mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-icon">
            📊
          </div>
          <div class="stat-content">
            <div class="stat-label">
              Total Tasks
            </div>
            <div class="stat-value">
              {{ totalTasks }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-icon">
            ✅
          </div>
          <div class="stat-content">
            <div class="stat-label">
              Completed
            </div>
            <div class="stat-value text-success">
              {{ completedTasks }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-icon">
            🔥
          </div>
          <div class="stat-content">
            <div class="stat-label">
              In Progress
            </div>
            <div class="stat-value text-warning">
              {{ inProgressTasks }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-icon">
            👥
          </div>
          <div class="stat-content">
            <div class="stat-label">
              Members
            </div>
            <div class="stat-value">
              {{ adventure.members ? project.members.length : 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Columns -->
    <div class="row">
      <task-column
        v-for="column in columns"
        :key="column"
        class="col-12 col-md-3"
        :type="column"
        :task-list-override="tasksByType[column]"
        :adventure="adventure"
        :search-text="searchText"
        :draggable-override="canManageTasks"
        @editTask="editTask"
        @taskDestroyed="taskDestroyed"
      />
    </div>

    <!-- Members Section -->
    <div
      v-if="canManageTasks"
      class="members-section mt-5"
    >
      <h2>Project Members</h2>
      <div class="members-list">
        <div class="member-item owner">
          <div class="member-avatar">
            {{ memberInitialsmember in adventure.owner) }}
          </div>
          <div class="member-info">
            <div class="member-name">
              {{ adventure.owner.profile.name }}
            </div>
            <div class="member-role">
              Owner
            </div>
          </div>
        </div>
        <div
          v-for="member in adventure.members"
          :key="member._id"
          class="member-item"
        >
          <div class="member-avatar">
            {{ memberInitials(member) }}
          </div>
          <div class="member-info">
            <div class="member-name">
              {{ member.profile.name }}
            </div>
            <div class="member-role">
              {{ member.role || 'Member' }}
            </div>
          </div>
          <button
            v-if="canManageTasks"
            class="btn btn-sm btn-danger"
            @click="removeMember(member)"
          >
            Remove
          </button>
        </div>
      </div>
      <button
        class="btn btn-secondary mt-3"
        @click="showInviteModal"
      >
        Invite Member
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import '@/assets/scss/colors.scss';
  @import '@/assets/scss/create-task.scss';

  .project-tasks-page {
    padding: 2rem;
  }

  .back-link {
    display: flex;
    align-items: center;
    color: $gray-200;
    text-decoration: none;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;

    &:hover {
      color: $purple-300;
    }

    .svg-icon {
      margin-right: 0.5rem;
    }
  }

  .project-header-info {
    flex: 1;
  }

  .project-emoji {
    font-size: 2.5rem;
  }

  .project-name {
    color: $purple-300;
    margin-bottom: 0.25rem;
  }

  .project-description {
    color: $gray-200;
    font-size: 0.875rem;
    margin-bottom: 0;
  }

  .input-search {
    width: 300px;
  }

  .create-task-area {
    position: relative;

    .dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      background: $white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 200px;
      z-index: 1000;
    }
  }

  .positive {
    color: $green-500;
  }

  .project-stats-row {
    .stat-card {
      background: $white;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      font-size: 2rem;
      margin-right: 1rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: $gray-300;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 600;
      color: $gray-50;
    }
  }

  .members-section {
    background: $white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h2 {
      color: $purple-300;
      margin-bottom: 1.5rem;
    }
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .member-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: $gray-700;
    border-radius: 8px;

    &.owner {
      background: linear-gradient(135deg, $purple-400 0%, $purple-300 100%);
      color: $white;

      .member-name,
      .member-role {
        color: $white;
      }
    }
  }

  .member-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: $purple-300;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 600;
    margin-right: 1rem;
    border: 3px solid $white;
  }

  .member-info {
    flex: 1;
  }

  .member-name {
    font-weight: 600;
    color: $gray-50;
  }

  .member-role {
    font-size: 0.875rem;
    color: $gray-300;
    text-transform: uppercase;
    font-weight: 500;
  }

  #taskMirrorToggle {
    font-weight: bold;

    .svg-icon {
      margin: 3px 6px 0px 4px;
    }
  }
</style>

<script>
import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import findIndex from 'lodash/findIndex';
import taskDefaults from '@/../../common/script/libs/taskDefaults';
import TaskColumn from '../tasks/column';
import TaskModal from '../tasks/taskModal';
import toggleSwitch from '@/components/ui/toggleSwitch';
import sync from '../../mixins/sync';

import positiveIcon from '@/assets/svg/positive.svg?raw';
import backIcon from '@/assets/svg/navigation_back.svg?raw';
import habitIcon from '@/assets/svg/habit.svg?raw';
import dailyIcon from '@/assets/svg/daily.svg?raw';
import todoIcon from '@/assets/svg/todo.svg?raw';
import rewardIcon from '@/assets/svg/reward.svg?raw';

import * as Analytics from '@/libs/analytics';
import { mapState } from '@/libs/store';

export default {
  name: 'AdventureTasks',
  components: {
    TaskColumn,
    TaskModal,
    toggleSwitch,
  },
  mixins: [sync],
  props: ['adventureId'],
  data () {
    return {
      openCreateBtn: false,
      columns: ['habit', 'daily', 'todo', 'reward'],
      tasksByType: {
        habit: [],
        daily: [],
        todo: [],
        reward: [],
      },
      editingTask: {},
      creatingTask: {},
      workingTask: {},
      taskFormPurpose: 'create',
      searchText: '',
      icons: Object.freeze({
        positive: positiveIcon,
        back: backIcon,
        habit: habitIcon,
        daily: dailyIcon,
        todo: todoIcon,
        reward: rewardIcon,
      }),
      adventure: {
        _id: '',
        name: '',
        description: '',
        emoji: '📋',
        color: '#4f2a93',
        owner: { _id: '', profile: { name: '' } },
        members: [],
      },
    };
  },
  computed: {
    ...mapState({ user: 'user.data' }),
    canManageTasks () {
      if (!this.adventure || !this.adventure.owner) return false;
      return this.adventure.owner._id === this.user._id;
    },
    isMirroringAdventure () {
      // TODO: Implement adventure mirroring preference
      return false;
    },
    totalTasks () {
      return Object.values(this.tasksByType).reduce((sum, tasks) => sum + tasks.length, 0);
    },
    completedTasks () {
      return Object.values(this.tasksByType).reduce((sum, tasks) => sum + tasks.filter(t => t.completed).length, 0);
    },
    inProgressTasks () {
      // Count tasks that are assigned and started but not completed
      return Object.values(this.tasksByType).reduce((sum, tasks) => sum + tasks.filter(t => !t.completed && t.project && t.project.assignedUsers && t.project.assignedUsers.length > 0).length, 0);
    },
  },
  watch: {
    $route: 'load',
  },
  mounted () {
    this.load();
  },
  methods: {
    async load () {
      try {
        // TODO: Replace with actual API calls
        // this.adventure = await this.$store.dispatch('adventures:getAdventure', { adventureId: this.adventureId });

        // Mockup data
        this.adventure = {
          _id: this.adventureId,
          name: 'Website Redesign',
          description: 'Complete overhaul of the company website',
          emoji: '🎨',
          color: '#4f2a93',
          owner: {
            _id: this.user._id,
            profile: { name: this.user.profile.name },
          },
          members: [],
        };

        this.$store.dispatch('common:setTitle', {
          subSection: this.adventure.name,
          section: 'Adventures',
        });

        this.loadTasks();
      } catch (error) {
        console.error('Failed to load adventure:', error);
      }
    },
    async loadTasks () {
      this.tasksByType = {
        habit: [],
        daily: [],
        todo: [],
        reward: [],
      };

      try {
        // TODO: Replace with actual API call
        // const tasks = await this.$store.dispatch('tasks:getProjectTasks', {
        //   projectId: this.projectId,
        // });

        // Mockup data
        const tasks = [];

        tasks.forEach(task => {
          this.tasksByType[task.type].push(task);
        });
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    },
    editTask (task) {
      this.taskFormPurpose = 'edit';
      this.editingTask = cloneDeep(task);
      this.workingTask = this.editingTask;
      Vue.nextTick(() => {
        this.$root.$emit('bv::show::modal', 'task-modal');
      });
    },
    createTask (type) {
      this.openCreateBtn = false;
      this.taskFormPurpose = 'create';
      this.creatingTask = taskDefaults({ type, text: '' }, this.user);
      this.workingTask = this.creatingTask;
      Vue.nextTick(() => {
        this.$root.$emit('bv::show::modal', 'task-modal');
      });
    },
    taskDestroyed (task) {
      const index = findIndex(this.tasksByType[task.type], taskItem => taskItem._id === task._id);
      if (index !== -1) {
        this.tasksByType[task.type].splice(index, 1);
      }
    },
    cancelTaskModal () {
      this.editingTask = null;
      this.creatingTask = null;
      this.workingTask = {};
    },
    changeMirrorPreference (newVal) {
      Analytics.track({
        eventName: 'mirror tasks',
        eventAction: 'mirror tasks',
        eventCategory: 'behavior',
        hitType: 'event',
        mirror: newVal,
        project: this.adventure._id,
      }, { trackOnClient: true });

      // TODO: Implement project mirroring
      // const projectsToMirror = this.user.preferences.tasks.mirrorProjects || [];
      // if (newVal) {
      //   projectsToMirror.push(this.adventure._id);
      // } else {
      //   projectsToMirror.splice(projectsToMirror.indexOf(this.adventure._id), 1);
      // }
      // this.$store.dispatch('user:set', {
      //   'preferences.tasks.mirrorProjects': projectsToMirror,
      // });
    },
    memberInitials (member) {
      if (!member || !member.profile) return 'U';
      const name = member.profile.name || 'User';
      return name.split(' ').map(n => n[0]).join('').substring(0, 2)
        .toUpperCase();
    },
    showInviteModal () {
      // TODO: Implement invite modal
      alert('Invite feature coming soon!');
    },
    async removeMember (member) {
      if (confirm('Are you sure you want to remove this member from the project?')) {
        try {
          await this.$store.dispatch('adventures:kickMember', {
            adventureId: this.adventure._id,
            userId: member._id,
          });
          this.load();
        } catch (error) {
          console.error('Failed to remove member:', error);
        }
      }
    },
  },
};
</script>
