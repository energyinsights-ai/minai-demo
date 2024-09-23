<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useBasinStore } from '@/stores/basinStore';

Chart.register(...registerables);

const chartCanvas = ref<HTMLCanvasElement | null>(null);
const basinStore = useBasinStore();
let chart: Chart | null = null;

const processWellData = () => {
  console.log('Processing well data...');
  console.log('Visible wells:', basinStore.visibleWells.length);

  const startDate = '2022-01';
  const currentDate = basinStore.currentDate.slice(0, 7);

  const timestamps = [];
  let date = new Date(startDate);
  const endDate = new Date(currentDate);

  while (date <= endDate) {
    timestamps.push(date.toISOString().slice(0, 7));
    date.setMonth(date.getMonth() + 1);
  }

  console.log('Timestamps:', timestamps);

  const medianTimeToSpud = timestamps.map(timestamp => {
    const wellsAtTimestamp = basinStore.visibleWells.filter(well => 
      well.properties.data.some((entry: any) => entry.timestamp.startsWith(timestamp))
    );

    console.log(`Wells at timestamp ${timestamp}:`, wellsAtTimestamp.length);

    const withRigs = wellsAtTimestamp.filter(well => {
      const entry = well.properties.data.find((entry: any) => entry.timestamp.startsWith(timestamp));
      return entry && entry.rig_density > 0;
    }).map(well => {
      const entry = well.properties.data.find((entry: any) => entry.timestamp.startsWith(timestamp));
      return entry ? entry.days_to_spud : null;
    }).filter((days): days is number => days !== null);

    const withoutRigs = wellsAtTimestamp.filter(well => {
      const entry = well.properties.data.find((entry: any) => entry.timestamp.startsWith(timestamp));
      return entry && entry.rig_density === 0;
    }).map(well => {
      const entry = well.properties.data.find((entry: any) => entry.timestamp.startsWith(timestamp));
      return entry ? entry.days_to_spud : null;
    }).filter((days): days is number => days !== null);

    console.log(`Wells with rigs: ${withRigs.length}, without rigs: ${withoutRigs.length}`);

    const calculateMedian = (arr: number[]) => {
      if (arr.length === 0) return null;
      const sorted = arr.slice().sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
    };

    const withRigsMedian = calculateMedian(withRigs);
    const withoutRigsMedian = calculateMedian(withoutRigs);

    console.log(`Median time to spud - With rigs: ${withRigsMedian}, Without rigs: ${withoutRigsMedian}`);

    return {
      timestamp,
      withRigs: withRigsMedian,
      withoutRigs: withoutRigsMedian,
    };
  });

  console.log('Processed data:', JSON.stringify(medianTimeToSpud, null, 2));
  return medianTimeToSpud;
};

const createChart = () => {
  if (!chartCanvas.value) {
    console.error('Chart canvas not found');
    return;
  }

  const data = processWellData();

  const config = {
    type: 'line' as const,
    data: {
      labels: data.map(d => d.timestamp),
      datasets: [
        {
          label: 'With Rigs',
          data: data.map(d => d.withRigs),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Without Rigs',
          data: data.map(d => d.withoutRigs),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true
        },
        title: {
          display: true,
          text: 'Median Time to Spud'
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Days to Spud'
          },
          beginAtZero: true,
        }
      }
    }
  };

  chart = new Chart(chartCanvas.value, config);
};

const updateChartData = () => {
  if (!chart) {
    console.warn('Chart not initialized, creating new chart');
    createChart();
    return;
  }

  const newData = processWellData();
  const currentDate = basinStore.currentDate.slice(0, 7);
  const visibleData = newData.filter(d => d.timestamp <= currentDate);

  chart.data.labels = visibleData.map(d => d.timestamp);
  chart.data.datasets[0].data = visibleData.map(d => d.withRigs);
  chart.data.datasets[1].data = visibleData.map(d => d.withoutRigs);

  chart.update();
};

onMounted(() => {
  createChart();
});

watch(() => basinStore.selectedOperator, () => {
  console.log('Selected operator changed');
  if (chart) {
    chart.destroy();
  }
  createChart();
});

watch(() => basinStore.currentDate, () => {
  console.log('Current date changed');
  updateChartData();
});

watch(() => basinStore.visibleWells, () => {
  console.log('Visible wells changed');
  updateChartData();
}, { deep: true });
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