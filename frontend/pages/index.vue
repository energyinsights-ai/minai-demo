<template>
  <div class="h-screen w-full overflow-hidden border border-red-500">
    <div class="flex h-full w-full">
      <div class="w-1/2 h-full flex">
        <BasinMap />
      </div>
      <div class="w-1/2 h-full flex flex-col p-5">
        <div class="mb-5">
          <label for="radius-slider" class="block mb-1">Radius: {{ basinStore.radius }} miles</label>
          <input
            id="radius-slider"
            type="range"
            min="2"
            max="10"
            step="1"
            v-model.number="basinStore.radius"
            @change="handleRadiusChange"
            class="w-full"
          />
        </div>
        <div class="flex-1 flex flex-col">
          <div class="flex-1 mb-5">
            <AverageFootageChart />
          </div>
          <div class="flex-1">
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