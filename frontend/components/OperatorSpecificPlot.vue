<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Chart, registerables } from 'chart.js';
import type { ChartConfiguration } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import { useBasinStore } from '@/stores/basinStore';

Chart.register(...registerables);

const chartCanvas = ref<HTMLCanvasElement | null>(null);
const basinStore = useBasinStore();
let chart: Chart | null = null;

const firstOfMonth = computed(() => {
  const date = new Date(basinStore.currentDate);
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
});

const createChart = () => {
  if (!chartCanvas.value) return;

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  const data = basinStore.plotData;
  const withRigs = data.filter(item => item.rig_presence === 'With Rigs');
  const noRigs = data.filter(item => item.rig_presence === 'No Rigs');

  const chartConfig: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'With Rigs',
          data: withRigs.map(item => ({ x: new Date(item.timestamp).getTime(), y: item.median_days_to_spud })),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'No Rigs',
          data: noRigs.map(item => ({ x: new Date(item.timestamp).getTime(), y: item.median_days_to_spud })),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'month'
          },
          adapters: {
            date: {
              locale: enUS
            }
          },
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Median Days to Spud'
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: true
        },
        title: {
          display: true,
          text: 'Median Days to Spud'
        }
      }
    }
  };

  chart = new Chart(ctx, chartConfig);
};

const updateChart = () => {
  if (!chart) {
    createChart();
    return;
  }

  const data = basinStore.plotData;
  const withRigs = data.filter(item => item.rig_presence === 'With Rigs');
  const noRigs = data.filter(item => item.rig_presence === 'No Rigs');

  chart.data.datasets[0].data = withRigs.map(item => ({ x: new Date(item.timestamp).getTime(), y: item.median_days_to_spud }));
  chart.data.datasets[1].data = noRigs.map(item => ({ x: new Date(item.timestamp).getTime(), y: item.median_days_to_spud }));
  chart.update();
};

onMounted(async () => {
  await basinStore.fetchAllData();
  createChart();
});

watch(() => basinStore.selectedOperator, updateChart);
watch(firstOfMonth, updateChart);
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>