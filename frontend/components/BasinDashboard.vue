<template>
  <div class="basin-dashboard">
    <div class="map-container">
      <BasinMap />
    </div>
    <div class="controls-container">
      <MapTuning />
      <OperatorBarChart v-if="!basinStore.selectedOperator || basinStore.selectedOperator.operator === 'All'" />
      <OperatorSpecificPlot v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBasinStore } from '@/stores/basinStore';
import BasinMap from './BasinMap.vue';
import MapTuning from './MapTuning.vue';
import OperatorBarChart from './OperatorBarChart.vue';
import OperatorSpecificPlot from './OperatorSpecificPlot.vue';

const basinStore = useBasinStore();
</script>

<style scoped>
.basin-dashboard {
  display: flex;
  height: 100vh;
  width: 100%;
}

.map-container {
  flex: 3;
  height: 100%;
}

.controls-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1rem;
}

:deep(.map-container) {
  height: 100%;
  width: 100%;
}

:deep(.map-tuning) {
  margin-bottom: 1rem;
}

:deep(.chart-container) {
  flex-grow: 1;
  min-height: 300px;
}
</style>