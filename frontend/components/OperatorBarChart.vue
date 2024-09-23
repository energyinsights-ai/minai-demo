<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useBasinStore } from '@/stores/basinStore';

Chart.register(...registerables);

const chartCanvas = ref<HTMLCanvasElement | null>(null);
const basinStore = useBasinStore();
let chart: Chart | null = null;

const createChart = () => {
  if (!chartCanvas.value) {
    console.error('Chart canvas not found');
    return;
  }

  const data = {
    labels: [],
    datasets: [{
      label: 'Rig Count',
      data: [],
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  const config = {
    type: 'bar' as const,
    data: data,
    options: {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Operator Rig Counts'
        }
      },
      animation: {
        duration: 500
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            callback: function(value: number) {
              if (Math.floor(value) === value) {
                return value;
              }
            }
          }
        }
      }
    }
  };

  chart = new Chart(chartCanvas.value, config);
};

const updateChartData = () => {
  if (!chart) return;

  const operatorCounts = basinStore.operators
    .filter(op => op.operator !== 'All')
    .map(op => ({
      operator: op.operator,
      count: basinStore.visibleRigs.filter(rig => rig.operator === op.operator).length
    }))
    .sort((a, b) => b.count - a.count);

  chart.data.labels = operatorCounts.map(op => op.operator);
  chart.data.datasets[0].data = operatorCounts.map(op => op.count);

  chart.update();
};

onMounted(() => {
  createChart();
  updateChartData();
});

watch(() => basinStore.visibleRigs, updateChartData, { deep: true });
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
}
</style>