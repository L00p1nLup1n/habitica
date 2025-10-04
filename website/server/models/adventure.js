import mongoose from 'mongoose';
import validator from 'validator';

const { Schema } = mongoose;

// Adventure categories
export const ADVENTURE_CATEGORIES = [
  'fitness',
  'learning',
  'creativity',
  'productivity',
  'wellness',
];

// Generate a unique 6-character invite code
function generateInviteCode () {
  // Use uppercase alphanumeric characters for easy sharing
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const AdventureSchema = new Schema({
  name: {
    $type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    $type: String,
    trim: true,
    maxlength: 500,
  },
  emoji: {
    $type: String,
    default: '🗺️',
  },
  color: {
    $type: String,
    default: '#4f2a93',
    validate: {
      validator: v => validator.isHexColor(v),
      message: 'Invalid color format. Use hex color (e.g., #4f2a93)',
    },
  },
  category: {
    $type: String,
    enum: ADVENTURE_CATEGORIES,
    default: 'fitness',
  },
  isPublic: {
    $type: Boolean,
    default: false,
  },
  inviteCode: {
    $type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    uppercase: true,
  },
  owner: {
    $type: String,
    ref: 'User',
    required: true,
    validate: [v => validator.isUUID(v), 'Invalid UUID for adventure owner.'],
  },
  members: [{
    $type: String,
    ref: 'User',
    validate: [v => validator.isUUID(v), 'Invalid UUID for adventure member.'],
  }],
  memberCharacters: [{
    userId: {
      $type: String,
      ref: 'User',
    },
    characterId: {
      $type: Schema.Types.ObjectId,
    },
    characterCreated: {
      $type: Boolean,
      default: false,
    },
    joinedAt: {
      $type: Date,
      default: Date.now,
    },
  }],
  // Task counts for quick display
  taskCounts: {
    total: { $type: Number, default: 0 },
    completed: { $type: Number, default: 0 },
    inProgress: { $type: Number, default: 0 },
    todo: { $type: Number, default: 0 },
  },
  archived: {
    $type: Boolean,
    default: false,
  },
}, {
  strict: true,
  minimize: false,
  typeKey: '$type',
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes
AdventureSchema.index({ owner: 1, archived: 1 });
AdventureSchema.index({ members: 1, archived: 1 });
// inviteCode index is already created by unique:true and sparse:true in field definition
AdventureSchema.index({ isPublic: 1, archived: 1 });

// Generate invite code before saving
AdventureSchema.pre('save', async function generateCode (next) {
  // Only generate code if not already set
  if (!this.inviteCode) {
    let code;
    let exists = true;

    // Keep generating until we get a unique code
    while (exists) {
      code = generateInviteCode();
      // eslint-disable-next-line no-await-in-loop
      const existing = await mongoose.model('Adventure').findOne({ inviteCode: code });
      exists = Boolean(existing);
    }

    this.inviteCode = code;
  }

  next();
});

// Ensure owner is always in members array
AdventureSchema.pre('save', function ensureOwnerInMembers (next) {
  const ownerStr = this.owner.toString();
  const isOwnerInMembers = this.members.some(
    memberId => memberId.toString() === ownerStr,
  );

  if (!isOwnerInMembers) {
    this.members.push(this.owner);
  }
  next();
});

// Remove duplicate members
AdventureSchema.pre('save', function deduplicateMembers (next) {
  const seen = new Set();
  this.members = this.members.filter(memberId => {
    const memberStr = memberId.toString();
    if (seen.has(memberStr)) {
      return false;
    }
    seen.add(memberStr);
    return true;
  });
  next();
});

// Instance methods
AdventureSchema.methods.isOwner = function isOwner (userId) {
  const ownerId = typeof this.owner === 'object' && this.owner._id
    ? this.owner._id.toString()
    : this.owner.toString();
  return ownerId === userId.toString();
};

AdventureSchema.methods.isMember = function isMember (userId) {
  return this.members.some(memberId => {
    // Handle both populated (object) and unpopulated (string) members
    const id = typeof memberId === 'object' && memberId._id
      ? memberId._id.toString()
      : memberId.toString();
    return id === userId.toString();
  });
};

AdventureSchema.methods.canEdit = function canEdit (userId) {
  // Only owner can edit for now (can add managers later)
  return this.isOwner(userId);
};

AdventureSchema.methods.canView = function canView (userId) {
  // Public adventures can be viewed by anyone
  // Private adventures only by members
  return this.isPublic || this.isMember(userId);
};

AdventureSchema.methods.addMember = async function addMember (userId) {
  if (!this.isMember(userId)) {
    this.members.push(userId);
    await this.save();
  }
  return this;
};

AdventureSchema.methods.removeMember = async function removeMember (userId) {
  // Can't remove owner
  if (this.isOwner(userId)) {
    throw new Error('Cannot remove adventure owner');
  }

  this.members = this.members.filter(
    memberId => memberId.toString() !== userId.toString(),
  );
  await this.save();
  return this;
};

// Static methods
AdventureSchema.statics.findUserAdventures = function findUserAdventures (userId) {
  return this.find({
    members: userId,
    archived: false,
  })
    .populate('owner', 'profile.name')
    .populate('members', 'profile.name')
    .sort({ createdAt: -1 })
    .exec();
};

AdventureSchema.statics.findByInviteCode = function findByInviteCode (code) {
  return this.findOne({
    inviteCode: code.toUpperCase(),
    archived: false,
  })
    .populate('owner', 'profile.name')
    .populate('members', 'profile.name')
    .exec();
};

// Public fields to expose to clients
export const publicFields = 'name description emoji color category isPublic inviteCode owner members taskCounts archived createdAt updatedAt';

export const model = mongoose.model('Adventure', AdventureSchema);
