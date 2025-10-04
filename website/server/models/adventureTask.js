import mongoose from 'mongoose';

const { Schema } = mongoose;

// Adventure Task Schema
// These tasks are created within adventures and can be synced to users' personal Habitica task boards
const adventureTaskSchema = new Schema(
  {
    // Basic task info
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },

    // Adventure association
    adventureId: {
      type: Schema.Types.ObjectId,
      ref: 'Adventure',
      required: true,
      index: true,
    },

    // Task type (maps to Habitica task types)
    type: {
      type: String,
      enum: ['todo', 'daily', 'habit'],
      default: 'todo',
      required: true,
    },

    // Story points / complexity (for scrumban workflow)
    storyPoints: {
      type: Number,
      default: 1,
      min: 1,
      max: 13, // Fibonacci: 1, 2, 3, 5, 8, 13
    },

    // Priority level
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },

    // Status in the kanban board
    status: {
      type: String,
      enum: ['backlog', 'todo', 'inProgress', 'review', 'done'],
      default: 'backlog',
      index: true,
    },

    // Assignment
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'adventureCharacter',
      default: null,
    },

    // Due date (optional)
    dueDate: {
      type: Date,
      default: null,
    },

    // Rewards
    rewards: {
      xp: {
        type: Number,
        default: 0,
      },
      gold: {
        type: Number,
        default: 0,
      },
      gear: {
        type: String,
        default: null, // Gear key if applicable
      },
    },

    // Sync with personal Habitica tasks
    // Maps adventureTask -> user's personal Habitica task
    syncedHabiticaTasks: [
      {
        userId: {
          type: String, // Habitica user UUID
          required: true,
        },
        taskId: {
          type: String, // Habitica task UUID
          required: true,
        },
        characterId: {
          type: Schema.Types.ObjectId,
          ref: 'adventureCharacter',
          required: true,
        },
        syncedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Dependencies (blocked by other tasks)
    blockedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'AdventureTask',
      },
    ],

    // Tags for filtering
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Checklist items (for complex tasks)
    checklist: [
      {
        text: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Completion tracking
    completedBy: [
      {
        characterId: {
          type: Schema.Types.ObjectId,
          ref: 'adventureCharacter',
        },
        completedAt: {
          type: Date,
        },
        xpAwarded: {
          type: Number,
        },
        goldAwarded: {
          type: Number,
        },
      },
    ],

    // Timestamps
    createdBy: {
      type: String, // User UUID
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    // Soft delete
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
adventureTaskSchema.index({ adventureId: 1, status: 1 });
adventureTaskSchema.index({ adventureId: 1, assignedTo: 1 });
adventureTaskSchema.index({ 'syncedHabiticaTasks.userId': 1 });

// Virtual for checking if task is blocked
adventureTaskSchema.virtual('isBlocked').get(function () {
  return this.blockedBy && this.blockedBy.length > 0;
});

// Method to calculate XP reward based on story points
adventureTaskSchema.methods.calculateRewards = function () {
  const baseXP = 10;
  const baseGold = 5;

  // Story points multiplier
  const pointsMultiplier = this.storyPoints || 1;

  // Priority multiplier
  const priorityMultipliers = {
    low: 0.8,
    medium: 1.0,
    high: 1.5,
    critical: 2.0,
  };

  const priorityMultiplier = priorityMultipliers[this.priority] || 1.0;

  // Calculate rewards
  this.rewards.xp = Math.round(baseXP * pointsMultiplier * priorityMultiplier);
  this.rewards.gold = Math.round(
    baseGold * pointsMultiplier * priorityMultiplier,
  );

  return this.rewards;
};

// Method to check if user has synced this task
adventureTaskSchema.methods.isSyncedForUser = function (userId) {
  return this.syncedHabiticaTasks.some(sync => sync.userId === userId);
};

// Method to get synced task ID for user
adventureTaskSchema.methods.getSyncedTaskId = function (userId) {
  const sync = this.syncedHabiticaTasks.find(s => s.userId === userId);
  return sync ? sync.taskId : null;
};

// Pre-save hook to update rewards
adventureTaskSchema.pre('save', function (next) {
  if (this.isModified('storyPoints') || this.isModified('priority')) {
    this.calculateRewards();
  }
  next();
});

export const model = mongoose.model('AdventureTask', adventureTaskSchema);

export default model;
