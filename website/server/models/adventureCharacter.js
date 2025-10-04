import mongoose from 'mongoose';

const { Schema } = mongoose;

// Project-specific character schema
// Each character is tied to a specific project and user
// Characters are created when joining a project and lost when project ends
const projectCharacterSchema = new Schema(
  {
    // Reference to the user who owns this character
    // Note: Habitica uses UUID strings for user IDs, not ObjectIds
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },

    // Reference to the project this character belongs to
    adventureId: {
      type: Schema.Types.ObjectId,
      ref: 'Adventure',
      required: true,
      index: true,
    },

    // Character details
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // Character class (warrior, mage, rogue, healer)
    class: {
      type: String,
      enum: ['warrior', 'mage', 'rogue', 'healer'],
      required: true,
    },

    // Character level (starts at 1)
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },

    // Character stats
    stats: {
      // Health Points
      hp: {
        type: Number,
        default: 50,
        min: 0,
      },
      maxHp: {
        type: Number,
        default: 50,
      },

      // Mana Points (for abilities)
      mp: {
        type: Number,
        default: 30,
        min: 0,
      },
      maxMp: {
        type: Number,
        default: 30,
      },

      // Experience Points
      exp: {
        type: Number,
        default: 0,
        min: 0,
      },
      toNextLevel: {
        type: Number,
        default: 100, // XP needed for next level
      },

      // Gold
      gp: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Core attributes (start at 10)
      str: { type: Number, default: 10 }, // Strength - increases damage/boss damage
      int: { type: Number, default: 10 }, // Intelligence - increases XP gain
      per: { type: Number, default: 10 }, // Perception - increases gold/crit chance
      con: { type: Number, default: 10 }, // Constitution - reduces damage taken
    },

    // Available stat points to allocate (gained on level up)
    availableStatPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Equipment (starting gear and items earned in project)
    equipment: {
      weapon: { type: String, default: null },
      armor: { type: String, default: null },
      head: { type: String, default: null },
      shield: { type: String, default: null },
      body: { type: String, default: null },
      back: { type: String, default: null },
      headAccessory: { type: String, default: null },
      eyewear: { type: String, default: null },
    },

    // Character appearance customization
    preferences: {
      background: {
        type: String,
        default: 'violet', // Default purple violet background
      },
      skin: {
        type: String,
        default: '915533', // Default tan skin
      },
      hair: {
        color: {
          type: String,
          default: 'brown',
        },
        base: {
          type: Number,
          default: 1,
        },
        bangs: {
          type: Number,
          default: 1,
        },
        mustache: {
          type: Number,
          default: 0,
        },
        beard: {
          type: Number,
          default: 0,
        },
      },
      size: {
        type: String,
        enum: ['broad', 'slim'],
        default: 'broad',
      },
      shirt: {
        type: String,
        default: 'white', // Base shirt color
      },
    },

    // Inventory (items collected during project)
    inventory: [
      {
        itemId: String,
        quantity: { type: Number, default: 1 },
      },
    ],

    // Achievement tracking
    achievements: {
      tasksCompleted: { type: Number, default: 0 },
      bossDamageDealt: { type: Number, default: 0 },
      criticalHits: { type: Number, default: 0 },
      abilitiesUsed: { type: Number, default: 0 },
    },

    // Character status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

// Compound index to ensure one character per user per project
projectCharacterSchema.index({ userId: 1, adventureId: 1 }, { unique: true });

// Class-specific starting stats
projectCharacterSchema.statics.getClassStartingStats = function getClassStats (
  characterClass,
) {
  const classStats = {
    warrior: {
      maxHp: 60, // +10 HP (tanky)
      hp: 60,
      maxMp: 20, // -10 MP (low magic)
      mp: 20,
      str: 15, // +5 STR (high damage)
      int: 8, // -2 INT (low magic)
      per: 10, // +0 PER (average)
      con: 13, // +3 CON (durable)
    },
    mage: {
      maxHp: 40, // -10 HP (fragile)
      hp: 40,
      maxMp: 50, // +20 MP (high magic)
      mp: 50,
      str: 7, // -3 STR (weak physical)
      int: 16, // +6 INT (high magic/XP)
      per: 12, // +2 PER (observant)
      con: 8, // -2 CON (fragile)
    },
    rogue: {
      maxHp: 50, // +0 HP (balanced)
      hp: 50,
      maxMp: 30, // +0 MP (balanced)
      mp: 30,
      str: 11, // +1 STR (decent damage)
      int: 10, // +0 INT (average)
      per: 16, // +6 PER (high crit/gold)
      con: 9, // -1 CON (agile, not tanky)
    },
    healer: {
      maxHp: 50, // +0 HP (balanced)
      hp: 50,
      maxMp: 45, // +15 MP (healing magic)
      mp: 45,
      str: 8, // -2 STR (support, not damage)
      int: 13, // +3 INT (wisdom)
      per: 11, // +1 PER (perceptive)
      con: 14, // +4 CON (survivor)
    },
  };

  return classStats[characterClass] || classStats.warrior;
};

// Initialize character stats based on class before first save
projectCharacterSchema.pre('save', function preSave (next) {
  // Only apply class stats on character creation (when it's a new document)
  if (this.isNew && this.class) {
    const classStats = this.constructor.getClassStartingStats(this.class);

    // Apply class-specific starting stats
    this.stats.maxHp = classStats.maxHp;
    this.stats.hp = classStats.hp;
    this.stats.maxMp = classStats.maxMp;
    this.stats.mp = classStats.mp;
    this.stats.str = classStats.str;
    this.stats.int = classStats.int;
    this.stats.per = classStats.per;
    this.stats.con = classStats.con;
  }

  next();
});

// Calculate XP needed for next level (exponential curve)
projectCharacterSchema.methods.calculateXPForNextLevel = function calculateXPForNextLevel () {
  // Formula: 100 * (level ^ 1.5)
  // Level 1→2: 100 XP
  // Level 2→3: 283 XP
  // Level 3→4: 520 XP
  // Level 10→11: 3162 XP
  return Math.floor(100 * this.level ** 1.5);
};

// Add experience and handle level ups
projectCharacterSchema.methods.addExperience = function addExperience (
  expGained,
) {
  this.stats.exp += expGained;

  let leveledUp = false;
  const levelsGained = [];

  // Check for level ups (can gain multiple levels at once)
  while (this.stats.exp >= this.stats.toNextLevel && this.level < 100) {
    this.stats.exp -= this.stats.toNextLevel;
    this.level += 1;
    leveledUp = true;
    levelsGained.push(this.level);

    // Award stat points on level up (5 points per level)
    this.availableStatPoints += 5;

    // Increase max HP and MP
    this.stats.maxHp += 5;
    this.stats.maxMp += 3;

    // Restore HP and MP on level up
    this.stats.hp = this.stats.maxHp;
    this.stats.mp = this.stats.maxMp;

    // Calculate XP needed for next level
    this.stats.toNextLevel = this.calculateXPForNextLevel();
  }

  return {
    leveledUp,
    levelsGained,
    currentLevel: this.level,
    currentExp: this.stats.exp,
    expToNextLevel: this.stats.toNextLevel,
  };
};

// Allocate stat points
projectCharacterSchema.methods.allocateStats = function allocateStats (
  statAllocations,
) {
  const {
    str = 0, int = 0, per = 0, con = 0,
  } = statAllocations;
  const totalPoints = str + int + per + con;

  if (totalPoints > this.availableStatPoints) {
    throw new Error('Not enough stat points available');
  }

  if (str < 0 || int < 0 || per < 0 || con < 0) {
    throw new Error('Stat allocations must be positive');
  }

  this.stats.str += str;
  this.stats.int += int;
  this.stats.per += per;
  this.stats.con += con;
  this.availableStatPoints -= totalPoints;

  return {
    stats: {
      str: this.stats.str,
      int: this.stats.int,
      per: this.stats.per,
      con: this.stats.con,
    },
    remainingPoints: this.availableStatPoints,
  };
};

// Take damage
projectCharacterSchema.methods.takeDamage = function takeDamage (damage) {
  const actualDamage = Math.max(1, damage); // Minimum 1 damage
  this.stats.hp = Math.max(0, this.stats.hp - actualDamage);

  return {
    damageTaken: actualDamage,
    currentHp: this.stats.hp,
    maxHp: this.stats.maxHp,
    isDead: this.stats.hp === 0,
  };
};

// Heal HP
projectCharacterSchema.methods.heal = function heal (amount) {
  const oldHp = this.stats.hp;
  this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  const actualHealing = this.stats.hp - oldHp;

  return {
    healed: actualHealing,
    currentHp: this.stats.hp,
    maxHp: this.stats.maxHp,
  };
};

// Restore mana
projectCharacterSchema.methods.restoreMana = function restoreMana (amount) {
  const oldMp = this.stats.mp;
  this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + amount);
  const actualRestore = this.stats.mp - oldMp;

  return {
    restored: actualRestore,
    currentMp: this.stats.mp,
    maxMp: this.stats.maxMp,
  };
};

// Use mana (for abilities)
projectCharacterSchema.methods.useMana = function useMana (cost) {
  if (this.stats.mp < cost) {
    throw new Error('Not enough mana');
  }

  this.stats.mp -= cost;

  return {
    currentMp: this.stats.mp,
    maxMp: this.stats.maxMp,
  };
};

// Archive character (when project ends)
projectCharacterSchema.methods.archive = function archive () {
  this.isActive = false;
  this.archivedAt = new Date();

  return {
    archived: true,
    finalLevel: this.level,
    finalStats: this.stats,
    achievements: this.achievements,
  };
};

// Get character summary for display
projectCharacterSchema.methods.toClientObject = function toClientObject () {
  return {
    _id: this._id,
    userId: this.userId,
    adventureId: this.adventureId,
    name: this.name,
    class: this.class,
    level: this.level,
    stats: {
      hp: this.stats.hp,
      maxHp: this.stats.maxHp,
      mp: this.stats.mp,
      maxMp: this.stats.maxMp,
      exp: this.stats.exp,
      toNextLevel: this.stats.toNextLevel,
      gp: this.stats.gp,
      str: this.stats.str,
      int: this.stats.int,
      per: this.stats.per,
      con: this.stats.con,
    },
    availableStatPoints: this.availableStatPoints,
    equipment: this.equipment,
    preferences: this.preferences,
    achievements: this.achievements,
    isActive: this.isActive,
    createdAt: this.createdAt,
    archivedAt: this.archivedAt,
  };
};

export const adventureCharacterSchema = projectCharacterSchema;
export const model = mongoose.model(
  'adventureCharacter',
  adventureCharacterSchema,
);
export const publicFields = 'userId adventureId name class level stats availableStatPoints equipment preferences achievements isActive createdAt archivedAt';
const ProjectCharacter = mongoose.model(
  'ProjectCharacter',
  projectCharacterSchema,
);

export default ProjectCharacter;
