<template>
  <div class="create-character-modal">
    <b-modal
      id="create-character-modal"
      v-model="showModal"
      :title="$t('createAdventureCharacter')"
      size="lg"
      no-close-on-backdrop
      no-close-on-esc
      hide-header-close
    >
      <template #modal-footer>
        <button
          class="btn btn-primary"
          @click="handleCreateCharacter"
        >
          {{ $t('create') }}
        </button>
      </template>
      <div class="character-creation-form">
        <!--Char name -->
        <div class="form-group">
          <label>
            {{ $t("characterName") }}
            <span class="required-indicator">*</span>
          </label>
          <input
            v-model="characterName"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': showNameError }"
            :placeholder="$t('enterCharacterName')"
            maxlength="50"
            required
            @input="showNameError = false"
          />
          <div
            v-if="showNameError"
            class="invalid-feedback"
          >
            {{ $t("pleaseEnterCharacterName") }}
          </div>
        </div>
        <div class="form-group">
          <label>{{ $t("selectCharacterClass") }}</label>
          <div class="class-options">
            <div
              v-for="cls in characterClasses"
              :key="cls.value"
              class="class-card"
              :class="{ selected: selectedClass === cls.value }"
              @click="selectedClass = cls.value"
            >
              <div class="class-icon">{{ cls.icon }}</div>
              <h4>{{ $t(cls.name) }}</h4>
              <p>{{ $t(cls.description) }}</p>
              <div class="class-stats">
                <div><strong>HP:</strong> {{ cls.stats.hp }}</div>
                <div><strong>MP:</strong> {{ cls.stats.mp }}</div>
                <div><strong>STR:</strong> {{ cls.stats.str }}</div>
                <div><strong>INT:</strong> {{ cls.stats.int }}</div>
              </div>
            </div>
          </div>
        </div>
                <!--Character Appearance-->
        <div class="form-group appearance-section">
          <label>Appearance (optional)</label>
          
          <!-- Avatar Preview -->
          <div class="avatar-section d-flex justify-content-center">
            <div>
              <div class="user-creation-bg mt-5">
                <avatar
                  class="new-user"
                  :member="previewCharacter"
                  :avatar-only="true"
                  :with-background="true"
                  :override-top-padding="'0px'"
                />
              </div>
            </div>
          </div>

          <!-- Main Navigation Tabs -->
          <nav class="nav nav-tabs justify-content-center mb-4 mx-auto text-center" id="options-nav">
            <ul class="nav nav-tabs mx-auto" style="display: flex; justify-content: center;">
              <li class="nav-item" @click="changeTopPage('body', 'size')">
                <a class="nav-link d-flex align-items-center justify-content-center" :class="{active: activeTopPage === 'body'}" href="#">
                  <span class="svg-icon mr-1" v-html="icons.bodyIcon"></span>
                  <span>Body</span>
                </a>
              </li>
              <li class="nav-item" @click="changeTopPage('skin', 'color')">
                <a class="nav-link d-flex align-items-center justify-content-center" :class="{active: activeTopPage === 'skin'}" href="#">
                  <span class="svg-icon mr-1" v-html="icons.skinIcon"></span>
                  <span>Skin</span>
                </a>
              </li>
              <li class="nav-item" @click="changeTopPage('hair', 'color')">
                <a class="nav-link d-flex align-items-center justify-content-center" :class="{active: activeTopPage === 'hair'}" href="#">
                  <span class="svg-icon mr-1" v-html="icons.hairIcon"></span>
                  <span>Hair</span>
                </a>
              </li>
            </ul>
          </nav>

          <!-- Body Section -->
          <div
            v-if="activeTopPage === 'body'"
            id="body"
            class="customize-section d-flex flex-column"
          >
            <sub-menu
              class="text-center"
              :items="bodySubMenuItems"
              :active-sub-page="activeSubPage"
              @changeSubPage="changeSubPage($event)"
            />
            <div v-if="activeSubPage === 'size'">
              <customize-options
                :items="sizes"
                :current-value="characterAppearance.size"
              />
            </div>
            <div v-if="activeSubPage === 'shirt'">
              <customize-options
                :items="userShirts"
                :current-value="characterAppearance.shirt"
              />
            </div>
          </div>

          <!-- Skin Section -->
          <div
            v-if="activeTopPage === 'skin'"
            id="skin"
            class="customize-section d-flex flex-column"
          >
            <sub-menu
              class="text-center"
              :items="skinSubMenuItems"
              :active-sub-page="activeSubPage"
              @changeSubPage="changeSubPage($event)"
            />
            <customize-options
              :items="userSkins"
              :current-value="characterAppearance.skin"
            />
          </div>

          <!-- Hair Section -->
          <div
            v-if="activeTopPage === 'hair'"
            id="hair"
            class="customize-section d-flex flex-column"
          >
            <sub-menu
              class="text-center"
              :items="hairSubMenuItems"
              :active-sub-page="activeSubPage"
              @changeSubPage="changeSubPage($event)"
            />
            <div v-if="activeSubPage === 'color'">
              <customize-options
                :items="userHairColors"
                :current-value="characterAppearance.hair.color"
              />
            </div>
            <div v-if="activeSubPage === 'bangs'">
              <customize-options
                :items="hairBangs"
                :current-value="characterAppearance.hair.bangs"
              />
            </div>
            <div v-if="activeSubPage === 'style'">
              <customize-options
                :items="userHairStyles"
                :current-value="characterAppearance.hair.base"
              />
            </div>
          </div>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>

import Avatar from '@/components/avatar';
import CustomizeOptions from '@/components/avatarModal/customize-options';
import SubMenu from '@/components/avatarModal/sub-menu';
import appearance from '@/../../common/script/content/appearance';

import bodyIcon from '@/assets/svg/body.svg?raw';
import skinIcon from '@/assets/svg/skin.svg?raw';
import hairIcon from '@/assets/svg/hair.svg?raw';

// Import Habitica gear definitions
import gearContent from '@/../../common/script/content/gear/index';

export default {
  name: "createCharacter",
  components: {
    Avatar,
    CustomizeOptions,
    SubMenu,
  },
  props: {
    adventureId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showModal: true,
      characterName: "",
      selectedClass: "warrior",
      showNameError: false,
      activeTopPage: 'body',
      activeSubPage: 'size',
      icons: Object.freeze({
        bodyIcon,
        skinIcon,
        hairIcon,
      }),
      characterAppearance: {
        skin: '915533',
        hair: {
          color: 'brown',
          base: 1,
          bangs: 1,
        },
        size: 'broad',
        shirt: 'green',
      },
      characterClasses: [
        {
          value: "warrior",
          name: "warrior",
          icon: "⚔️",
          description: "warriorDescription",
          stats: { hp: 60, mp: 20, str: 15, int: 8 },
        },
        {
          value: "mage",
          name: "mage",
          icon: "🔮",
          description: "mageDescription",
          stats: { hp: 40, mp: 50, str: 7, int: 16 },
        },
        {
          value: "rogue",
          name: "rogue",
          icon: "🗡️",
          description: "rogueDescription",
          stats: { hp: 50, mp: 30, str: 11, int: 10 },
        },
        {
          value: "healer",
          name: "healer",
          icon: "✨",
          description: "healerDescription",
          stats: { hp: 50, mp: 45, str: 8, int: 13 },
        },
      ],
      bodySubMenuItems: [
        { id: 'size', label: 'Size' },
        { id: 'shirt', label: 'Shirt' },
      ],
      skinSubMenuItems: [
        { id: 'color', label: 'Color' },
      ],
      hairSubMenuItems: [
        { id: 'color', label: 'Color' },
        { id: 'bangs', label: 'Bangs' },
        { id: 'style', label: 'Style' },
      ],
      skinOptions: [
        'ddc994',
        'f5a76e',
        'ea8349',
        'c06534',
        '98461a',
        '915533',
        'c3e1dc',
        '6bd049',
      ],

    };
  },
  computed: {
    previewCharacter() {
      // Assign starting gear based on selected class
      // Map 'mage' to 'wizard' for gear system
      const classKey = this.selectedClass === 'mage' ? 'wizard' : this.selectedClass;
      // Use base gear for non-class slots
      const baseGear = gearContent.tree;
      // Get starting gear for class
      const equipped = {
        weapon: baseGear.weapon[classKey][0] ? `weapon_${classKey}_0` : 'weapon_base_0',
        armor: baseGear.armor[classKey][1] ? `armor_${classKey}_1` : 'armor_base_0',
        head: baseGear.head[classKey][1] ? `head_${classKey}_1` : 'head_base_0',
        shield: (classKey === 'wizard') ? 'shield_base_0' : (baseGear.shield[classKey][1] ? `shield_${classKey}_1` : 'shield_base_0'),
        body: 'body_base_0',
        back: 'back_base_0',
        headAccessory: 'headAccessory_base_0',
        eyewear: 'eyewear_base_0',
      };
      return {
        stats: {
          class: this.selectedClass,
          hp: 50,
          mp: 30,
          lvl: 1,
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
          skin: this.characterAppearance.skin,
          hair: this.characterAppearance.hair,
          size: this.characterAppearance.size,
          shirt: this.characterAppearance.shirt,
          background: 'violet',
          chair: 'none',
          sleep: false,
        },
        items: {
          currentMount: '',
          currentPet: '',
          gear: {
            equipped,
            costume: {},
          },
        },
      };
    },
    // Skin options (mirroring original body-settings pattern)
    userSkins() {
      return this.mapKeysToFreeOption(Object.keys(appearance.skin), 'skin', null);
    },
    // Size options
    sizes() {
      return this.mapKeysToFreeOption(Object.keys(appearance.size), 'size', null);
    },
    // Shirt options
    userShirts() {
      return this.mapKeysToFreeOption(Object.keys(appearance.shirt), 'shirt', null);
    },
    // Hair color options
    userHairColors() {
      return this.mapKeysToFreeOption(Object.keys(appearance.hair.color), 'hair', 'color');
    },
    // Hair bangs options
    hairBangs() {
      return this.mapKeysToFreeOption(Object.keys(appearance.hair.bangs), 'hair', 'bangs');
    },
    // Hair style options
    userHairStyles() {
      return this.mapKeysToFreeOption(Object.keys(appearance.hair.base), 'hair', 'base');
    },
  },
  mounted() {
    // Ensure modal is shown when component mounts
    this.$nextTick(() => {
      this.showModal = true;
      // Also try to show the modal programmatically
      this.$bvModal.show('create-character-modal');
    });
  },
  methods: {
    // Helper method to map keys to option objects (similar to avatarEditorUtilities)
    mapKeysToFreeOption(keys, type, subType) {
      return keys.map(key => {
        const appearanceData = subType
          ? appearance[type][subType][key]
          : appearance[type][key];

        const imageName = this.createImageName(type, subType, key);
        
        return {
          key,
          imageName,
          text: appearanceData.text ? appearanceData.text() : key,
          click: () => {
            // Handle nested hair properties
            if (type === 'hair' && subType) {
              this.characterAppearance.hair[subType] = key;
            } 
            // Handle top-level properties (skin, size, shirt)
            else {
              this.characterAppearance[type] = key;
            }
          },
        };
      });
    },
    createImageName(type, subType, key) {
      // Generate image name similar to avatarEditorUtilities
      if (type === 'skin') {
        return `skin_${key}`;
      }
      if (type === 'size') {
        return `${key}_shirt_${this.characterAppearance.shirt}`;
      }
      if (type === 'shirt') {
        return `${this.characterAppearance.size}_shirt_${key}`;
      }
      if (type === 'hair') {
        if (subType === 'color') {
          return `hair_bangs_${this.characterAppearance.hair.bangs}_${key}`;
        }
        if (subType === 'base') {
          return `hair_base_${key}_${this.characterAppearance.hair.color}`;
        }
        if (subType === 'bangs') {
          return `hair_bangs_${key}_${this.characterAppearance.hair.color}`;
        }
      }
      return key;
    },
    changeTopPage(page, subPage) {
      this.activeTopPage = page;
      this.activeSubPage = subPage;
    },
    changeSubPage(subPage) {
      this.activeSubPage = subPage;
    },
  async handleCreateCharacter() {
      // Validate character name
      if (!this.characterName.trim()) {
        this.showNameError = true;
        this.$root.$emit("habitica::show-toast", {
          text: this.$t("pleaseEnterCharacterName"),
          type: "error",
        });
        return;
      }

      // Validate name length
      if (this.characterName.trim().length > 50) {
        this.showNameError = true;
        this.$root.$emit("habitica::show-toast", {
          text: this.$t("characterNameTooLong"),
          type: "error",
        });
        return;
      }

      try {
        // Assign starting gear for created character
        // Map 'mage' to 'wizard' for gear system
        const classKey = this.selectedClass === 'mage' ? 'wizard' : this.selectedClass;
        const baseGear = gearContent.tree;
        const equipped = {
          weapon: baseGear.weapon[classKey][0] ? `weapon_${classKey}_0` : 'weapon_base_0',
          armor: baseGear.armor[classKey][1] ? `armor_${classKey}_1` : 'armor_base_0',
          head: baseGear.head[classKey][1] ? `head_${classKey}_1` : 'head_base_0',
          shield: (classKey === 'wizard') ? 'shield_base_0' : (baseGear.shield[classKey][1] ? `shield_${classKey}_1` : 'shield_base_0'),
          body: 'body_base_0',
          back: 'back_base_0',
          headAccessory: 'headAccessory_base_0',
          eyewear: 'eyewear_base_0',
        };
        const character = await this.$store.dispatch(
          "adventures:createCharacter",
          {
            adventureId: this.adventureId,
            name: this.characterName.trim(),
            class: this.selectedClass,
            preferences: this.characterAppearance,
            gear: {
              equipped,
              costume: {},
            },
          }
        );

        this.$root.$emit("habitica::show-toast", {
          text: this.$t("characterCreatedSuccess"),
          type: "success",
        });

        // Refresh adventure characters to update party header
        await this.$store.dispatch("adventures:getAdventureCharacters", this.adventureId);

        this.$emit("character-created", character);
        this.showModal = false;
      } catch (error) {
        this.$root.$emit("habitica::show-toast", {
          text:
            error.response?.data?.message || this.$t("errorCreatingCharacter"),
          type: "error",
        });
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/assets/scss/colors.scss';

.character-creation-form {
  padding: 0.5rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: block;
}

.required-indicator {
  color: #e74c3c;
  margin-left: 0.25rem;
  font-weight: bold;
}

.is-invalid {
  border-color: #e74c3c !important;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23e74c3c'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23e74c3c' stroke='none'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;

/* Appearance Section */
.appearance-section {
  margin-top: 2rem;
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

/* Customization Container */
.customization-container {
  display: flex;
  flex-direction: column;
}

/* Avatar Preview (centered) */
.avatar-preview {
  background: linear-gradient(135deg, $purple-50 0%, $purple-100 100%);
  border-radius: 8px;
  padding: 2rem;
  margin: 0 auto 1.5rem auto;
  width: fit-content;
}

/* Avatar Preview Section */
.avatar-section {
  margin-bottom: 30px;
}

.user-creation-bg {
  background-image: url('~@/assets/creator/creator-hills-bg.png');
  height: 105px;
  width: 219px;
  margin: 0 auto;
}

.avatar {
  cursor: auto;

  &.new-user {
    padding-top: 0px;
    padding-left: 30px;
  }
}

.customize-menu {
  .menu-container {
    color: $gray-100;
    
    .svg-icon {
      color: inherit;
    }
  }

  .menu-container:hover, .menu-container.active {
    color: $purple-300;
    
    .svg-icon {
      color: inherit;
    }
  }

  .indicator {
    display: none;
  }

  .menu-container.active .indicator {
    width: 0px;
    height: 0px;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid $gray-700;
    display: block;
    margin: 0 auto;
  }
}

/* Customize Section */
.customize-section {
  padding: 2rem 0 1rem;
  text-align: center;
  background-color: #f9f9f9;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.invalid-feedback {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #e74c3c;
}

.class-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.class-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 0;
}

.class-card:hover {
  border-color: #7f48f4;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.class-card.selected {
  border-color: #7f48f4;
  background-color: #f8f5ff;
}

.class-card h4 {
  font-size: 1rem;
  margin: 0.5rem 0 0.25rem 0;
  text-transform: capitalize;
}

.class-card p {
  font-size: 0.75rem;
  margin: 0.25rem 0;
  line-height: 1.3;
  color: #666;
}

.class-icon {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 0.25rem;
}

.class-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.class-stats div {
  white-space: nowrap;
}

/* Responsive: Stack cards on smaller screens */
@media (max-width: 768px) {
  .class-options {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .class-options {
    grid-template-columns: 1fr;
  }
}
</style>
