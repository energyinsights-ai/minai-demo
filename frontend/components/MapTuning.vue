<template>
  <div class="map-tuning">
    <h2>Map Controls</h2>
    <Dropdown 
      v-model="basinStore.selectedOperator" 
      :options="basinStore.operators" 
      optionLabel="operator" 
      placeholder="Select an Operator" 
      class="w-full md:w-14rem"
      @change="onOperatorChange"
    />
    <p>Total Rigs: {{ basinStore.rigs.length }}</p>
    <p>Filtered Rigs: {{ basinStore.filteredRigs.length }}</p>
    <p>
      Selected Operator: 
      <span :title="basinStore.selectedOperator?.operator || 'All operators'">
        {{ basinStore.selectedOperator?.operator || 'All' }}
      </span>
    </p>
    <div class="animation-controls">
      <Button @click="toggleAnimation" :label="isAnimating ? 'Pause' : 'Play'" />
      <input type="date" v-model="basinStore.currentDate" :min="basinStore.minDate" :max="basinStore.maxDate" @input="onDateChange">
      <span>{{ basinStore.currentDate }}</span>
    </div>
    <div>Progress: {{ animationProgress }}%</div>
    <div>Visible Rigs: {{ basinStore.visibleRigs.length }}</div>
    <div>Current Date: {{ basinStore.currentDate }}</div>
    <div>Max Date: {{ basinStore.maxDate }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useBasinStore } from '@/stores/basinStore';
import Dropdown from 'primevue/dropdown';

const basinStore = useBasinStore();
const isAnimating = ref(false);
let animationInterval: number | null = null;

const onOperatorChange = (event: any) => {
  basinStore.setSelectedOperator(event.value);
};

const onDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  basinStore.setCurrentDate(target.value);
};

const animationProgress = computed(() => {
  const start = new Date(basinStore.minDate).getTime();
  const end = new Date(basinStore.maxDate).getTime();
  const current = new Date(basinStore.currentDate).getTime();
  return Math.round(((current - start) / (end - start)) * 100);
});

const animateRigs = () => {
  animationInterval = setInterval(() => {
    try {
      const currentDate = new Date(basinStore.currentDate);
      const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Add one day in milliseconds
      
      if (nextDate <= new Date(basinStore.maxDate)) {
        basinStore.setCurrentDate(nextDate.toISOString().split('T')[0]);
      } else {
        isAnimating.value = false;
        clearInterval(animationInterval!);
      }
    } catch (error) {
      isAnimating.value = false;
      clearInterval(animationInterval!);
    }
  }, 100);
};

const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value;
  if (isAnimating.value) {
    animateRigs();
  } else if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
};

onMounted(() => {
  if (basinStore.minDate) {
    basinStore.setCurrentDate(basinStore.minDate);
  }
});
</script>

<style scoped>
.map-tuning {
  padding: 1rem;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  margin-bottom: 1rem;
}

span[title] {
  cursor: help;
  border-bottom: 1px dotted #888;
}

.animation-controls {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>