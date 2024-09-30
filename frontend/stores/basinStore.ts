import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRuntimeConfig } from '#app'

export const useBasinStore = defineStore('basin', () => {
  const trsGeoJSON = ref(null);
  const wellsGeoJSON = ref(null);
  const radius = ref(5);
  const config = useRuntimeConfig()

  const formationFootage = ref<{ [key: string]: number }>({});
  const selectedTRSFootage = ref<{ [key: string]: number }>({});
  const selectedSectionFootage = ref<{ [key: string]: { footage: number, well_count: number } }>({});

  const fetchTRSData = async () => {
    try {
      const url = `${config.public.flaskBaseUrl}/api/trs?radius=${radius.value}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw TRS data:', data);
      trsGeoJSON.value = data;
      calculateAverageFormationFootage(data);
      setSelectedTRSFootage(data);  // Make sure this line is present
      setSelectedSectionFootage(data);
    } catch (error) {
      console.error('Error fetching TRS data:', error);
      formationFootage.value = {};
      selectedTRSFootage.value = {};
      selectedSectionFootage.value = {};
    }
  };

  const calculateAverageFormationFootage = (data: any) => {
    if (!data || !data.features || data.features.length === 0) {
      console.error('No features in data');
      formationFootage.value = {};
      return;
    }

    const feature = data.features[0];
    const avgIntervalFootages = feature.properties?.avg_interval_footages || {};
    
    const footageByFormation: { [key: string]: number } = {};
    Object.entries(avgIntervalFootages).forEach(([interval, data]: [string, any]) => {
      footageByFormation[interval] = Number(data.footage);
    });

    console.log('Final average footage by formation:', footageByFormation);
    formationFootage.value = footageByFormation;
  };

  const setSelectedTRSFootage = (data: any) => {
    const selectedTRS = data.features.find((f: any) => f.properties.trs === '14-04N-65W');
    if (selectedTRS) {
      const footages = selectedTRS.properties.interval_footages || {};
      selectedTRSFootage.value = Object.entries(footages).reduce((acc, [interval, data]: [string, any]) => {
        acc[interval] = Number(data.footage);
        return acc;
      }, {} as { [key: string]: number });
    } else {
      console.warn('Selected TRS not found');
      selectedTRSFootage.value = {};
    }
    console.log('Final selected TRS footage:', selectedTRSFootage.value);
  };

  const setSelectedSectionFootage = (data: any) => {
    const selectedSection = data.features.find((f: any) => f.properties.trs === '14-04N-65W');
    if (selectedSection) {
      const footages = selectedSection.properties.interval_footages || {};
      selectedSectionFootage.value = Object.entries(footages).reduce((acc, [interval, data]: [string, any]) => {
        acc[interval] = {
          footage: Number(data.footage),
          well_count: Number(data.well_count)
        };
        return acc;
      }, {} as { [key: string]: { footage: number, well_count: number } });
    } else {
      console.warn('Selected section not found');
      selectedSectionFootage.value = {};
    }
    console.log('Final selected section footage:', selectedSectionFootage.value);
  };

  const fetchWellsData = async () => {
    try {
      const url = `${config.public.flaskBaseUrl}/api/wells?radius=${radius.value}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      wellsGeoJSON.value = data;
    } catch (error) {
      console.error('Error fetching Wells data:', error);
    }
  };

  const setRadius = async (value: number) => {
    radius.value = value;
    await Promise.all([fetchTRSData(), fetchWellsData()]);
  };

  const averageFootageChartData = computed(() => ({
    labels: Object.keys(formationFootage.value),
    datasets: [{
      label: 'Average Footage by Formation',
      data: Object.values(formationFootage.value),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  }));

  const selectedFormationChartData = computed(() => ({
    labels: Object.keys(selectedTRSFootage.value),
    datasets: [{
      label: 'Total Footage by Interval for Selected Formation',
      data: Object.values(selectedTRSFootage.value),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  }));

  const selectedSectionChartData = computed(() => {
    const labels = Array.from(new Set([...Object.keys(formationFootage.value), ...Object.keys(selectedSectionFootage.value)]));
    
    const differences = labels.map(label => {
      const selectedWellCount = selectedSectionFootage.value[label]?.well_count || 0;
      const avgFootage = formationFootage.value[label] || 0;
      const avgWellCount = avgFootage / 5000;
      
      let diff: number;
      if (selectedSectionFootage.value[label]) {
        diff = selectedWellCount - avgWellCount;
      } else {
        // If the section doesn't have this formation, use the average footage
        diff = avgWellCount;
      }
      
      // Apply the rounding rules
      if (diff < 0) {
        diff = 0;
      } else if (diff < 0.5) {
        diff = 0;
      } else {
        diff = Math.round(diff);
      }
      
      return diff;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Additional Wells Needed',
          data: differences,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
  });

  return {
    trsGeoJSON,
    wellsGeoJSON,
    radius,
    formationFootage,
    selectedTRSFootage,
    selectedSectionFootage,
    fetchTRSData,
    fetchWellsData,
    setRadius,
    averageFootageChartData,
    selectedFormationChartData,
    selectedSectionChartData,  // Add this line back
  };
});