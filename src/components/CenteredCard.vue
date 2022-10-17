<template>
  <div class="row items-center justify-evenly">
    <q-card class="q-pa-lg q-ma-lg fullpage-card full-width">
      <q-card-section>
        <slot />
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped lang="sass">
.fullpage-card
  max-width: 800px
</style>
