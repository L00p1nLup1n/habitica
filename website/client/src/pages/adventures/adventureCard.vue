<template>
  <div
    class="adventure-card"
    :style="{ borderLeftColor: adventure.color }"
    @click="$emit('click', adventure)"
  >
    <div class="adventure-header">
      <div class="adventure-title-section">
        <div class="d-flex align-items-center mb-2">
          <h3 class="adventure-title mb-0">
            {{ adventure.name }}
          </h3>
          <span
            v-if="userRole"
            class="badge ml-2"
            :class="userRole === 'Owner' ? 'badge-warning text-white' : 'badge-info text-white'"
          >
            {{ userRole }}
          </span>
        </div>
        <p
          v-if="adventure.description"
          class="adventure-description"
        >
          {{ adventure.description }}
        </p>
      </div>
      <div class="adventure-menu">
        <button
          v-if="showJoinButton"
          class="btn btn-sm btn-success join-btn"
          @click.stop="$emit('join', adventure)"
        >
          Join
        </button>
        <b-dropdown
          v-else
          right
          no-caret
          variant="link"
          @click.stop
        >
          <template #button-content>
            <div
              class="svg-icon icon-16"
              v-html="icons.dots"
            ></div>
          </template>
          <b-dropdown-item @click.stop="$emit('edit', adventure)">
            Edit
          </b-dropdown-item>
          <b-dropdown-item @click.stop="$emit('archive', adventure)">
            {{ adventure.archived ? 'Unarchive' : 'Archive' }}
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </div>

    <div class="adventure-stats">
      <div class="stat-item">
        <div class="stat-label">
          Total
        </div>
        <div class="stat-value">
          {{ adventure.taskCounts.total }}
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-label">
          Completed
        </div>
        <div class="stat-value text-success">
          {{ adventure.taskCounts.completed }}
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-label">
          In Progress
        </div>
        <div class="stat-value text-warning">
          {{ adventure.taskCounts.inProgress }}
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-label">
          To Do
        </div>
        <div class="stat-value text-info">
          {{ adventure.taskCounts.todo }}
        </div>
      </div>
    </div>

    <div class="adventure-progress">
      <div class="progress">
        <div
          class="progress-bar bg-success"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
      <span class="progress-text">{{ progressPercentage }}% Complete</span>
    </div>

    <div class="adventure-footer">
      <div class="adventure-members">
        <div
          v-if="showJoinButton && adventure.memberCount"
          class="member-count"
        >
          👥 {{ adventure.memberCount }} {{ adventure.memberCount === 1 ? 'member' : 'members' }}
        </div>
        <template v-else>
          <div
            v-for="member in displayedMembers"
            :key="member._id"
            class="member-avatar"
            :title="member.profile ? member.profile.name : 'Member'"
          >
            {{ memberInitials(member) }}
          </div>
          <div
            v-if="extraMembersCount > 0"
            class="member-avatar extra-count"
          >
            +{{ extraMembersCount }}
          </div>
        </template>
      </div>
      <div class="adventure-date">
        {{ formatDate(adventure.createdAt) }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import '@/assets/scss/colors.scss';

  .adventure-card {
    background: $white;
    border-radius: 8px;
    border-left: 4px solid;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  .adventure-header {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .adventure-title-section {
    flex: 1;
    min-width: 0;
  }

  .adventure-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: $gray-50;
    margin-bottom: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .adventure-description {
    font-size: 0.875rem;
    color: $gray-200;
    margin-bottom: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .adventure-menu {
    flex-shrink: 0;
    margin-left: 0.5rem;

    .svg-icon {
      color: $gray-300;
    }

    .join-btn {
      font-weight: 600;
      padding: 0.375rem 1rem;
      border-radius: 20px;
      transition: all 0.2s;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
      }
    }
  }

  .adventure-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: $gray-700;
    border-radius: 6px;
  }

  .stat-item {
    text-align: center;
  }

  .stat-label {
    font-size: 0.75rem;
    color: $gray-200;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: $gray-50;
  }

  .adventure-progress {
    margin-bottom: 1rem;

    .progress {
      height: 8px;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .progress-text {
      font-size: 0.75rem;
      color: $gray-200;
    }
  }

  .adventure-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .adventure-members {
    display: flex;
    gap: 0.25rem;
  }

  .member-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $purple-300;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    border: 2px solid $white;

    &.extra-count {
      background: $gray-400;
      font-size: 0.625rem;
    }
  }

  .member-count {
    font-size: 0.875rem;
    color: $gray-200;
    font-weight: 500;
  }

  .adventure-date {
    font-size: 0.75rem;
    color: $gray-300;
  }
</style>

<script>
import dotsIcon from '@/assets/svg/dots.svg?raw';

export default {
  name: 'AdventureCard',
  props: {
    adventure: {
      type: Object,
      required: true,
    },
    showJoinButton: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      icons: Object.freeze({
        dots: dotsIcon,
      }),
    };
  },
  computed: {
    progressPercentage () {
      const { total, completed } = this.adventure.taskCounts;
      if (total === 0) return 0;
      return Math.round((completed / total) * 100);
    },
    displayedMembers () {
      return this.adventure.members.slice(0, 3);
    },
    extraMembersCount () {
      const extra = this.adventure.members.length - 3;
      return extra > 0 ? extra : 0;
    },
    userRole () {
      // Determine if current user is owner or member
      if (!this.$store.state.user.data) return null;

      const userId = this.$store.state.user.data._id;
      const ownerId = typeof this.adventure.owner === 'string'
        ? this.adventure.owner
        : this.adventure.owner?._id;

      if (ownerId === userId) {
        return 'Owner';
      }

      // Check if user is in members array
      const isMember = this.adventure.members.some(member => {
        const memberId = typeof member === 'string' ? member : member._id;
        return memberId === userId;
      });

      return isMember ? 'Member' : null;
    },
  },
  methods: {
    memberInitials (member) {
      // Handle both string IDs and populated objects
      if (typeof member === 'string') {
        return member.substring(0, 2).toUpperCase();
      }
      if (!member || !member.profile) return 'U';
      const name = member.profile.name || 'User';
      return name.split(' ').map(n => n[0]).join('').substring(0, 2)
        .toUpperCase();
    },
    formatDate (date) {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
  },
};
</script>
