<template>
  <router-view v-if="widgetData" v-bind="widgetData" />
  <p v-else>
    Unable to read config data. Did you make sure to paste the provided URL in its entirety?
  </p>
</template>

<script setup lang="ts">
import JSONCrush from 'jsoncrush';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
const widgetData = ref(null as object | null);
const route = useRoute();

onMounted(() => {
  if (route.query.cf) {
    try {
      widgetData.value = JSON.parse(JSONCrush.uncrush(route.query.cf.toString()));
    } catch (e) {
      widgetData.value = null;
    }
  }
});
</script>
