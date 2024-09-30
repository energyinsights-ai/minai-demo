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

const chartData = computed(() => {
  const data = basinStore.selectedSectionChartData;
  // Change the backgroundColor and borderColor to gray
  data.datasets[0].backgroundColor = 'rgba(128, 128, 128, 0.6)';
  data.datasets[0].borderColor = 'rgba(128, 128, 128, 1)';
  return data;
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Additional Wells Needed by Formation'
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = context.parsed.y;
          return value > 0 ? `${value} additional wells needed` : 'No additional wells needed';
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Additional Wells Needed'
      },
      ticks: {
        stepSize: 1
      }
    }
  }
};
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
}
</style>