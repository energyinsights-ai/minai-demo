<template>
  <div class="chart-container">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { useBasinStore } from '~/stores/basinStore';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const basinStore = useBasinStore();

const chartData = computed(() => ({
  labels: Object.keys(basinStore.formationFootage),
  datasets: [
    {
      label: 'Average Footage by Formation',
      data: Object.values(basinStore.formationFootage),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};
</script>

<style scoped>
.chart-container {
  height: 300px;
}
</style>