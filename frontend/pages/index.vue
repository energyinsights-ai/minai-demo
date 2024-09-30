<template>
  <div class="container">
    <div class="content">
      <div class="map-container">
        <BasinMap />
      </div>
      <div class="right-panel">
        <div class="radius-selector">
          <label for="radius-slider">Radius: {{ basinStore.radius }} miles</label>
          <input
            id="radius-slider"
            type="range"
            min="2"
            max="10"
            step="1"
            v-model.number="basinStore.radius"
            @change="handleRadiusChange"
          />
        </div>
        <div class="charts-container">
          <div class="chart-wrapper">
            <AverageFootageChart />
          </div>
          <div class="chart-wrapper">
            <SelectedSectionChart />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBasinStore } from '~/stores/basinStore';
import BasinMap from '~/components/BasinMap.vue';
import AverageFootageChart from '~/components/AverageFootageChart.vue';
import SelectedSectionChart from '~/components/SelectedSectionChart.vue';

const basinStore = useBasinStore();

const handleRadiusChange = () => {
  basinStore.setRadius(basinStore.radius);
};
</script>

<style scoped>
.container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.content {
  display: flex;
  height: 100%;
  width: 100%;
}

.map-container {
  width: 50%;
  height: 100%;
  display: flex;  /* Add this line */
}

.right-panel {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}

.radius-selector {
  margin-bottom: 20px;
}

.radius-selector label {
  display: block;
  margin-bottom: 5px;
}

.radius-selector input {
  width: 100%;
}

.charts-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-wrapper {
  flex: 1;
  margin-bottom: 20px;
}
</style>