import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import L from 'leaflet';

// Remove the Papa import
// import Papa from 'papaparse';

interface Rig {
  rig_id: string;
  lease_name: string;
  first_date: string;
  last_date: string;
  lat_mean: number;
  lon_mean: number;
  api_lst: string;
  operator: string;
}

export const useBasinStore = defineStore('basin', () => {
  const geoJson = ref<any | null>(null);
  const rigs = ref<Rig[]>([]);
  const selectedOperator = ref({ operator: 'All' });
  const config = useRuntimeConfig();
  const wells = ref<any | null>(null);
  const filteredWellsByOperator = ref<any[]>([]);
  const allData = ref<any[]>([]);

  const fetchGeoJson = async () => {
    const url = `${config.public.flaskBaseUrl}/api/geojson`;
    const { data } = await useFetch(url);
    geoJson.value = data.value;
  };

  const fetchRigs = async () => {
    const url = `${config.public.flaskBaseUrl}/api/get_rigs`;
    const { data } = await useFetch<Rig[]>(url);
    rigs.value = data.value || [];
  };

  const fetchWells = async() => {
    const url = `${config.public.flaskBaseUrl}/api/get_wells`;
    const { data } = await useFetch(url);
    wells.value = data.value || [];
  }

  const fetchAllData = async () => {
    const url = `${config.public.flaskBaseUrl}/api/all_data`;
    const { data } = await useFetch<any[]>(url);
    allData.value = data.value || [];
  };

  const operators = computed(() => {
    const uniqueOperators = [...new Set(rigs.value.map(rig => rig.operator))];
    return [{ operator: 'All' }, ...uniqueOperators.map(operator => ({ operator }))];
  });

  const filteredRigs = computed(() => {
    if (!selectedOperator.value || selectedOperator.value.operator === 'All') {
      return rigs.value;
    }
    return rigs.value.filter(rig => rig.operator === selectedOperator.value.operator);
  });

  const setSelectedOperator = (operator: string | { operator: string }) => {
    if (typeof operator === 'string') {
      selectedOperator.value = operator === 'All' ? { operator: 'All' } : { operator };
    } else {
      selectedOperator.value = operator;
    }
    filterWellsByOperator();
    resetTuning();
  };

  const filterWellsByOperator = () => {
    if (selectedOperator.value.operator === 'All') {
      filteredWellsByOperator.value = wells.value.features;
    } else {
      filteredWellsByOperator.value = wells.value.features.filter((well: any) => well.properties.operator === selectedOperator.value.operator);
    }
  };

  const minDate = computed(() => {
    const dates = filteredRigs.value.map(rig => rig.first_date);
    if (filteredWellsByOperator.value.length > 0) {
      dates.push(...filteredWellsByOperator.value.map(well => well.properties.permit_approved_date));
    }
    const minDate = dates.reduce((min, date) => date < min ? date : min, dates[0] || '');
    return minDate < '2022-01-01' ? '2022-01-01' : minDate;
  });

  const maxDate = computed(() => {
    const dates = filteredRigs.value.map(rig => rig.last_date);
    if (filteredWellsByOperator.value.length > 0) {
      dates.push(...filteredWellsByOperator.value.map(well => well.properties.spud_date));
    }
    return dates.reduce((max, date) => date > max ? date : max, dates[0] || '');
  });

  const currentDate = ref('');

  const setCurrentDate = (date: string) => {
    const newDate = new Date(date);
    currentDate.value = newDate.toISOString().split('T')[0];
  };

  const resetTuning = () => {
    setCurrentDate(minDate.value);
  };

  watch(rigs, (newRigs) => {
    if (newRigs.length > 0 && !currentDate.value) {
      setCurrentDate(minDate.value);
    }
  });

  const visibleRigs = computed(() => {
    return filteredRigs.value.filter(rig => 
      rig.first_date <= currentDate.value && rig.last_date >= currentDate.value
    );
  });

  const visibleWells = computed(() => {
    if (selectedOperator.value.operator === 'All') {
      return [];
    }
    const current = new Date(currentDate.value);
    const currentMonth = current.getMonth();
    const currentYear = current.getFullYear();
    const filteredWells = filteredWellsByOperator.value.filter(well => {
      return well.properties.data.some((entry: any) => {
        const timestamp = new Date(entry.timestamp);
        return timestamp.getMonth() === currentMonth && timestamp.getFullYear() === currentYear;
      });
    }).map(well => {
      const colorEntry = well.properties.data.find((entry: any) => {
        const timestamp = new Date(entry.timestamp);
        return timestamp.getMonth() === currentMonth && timestamp.getFullYear() === currentYear;
      });
      return {
        ...well,
        properties: {
          ...well.properties,
          color: colorEntry ? colorEntry.color : 'gray' // Default color if no match found
        }
      };
    });
    return filteredWells;
  });

  const createMarkers = () => {
    return visibleRigs.value.map(rig => {
      const marker = L.marker([rig.lat_mean, rig.lon_mean]);
      marker.bindTooltip(rig.operator, {
        permanent: false,
        direction: 'top',
        opacity: 0.7
      });
      return marker;
    });
  };

  const filteredAllData = computed(() => {
    if (selectedOperator.value.operator === 'All') {
      return allData.value;
    }
    return allData.value.filter(item => item.operator === selectedOperator.value.operator);
  });

  const plotData = computed(() => {
    const currentTimestamp = new Date(currentDate.value).getTime();
    return filteredAllData.value.filter(item => new Date(item.timestamp).getTime() <= currentTimestamp);
  });

  return {
    geoJson,
    rigs,
    operators,
    selectedOperator,
    filteredRigs,
    fetchGeoJson,
    fetchRigs,
    setSelectedOperator,
    minDate,
    maxDate,
    currentDate,
    setCurrentDate,
    visibleRigs,
    createMarkers,
    fetchWells,
    wells,
    visibleWells,
    allData,
    fetchAllData,
    filteredAllData,
    plotData
  };
});