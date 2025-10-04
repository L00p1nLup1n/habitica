import { authWithHeaders } from '../../middlewares/auth';
import { model as Adventure, publicFields } from '../../models/adventure';
import { model as AdventureCharacter } from '../../models/adventureCharacter';
import { model as AdventureTask } from '../../models/adventureTask';
import { Task } from '../../models/task';
import {
  NotFound,
  NotAuthorized,
  BadRequest,
} from '../../libs/errors';

const api = {};

/**
 * @api {get} /api/v4/adventures/user Get user's adventures
 * @apiName GetUserAdventures
 * @apiGroup Adventure
 * @apiDescription Fetch all adventures the user is a member of
 *
 * @apiSuccess {Object[]} data Array of adventures
 * @apiSuccess {String} data._id Adventure ID
 * @apiSuccess {String} data.name Adventure name
 * @apiSuccess {String} data.description Adventure description
 * @apiSuccess {String} data.emoji Adventure emoji
 * @apiSuccess {String} data.color Adventure color
 * @apiSuccess {String} data.category Adventure category
 * @apiSuccess {Boolean} data.isPublic Whether adventure is public
 * @apiSuccess {String} data.inviteCode 6-character invite code
 * @apiSuccess {Object} data.owner Adventure owner
 * @apiSuccess {Object[]} data.members Array of member IDs
 * @apiSuccess {Object} data.taskCounts Task counts object
 * @apiSuccess {Boolean} data.archived Whether adventure is archived
 *
 * @apiUse UserNotFound
 */
api.getUserAdventures = {
  method: 'GET',
  url: '/adventures/user',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;

    const adventures = await Adventure.findUserAdventures(user._id);

    res.respond(200, adventures);
  },
};

/**
 * @api {post} /api/v4/adventures/user Create a new adventure
 * @apiName CreateAdventure
 * @apiGroup Adventure
 *
 * @apiParam (Body) {String} name Adventure name (required, max 100 chars)
 * @apiParam (Body) {String} [description] Adventure description (max 500 chars)
 * @apiParam (Body) {String} [emoji='🗺️'] Adventure emoji
 * @apiParam (Body) {String} [color='#4f2a93'] Adventure color (hex format)
 * @apiParam (Body) {String} [category='fitness'] Category type
 * @apiParam (Body) {Boolean} [isPublic=false] Whether adventure is public
 *
 * @apiSuccess {Object} data Created adventure
 *
 * @apiError (400) {BadRequest} InvalidCategory Invalid category value
 * @apiError (400) {BadRequest} InvalidColor Invalid color format
 * @apiUse UserNotFound
 */
api.createAdventure = {
  method: 'POST',
  url: '/adventures/user',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const {
      name,
      description,
      emoji,
      color,
      category,
      isPublic,
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      throw new BadRequest(res.t('adventureNameRequired'));
    }

    const adventure = new Adventure({
      name: name.trim(),
      description: description ? description.trim() : '',
      emoji: emoji || '🗺️',
      color: color || '#4f2a93',
      category: category || 'fitness',
      isPublic: isPublic || false,
      owner: user._id,
      members: [user._id],
    });

    await adventure.save();

    const populatedAdventure = await Adventure.findById(adventure._id)
      .populate('owner', 'profile.name')
      .populate('members', 'profile.name')
      .select(publicFields)
      .lean()
      .exec();

    res.respond(201, populatedAdventure);
  },
};

/**
 * @api {get} /api/v4/adventures/:adventureId Get adventure details
 * @apiName GetAdventure
 * @apiGroup Adventure
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 *
 * @apiSuccess {Object} data Adventure object
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (401) {NotAuthorized} NotAuthorized User doesn't have access
 * @apiUse UserNotFound
 */
api.getAdventure = {
  method: 'GET',
  url: '/adventures/:adventureId',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;

    const adventure = await Adventure.findById(adventureId)
      .populate('owner', 'profile.name')
      .populate('members', 'profile.name')
      .select(publicFields)
      .exec();

    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    if (!adventure.canView(user._id)) {
      throw new NotAuthorized(res.t('noAdventureAccess'));
    }

    res.respond(200, adventure);
  },
};

/**
 * @api {put} /api/v4/adventures/:adventureId Update adventure
 * @apiName UpdateAdventure
 * @apiGroup Adventure
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 * @apiParam (Body) {String} [name] Adventure name
 * @apiParam (Body) {String} [description] Adventure description
 * @apiParam (Body) {String} [emoji] Adventure emoji
 * @apiParam (Body) {String} [color] Adventure color
 * @apiParam (Body) {String} [category] Adventure category
 * @apiParam (Body) {Boolean} [isPublic] Whether adventure is public
 *
 * @apiSuccess {Object} data Updated adventure
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (401) {NotAuthorized} NotAuthorized User is not adventure owner
 * @apiUse UserNotFound
 */
api.updateAdventure = {
  method: 'PUT',
  url: '/adventures/:adventureId',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;

    const adventure = await Adventure.findById(adventureId).exec();

    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    if (!adventure.canEdit(user._id)) {
      throw new NotAuthorized(res.t('onlyAdventureOwnerCanEdit'));
    }

    // Update allowed fields
    const allowedFields = ['name', 'description', 'emoji', 'color', 'category', 'isPublic'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        adventure[field] = req.body[field];
      }
    });

    await adventure.save();

    const updatedAdventure = await Adventure.findById(adventureId)
      .populate('owner', 'profile.name')
      .populate('members', 'profile.name')
      .select(publicFields)
      .lean()
      .exec();

    res.respond(200, updatedAdventure);
  },
};

/**
 * @api {delete} /api/v4/adventures/:adventureId Archive adventure
 * @apiName ArchiveAdventure
 * @apiGroup Adventure
 * @apiDescription Archives an adventure (soft delete)
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 *
 * @apiSuccess {Object} data Archived adventure
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (401) {NotAuthorized} NotAuthorized User is not adventure owner
 * @apiUse UserNotFound
 */
api.archiveAdventure = {
  method: 'DELETE',
  url: '/adventures/:adventureId',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;

    const adventure = await Adventure.findById(adventureId).exec();

    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    if (!adventure.canEdit(user._id)) {
      throw new NotAuthorized(res.t('onlyAdventureOwnerCanEdit'));
    }

    adventure.archived = true;
    await adventure.save();

    res.respond(200, { success: true, message: res.t('adventureArchived') });
  },
};

/**
 * @api {delete} /api/v4/adventures/:adventureId/delete Permanently delete adventure
 * @apiName DeleteAdventure
 * @apiGroup Adventure
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 *
 * @apiSuccess {Object} data Success message
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (401) {NotAuthorized} NotAuthorized User is not adventure owner
 * @apiUse UserNotFound
 */
api.deleteAdventure = {
  method: 'DELETE',
  url: '/adventures/:adventureId/delete',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;

    const adventure = await Adventure.findById(adventureId).exec();

    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    if (!adventure.canEdit(user._id)) {
      throw new NotAuthorized(res.t('onlyAdventureOwnerCanDelete'));
    }

    // Permanently delete the adventure
    await Adventure.findByIdAndDelete(adventureId);

    res.respond(200, { success: true, message: res.t('adventureDeletedPermanently') });
  },
};

/**
 * @api {post} /api/v4/adventures/join/code Join adventure by invite code
 * @apiName JoinAdventureByCode
 * @apiGroup Adventure
 *
 * @apiParam (Body) {String} inviteCode 6-character invite code
 *
 * @apiSuccess {Object} data Joined adventure
 *
 * @apiError (404) {NotFound} InvalidInviteCode Invalid or expired invite code
 * @apiError (400) {BadRequest} AlreadyMember User is already a member
 * @apiUse UserNotFound
 */
api.joinAdventureByCode = {
  method: 'POST',
  url: '/adventures/join/code',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { inviteCode } = req.body;

    if (!inviteCode || inviteCode.length !== 6) {
      throw new BadRequest(res.t('invalidInviteCode'));
    }

    const adventure = await Adventure.findByInviteCode(inviteCode);

    if (!adventure) {
      throw new NotFound(res.t('adventureNotFoundByCode'));
    }

    if (adventure.isMember(user._id)) {
      throw new BadRequest(res.t('alreadyAdventureMember'));
    }

    await adventure.addMember(user._id);

    // Add member to memberCharacter array without character
    adventure.memberCharacters.push({
      userId: user._id,
      characterId: null,
      characterCreated: false,
      joinedAt: new Date(),
    });

    await adventure.save();

    const populatedAdventure = await Adventure.findById(adventure._id)
      .populate('owner', 'profile.name')
      .populate('members', 'profile.name')
      .select(publicFields)
      .lean()
      .exec();

    res.respond(200, populatedAdventure);
  },
};

/**
 * @api {post} /api/v4/adventures/:adventureId/leave Leave adventure
 * @apiName LeaveAdventure
 * @apiGroup Adventure
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 *
 * @apiSuccess {Object} data Success message
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (400) {BadRequest} CannotLeaveOwnAdventure Owner cannot leave their own adventure
 * @apiUse UserNotFound
 */
api.leaveAdventure = {
  method: 'POST',
  url: '/adventures/:adventureId/leave',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;

    const adventure = await Adventure.findById(adventureId).exec();

    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    if (adventure.isOwner(user._id)) {
      throw new BadRequest(res.t('ownerCannotLeaveAdventure'));
    }

    await adventure.removeMember(user._id);

    res.respond(200, { success: true, message: res.t('leftAdventure') });
  },
};

/**
 * @api {post} /api/v4/adventures/:adventureId/members/:userId/kick Kick member from adventure
 * @apiName KickAdventureMember
 * @apiGroup Adventure
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 * @apiParam (Path) {String} userId User ID to kick
 *
 * @apiSuccess {Object} data Success message
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (404) {NotFound} UserNotMember User is not a member of this adventure
 * @apiError (401) {NotAuthorized} NotAuthorized Only owner can kick members
 * @apiError (400) {BadRequest} CannotKickOwner Cannot kick the adventure owner
 * @apiUse UserNotFound
 */
api.kickAdventureMember = {
  method: 'POST',
  url: '/adventures/:adventureId/members/:userId/kick',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId, userId } = req.params;

    const adventure = await Adventure.findById(adventureId).exec();

    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    // Only owner can kick members
    if (!adventure.isOwner(user._id)) {
      throw new NotAuthorized(res.t('onlyOwnerCanKickMembers'));
    }

    // Cannot kick the owner
    if (adventure.isOwner(userId)) {
      throw new BadRequest(res.t('cannotKickAdventureOwner'));
    }

    // Check if user is actually a member
    if (!adventure.isMember(userId)) {
      throw new NotFound(res.t('userNotAdventureMember'));
    }

    await adventure.removeMember(userId);

    res.respond(200, { success: true, message: res.t('memberKickedSuccessfully') });
  },
};

/**
 * @api {get} /api/v4/adventures/:adventureId/tasks Get adventure tasks
 * @apiName GetAdventureTasks
 * @apiGroup Adventure
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 *
 * @apiSuccess {Object[]} data Array of tasks
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (401) {NotAuthorized} NotAuthorized User doesn't have access
 * @apiUse UserNotFound
 */
api.getAdventureTasks = {
  method: 'GET',
  url: '/adventures/:adventureId/tasks',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;

    const adventure = await Adventure.findById(adventureId).exec();

    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    if (!adventure.canView(user._id)) {
      throw new NotAuthorized(res.t('noAdventureAccess'));
    }

    const tasks = await Task.find({
      adventureId,
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    res.respond(200, tasks);
  },
};
/**
 * @api {post} /api/v4/adventures/:adventureId/character/create Create adventure character
 * @apiName CreateAdventureCharacter
 * @apiGroup Adventure
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 * @apiParam (Body) {String} name Character name (max 50 chars)
 * @apiParam (Body) {String} class Character class (warrior/mage/rogue/healer)
 * @apiParam (Body) {Object} [preferences] Character appearance preferences
 *
 * @apiSuccess {Object} data Created character object
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (401) {NotAuthorized} NotMember User is not a member of this adventure
 * @apiError (400) {BadRequest} CharacterAlreadyExists Character already exists for this adventure
 * @apiUse UserNotFound
 */
api.createAdventureCharacter = {
  method: 'POST',
  url: '/adventures/:adventureId/character/create',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;
    const {
      name, class: characterClass, preferences = {}, equipment = {},
    } = req.body;

    // Note: AdventureCharacter already imported at top of file:
    // import { model as AdventureCharacter } from '../../models/projectCharacter';

    // Validate inputs
    if (!name || name.trim().length === 0 || name.length > 50) {
      throw new BadRequest(res.t('invalidCharacterName'));
    }
    const validClasses = ['warrior', 'mage', 'rogue', 'healer'];

    if (!validClasses.includes(characterClass)) {
      throw new BadRequest(res.t('invalidCharacterClass'));
    }
    // Check if adventure exists
    const adventure = await Adventure.findById(adventureId).exec();
    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    // Check if user is the owner (owners cannot create characters)
    if (adventure.isOwner(user._id)) {
      throw new NotAuthorized(res.t('ownerCannotCreateCharacter'));
    }

    // Check if is an adventure member
    if (!adventure.isMember(user._id)) {
      throw new NotAuthorized(res.t('mustBeAdventureMember'));
    }
    // Check if character exists
    const existingCharacter = await AdventureCharacter.findOne({
      userId: user._id,
      adventureId,
    }).exec();

    if (existingCharacter) {
      throw new BadRequest(res.t('characterAlreadyExists'));
    }
    // Create a new character

    const character = new AdventureCharacter({
      userId: user._id,
      adventureId,
      name: name.trim(),
      class: characterClass,
      preferences: {
        skin: preferences.skin || '915533',
        hair: {
          color: (preferences.hair && preferences.hair.color) || 'brown',
          base: (preferences.hair && preferences.hair.base) || 1,
          bangs: (preferences.hair && preferences.hair.bangs) || 1,
          mustache: (preferences.hair && preferences.hair.mustache) || 0,
          beard: (preferences.hair && preferences.hair.beard) || 0,
        },
        size: preferences.size || 'broad',
        shirt: preferences.shirt || 'white',
      },
      equipment: {
        weapon: equipment.weapon || null,
        armor: equipment.armor || null,
        head: equipment.head || null,
        shield: equipment.shield || null,
        body: equipment.body || null,
        back: equipment.back || null,
        headAccessory: equipment.headAccessory || null,
        eyewear: equipment.eyewear || null,
      },
    });

    await character.save();

    // Update adventure to track char creation
    const memberIndex = adventure.memberCharacters.findIndex(
      mc => mc.userId === user._id,
    );

    if (memberIndex === -1) {
      adventure.memberCharacters.push({
        userId: user._id,
        characterId: character._id,
        characterCreated: true,
        joinedAt: new Date(),
      });
    } else {
      adventure.memberCharacters[memberIndex].characterId = character._id;
      adventure.memberCharacters[memberIndex].characterCreated = true;
    }

    await adventure.save();

    res.respond(201, character.toClientObject());
  },
};

/**
 * @api {get} /api/v4/adventures/:adventureId/character Get adventure character
 * @apiName GetAdventureCharacter
 * @apiGroup Adventure
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 *
 * @apiSuccess {Object} data Character object or null if not created
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (401) {NotAuthorized} NotMember User is not a member of this adventure
 * @apiUse UserNotFound
 */

api.getAdventureCharacter = {
  method: 'GET',
  url: '/adventures/:adventureId/character',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;

    // Check whether adventure exists
    const adventure = await Adventure.findById(adventureId).exec();
    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    // Check if user is the owner (owners don't have characters)
    if (adventure.isOwner(user._id)) {
      throw new NotAuthorized(res.t('ownerCannotHaveCharacter'));
    }

    if (!adventure.isMember(user._id)) {
      throw new NotAuthorized(res.t('mustBeAdventureMember'));
    }

    // Find character
    const character = await AdventureCharacter.findOne({
      userId: user._id,
      adventureId,
      isActive: true,
    }).exec();

    res.respond(200, character ? character.toClientObject() : null);
  },
};

/**
 * @api {get} /api/v4/adventures/:adventureId/characters Get all adventure characters
 * @apiName GetAllAdventureCharacters
 * @apiGroup Adventure
 *
 * @apiParam (Path) {String} adventureId Adventure ID
 *
 * @apiSuccess {Object[]} data Array of character objects for all members
 *
 * @apiError (404) {NotFound} AdventureNotFound Adventure not found
 * @apiError (401) {NotAuthorized} NotAuthorized User doesn't have access
 * @apiUse UserNotFound
 */

api.getAllAdventureCharacters = {
  method: 'GET',
  url: '/adventures/:adventureId/characters',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;

    // Check if adventure exists
    const adventure = await Adventure.findById(adventureId).exec();
    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    // Check if user has acess
    if (!adventure.canView(user._id)) {
      throw new NotAuthorized(res.t('noAdventureAccess'));
    }

    // Get all chars for this adventure
    const characters = await AdventureCharacter.find({
      adventureId,
      isActive: true,
    }).populate('userId', 'profile.name auth.local.username')
      .select('userId adventureId name class level stats equipment preferences')
      .lean()
      .exec();

    res.respond(200, characters);
  },
};

/**
 * @api {post} /api/v4/adventures/:adventureId/tasks Create adventure task
 * @apiName CreateAdventureTask
 * @apiGroup Adventure
 * @apiDescription Create a new task within an adventure
 *
 * @apiParam {String} adventureId Adventure ID
 *
 * @apiSuccess {Object} data Created task
 */
api.createAdventureTask = {
  method: 'POST',
  url: '/adventures/:adventureId/tasks',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;

    // Check if adventure exists
    const adventure = await Adventure.findById(adventureId).exec();
    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    // Check if user has access
    if (!adventure.canView(user._id)) {
      throw new NotAuthorized(res.t('noAdventureAccess'));
    }

    // Only owner can create tasks
    if (adventure.leaderId.toString() !== user._id) {
      throw new NotAuthorized(res.t('onlyOwnerCanManageTasks'));
    }

    // Create task
    const taskData = {
      ...req.body,
      adventureId,
      createdBy: user._id,
    };

    const task = new AdventureTask(taskData);
    await task.save();

    res.respond(201, task);
  },
};

/**
 * @api {get} /api/v4/adventures/:adventureId/tasks Get adventure tasks
 * @apiName GetAdventureTasks
 * @apiGroup Adventure
 * @apiDescription Get all tasks for an adventure
 *
 * @apiParam {String} adventureId Adventure ID
 * @apiParam {String} [status] Filter by status (backlog, todo, inProgress, review, done)
 *
 * @apiSuccess {Object[]} data Array of tasks
 */
api.getAdventureTasks = {
  method: 'GET',
  url: '/adventures/:adventureId/tasks',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId } = req.params;
    const { status } = req.query;

    // Check if adventure exists
    const adventure = await Adventure.findById(adventureId).exec();
    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    // Check if user has access
    if (!adventure.canView(user._id)) {
      throw new NotAuthorized(res.t('noAdventureAccess'));
    }

    // Build query
    const query = {
      adventureId,
      isActive: true,
    };

    if (status) {
      query.status = status;
    }

    const tasks = await AdventureTask.find(query)
      .populate('assignedTo', 'name class level')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    res.respond(200, tasks);
  },
};

/**
 * @api {put} /api/v4/adventures/:adventureId/tasks/:taskId Update adventure task
 * @apiName UpdateAdventureTask
 * @apiGroup Adventure
 * @apiDescription Update an adventure task (owner only)
 *
 * @apiParam {String} adventureId Adventure ID
 * @apiParam {String} taskId Task ID
 *
 * @apiSuccess {Object} data Updated task
 */
api.updateAdventureTask = {
  method: 'PUT',
  url: '/adventures/:adventureId/tasks/:taskId',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId, taskId } = req.params;

    // Check if adventure exists
    const adventure = await Adventure.findById(adventureId).exec();
    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    // Only owner can update tasks
    if (adventure.leaderId.toString() !== user._id) {
      throw new NotAuthorized(res.t('onlyOwnerCanManageTasks'));
    }

    // Find and update task
    const task = await AdventureTask.findOne({
      _id: taskId,
      adventureId,
    }).exec();

    if (!task) {
      throw new NotFound(res.t('taskNotFound'));
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'type',
      'storyPoints',
      'priority',
      'status',
      'dueDate',
      'tags',
      'assignedTo',
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    res.respond(200, task);
  },
};

/**
 * @api {delete} /api/v4/adventures/:adventureId/tasks/:taskId Delete adventure task
 * @apiName DeleteAdventureTask
 * @apiGroup Adventure
 * @apiDescription Delete an adventure task (owner only)
 *
 * @apiParam {String} adventureId Adventure ID
 * @apiParam {String} taskId Task ID
 *
 * @apiSuccess {Object} data Success message
 */
api.deleteAdventureTask = {
  method: 'DELETE',
  url: '/adventures/:adventureId/tasks/:taskId',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId, taskId } = req.params;

    // Check if adventure exists
    const adventure = await Adventure.findById(adventureId).exec();
    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    // Only owner can delete tasks
    if (adventure.leaderId.toString() !== user._id) {
      throw new NotAuthorized(res.t('onlyOwnerCanManageTasks'));
    }

    // Find and delete task
    const task = await AdventureTask.findOne({
      _id: taskId,
      adventureId,
    }).exec();

    if (!task) {
      throw new NotFound(res.t('taskNotFound'));
    }

    // Delete all synced Habitica tasks
    if (task.syncedHabiticaTasks && task.syncedHabiticaTasks.length > 0) {
      const taskIds = task.syncedHabiticaTasks.map(sync => sync.taskId);
      await Task.deleteMany({ _id: { $in: taskIds } }).exec();
    }

    // Delete adventure task
    await task.deleteOne();

    res.respond(200, { message: res.t('taskDeleted') });
  },
};

/**
 * @api {post} /api/v4/adventures/:adventureId/tasks/:taskId/sync Sync task to personal board
 * @apiName SyncAdventureTask
 * @apiGroup Adventure
 * @apiDescription Sync an adventure task to user's personal Habitica task board
 *
 * @apiParam {String} adventureId Adventure ID
 * @apiParam {String} taskId Adventure task ID
 *
 * @apiSuccess {Object} data Synced task info
 * @apiSuccess {String} data.habiticaTaskId Created Habitica task ID
 * @apiSuccess {Object} data.adventureTask Adventure task
 */
api.syncAdventureTaskToPersonal = {
  method: 'POST',
  url: '/adventures/:adventureId/tasks/:taskId/sync',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { adventureId, taskId } = req.params;

    // Check if adventure exists
    const adventure = await Adventure.findById(adventureId).exec();
    if (!adventure) {
      throw new NotFound(res.t('adventureNotFound'));
    }

    // Check if user has access
    if (!adventure.canView(user._id)) {
      throw new NotAuthorized(res.t('noAdventureAccess'));
    }

    // Get adventure task
    const adventureTask = await AdventureTask.findById(taskId).exec();
    if (!adventureTask) {
      throw new NotFound(res.t('taskNotFound'));
    }

    if (adventureTask.adventureId.toString() !== adventureId) {
      throw new NotAuthorized(res.t('taskNotInAdventure'));
    }

    // Check if already synced
    if (adventureTask.isSyncedForUser(user._id)) {
      throw new BadRequest(res.t('taskAlreadySynced'));
    }

    // Get user's character for this adventure
    const character = await AdventureCharacter.findOne({
      userId: user._id,
      adventureId,
      isActive: true,
    }).exec();

    if (!character) {
      throw new NotFound(res.t('characterNotFound'));
    }

    // Create Habitica task
    const priorityMap = {
      critical: 2,
      high: 1.5,
      medium: 1,
      low: 0.1,
    };
    const habiticaTask = new Task({
      type: adventureTask.type,
      text: `[Adventure] ${adventureTask.title}`,
      notes: `${adventureTask.description}\n\n---\n🎮 Adventure: ${adventure.name}\n⭐ Story Points: ${adventureTask.storyPoints}\n🎯 Priority: ${adventureTask.priority}`,
      userId: user._id,
      adventureId: adventure._id,
      priority: priorityMap[adventureTask.priority] || 1,
      value: adventureTask.rewards.xp / 10, // Initial value based on XP
      tags: adventureTask.tags || [], // Only use UUID tags from adventure task
    });

    // Add due date if exists
    if (adventureTask.dueDate && adventureTask.type === 'todo') {
      habiticaTask.date = adventureTask.dueDate;
    }

    // Add checklist if exists
    if (adventureTask.checklist && adventureTask.checklist.length > 0) {
      habiticaTask.checklist = adventureTask.checklist.map(item => ({
        text: item.text,
        completed: item.completed,
      }));
    }

    await habiticaTask.save();

    // Update adventure task with sync info
    adventureTask.syncedHabiticaTasks.push({
      userId: user._id,
      taskId: habiticaTask._id,
      characterId: character._id,
      syncedAt: new Date(),
    });

    await adventureTask.save();

    res.respond(200, {
      habiticaTaskId: habiticaTask._id,
      adventureTask: adventureTask.toObject(),
      message: res.t('taskSyncedSuccessfully'),
    });
  },
};

/**
 * @api {delete} /api/v4/adventures/:adventureId/tasks/:taskId/sync Unsync task from personal board
 * @apiName UnsyncAdventureTask
 * @apiGroup Adventure
 * @apiDescription Remove sync between adventure task and personal Habitica task
 *
 * @apiParam {String} adventureId Adventure ID
 * @apiParam {String} taskId Adventure task ID
 *
 * @apiSuccess {Object} data Success message
 */
api.unsyncAdventureTaskFromPersonal = {
  method: 'DELETE',
  url: '/adventures/:adventureId/tasks/:taskId/sync',
  middlewares: [authWithHeaders()],
  async handler (req, res) {
    const { user } = res.locals;
    const { taskId } = req.params;

    // Get adventure task
    const adventureTask = await AdventureTask.findById(taskId).exec();
    if (!adventureTask) {
      throw new NotFound(res.t('taskNotFound'));
    }

    // Get synced Habitica task ID
    const habiticaTaskId = adventureTask.getSyncedTaskId(user._id);
    if (!habiticaTaskId) {
      throw new NotFound(res.t('taskNotSynced'));
    }

    // Delete Habitica task
    await Task.deleteOne({ _id: habiticaTaskId, userId: user._id }).exec();

    // Remove sync info from adventure task
    adventureTask.syncedHabiticaTasks = adventureTask.syncedHabiticaTasks.filter(
      sync => sync.userId !== user._id,
    );

    await adventureTask.save();

    res.respond(200, {
      message: res.t('taskUnsyncedSuccessfully'),
    });
  },
};

export default api;
