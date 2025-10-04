<template>
  <div id="adventure-party-header" class="row">
    <div
      ref="partyMemberDiv"
      v-resize="1500"
      class="adventure-members d-flex"
      @resized="setMembersWidth($event)"
    >
      <member-details
        v-for="(character, $index) in visibleCharacters"
        v-if="$index < membersToShow"
        :key="character._id"
        :member="characterToMember(character)"
        :condensed="false"
        :expanded="false"
        :is-header="true"
        :class-badge-position="'next-to-name'"
        :class="{ 'current-user-character': isCurrentUser(character) }"
      />
    </div>
  </div>
</template>

<script>
import MemberDetails from "../memberDetails";
import ResizeDirective from "@/directives/resize.directive";
import gearContent from '@/../../common/script/content/gear/index';

export default {
  name: 'AdventurePartyHeader',
  directives: {
    resize: ResizeDirective
  },
  components: {
    MemberDetails,
  },
  props: {
    adventure: {
        type: Object,
        required: true,
    },
    characters: {
        type: Array,
        default: () => [],
    }
  },
  data() {
    return  {
        expandedCharacter: null,
        currentWidth: 0,
    };
  },
  computed: {
    membersToShow() {
        return Math.floor(this.currentWidth / 140) + 1;
    },
    isOwner() {
      // Check if current user is the adventure owner
      const currentUserId = this.$store.state.user.data._id;
      return this.adventure.leaderId === currentUserId;
    },
    hasCharacter() {
      // Check if current user has a character in this adventure
      const currentUserId = this.$store.state.user.data._id;
      return this.characters.some(c => {
        const charUserId = typeof c.userId === 'string' ? c.userId : c.userId?._id || c.userId?.toString();
        return charUserId === currentUserId;
      });
    },
    visibleCharacters() {
        const sorted = [...this.characters];
        const currentUserId = this.$store.state.user.data._id;
        
        console.log('Current user ID:', currentUserId);
        console.log('Is owner:', this.isOwner);
        console.log('Has character:', this.hasCharacter);
        console.log('All characters:', sorted.map(c => ({ 
            name: c.name, 
            userId: c.userId,
            userIdType: typeof c.userId,
            userIdString: typeof c.userId === 'string' ? c.userId : c.userId?._id || c.userId?.toString()
        })));
        
        // If user is owner without a character, sort by latest joined (most recent createdAt first)
        if (this.isOwner && !this.hasCharacter) {
          sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA; // Newest first
          });
          console.log('Sorted as owner (latest first):', sorted.map(c => c.name));
          return sorted;
        }
        
        // If user is a member (has a character), sort with current user first
        const currentUserChar = sorted.find(c => {
            const charUserId = typeof c.userId === 'string' ? c.userId : c.userId?._id || c.userId?.toString();
            return charUserId === currentUserId;
        });
        
        console.log('Found current user character:', currentUserChar?.name);
        
        if(currentUserChar) {
            sorted.splice(sorted.indexOf(currentUserChar), 1);
            sorted.unshift(currentUserChar);
        }
        
        console.log('Sorted as member (current user first):', sorted.map(c => c.name));
        return sorted;
    },
  },
  methods: {
    expandCharacter(characterId) {
      this.expandedCharacter = this.expandedCharacter === characterId ? null : characterId;
    },
    isCurrentUser(character) {
      // Only highlight if user has a character (not just viewing as owner)
      if (!this.hasCharacter) {
        return false;
      }
      const currentUserId = this.$store.state.user.data._id;
      const charUserId = typeof character.userId === 'string' ? character.userId : character.userId?._id || character.userId?.toString();
      return charUserId === currentUserId;
    },
    characterToMember(character) {
      // ...existing code...
      const userId = typeof character.userId === 'string' ? character.userId : character.userId?._id || character.userId?.toString();
      const userObject = typeof character.userId === 'object' ? character.userId : null;
      const member = {
        _id: userId,
        profile: { name: character.name },
        auth: {
          local: {
            username: userObject?.auth?.local?.username || null,
          },
        },
        stats: {
          class: character.class,
          hp: character.stats.hp,
          maxHp: character.stats.maxHp, // Add maxHp from character
          mp: character.stats.mp,
          exp: character.stats.exp,
          lvl: character.level,
          str: character.stats.str || 10,
          int: character.stats.int || 10,
          per: character.stats.per || 10,
          con: character.stats.con || 10,
          buffs: {
            str: 0,
            int: 0,
            per: 0,
            con: 0,
            stealth: 0,
            streaks: false,
            snowball: false,
            spookySparkles: false,
            shinySeed: false,
            seafoam: false,
          },
        },
        preferences: {
          ...character.preferences,
          background: character.preferences?.background || 'violet', // Default to violet if not set
        },
        items: {
          currentMount: '',
          currentPet: '',
          gear: {
            equipped: character.equipment || {},
            costume: character.equipment || {},
          },
        },
        contributor: {},
        backer: {},
      };
      return member;
    },
    setMembersWidth($event) {
      if (this.currentWidth !== $event.width) {
        this.currentWidth = $event.width;
      }
    },
    getGearKey(character, type) {
      // Prefer character.equipment, fallback to character.gear.equipped
      const eq = character.equipment || (character.gear && character.gear.equipped) || {};
      return eq[type] || null;
    },
    getGearName(gearKey) {
      if (!gearKey) return '';
      const gear = gearContent.flat[gearKey];
      if (!gear) {
        console.warn('Gear not found for key:', gearKey);
        return gearKey;
      }
      // gear.text is a function that returns the translated text
      return typeof gear.text === 'function' ? gear.text() : gear.text;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/scss/colors.scss';

#adventure-party-header {
  padding-left: 24px;
  padding-top: 9px;
  padding-bottom: 8px;
  background: $purple-50;
  color: $header-color;
  flex-wrap: nowrap;
  position: relative;
}

.adventure-members {
  flex-grow: 1;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  gap: 16px; // Add spacing between members
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
}

.current-user-character {
  padding: 4px;
  margin: -4px;
  background: linear-gradient(135deg, rgba(255, 166, 35, 0.1) 0%, rgba(255, 166, 35, 0.05) 100%);
}
</style>

