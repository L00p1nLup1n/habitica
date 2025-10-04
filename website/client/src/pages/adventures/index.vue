<template>
  <div class="adventures-container">
    <router-view />
  </div>
</template>

<style lang="scss" scoped>
  @import '@/assets/scss/colors.scss';

  .adventures-container {
    min-height: 100vh;
    background-color: $gray-700;
  }
</style>

<script>
export default {
  name: 'AdventuresIndex',
  mounted () {
    this.$store.dispatch('common:setTitle', {
      section: 'Adventures',
    });
  },
};
</script>
