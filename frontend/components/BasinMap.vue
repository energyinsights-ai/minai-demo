<template>
  <div class="basin-map">
    <client-only>
      <l-map ref="map" :zoom="zoom" :center="center" @ready="onMapReady">
        <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
        <l-geo-json v-if="basinStore.trsGeoJSON" :geojson="basinStore.trsGeoJSON" :options="trsGeoJsonOptions"></l-geo-json>
        <l-geo-json v-if="basinStore.wellsGeoJSON" :geojson="basinStore.wellsGeoJSON" :options="wellsGeoJsonOptions" :pane="'wellsPane'"></l-geo-json>
      </l-map>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useBasinStore } from '~/stores/basinStore';
import type { LatLngTuple } from 'leaflet';
import L from 'leaflet';

const basinStore = useBasinStore();
const map = ref<L.Map | null>(null);
const zoom = ref(10);
const center = ref<[number, number]>([40.5853, -104.8686]);
const url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const trsGeoJsonOptions = {
  onEachFeature: (feature: any, layer: L.Layer) => {
    const trs = feature.properties.trs || feature.properties.TRS || 'N/A';
    const totalWellFootage = feature.properties.total_well_footage || 0;
    const intervalFootages = feature.properties.interval_footages || {};
    const avgIntervalFootages = feature.properties.avg_interval_footages || {};
    const color = trs === '14-04N-65W' ? '#0000FF' : '#D3D3D3';

    if (layer instanceof L.Path) {
      layer.setStyle({
        fillColor: color,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7,
        dashArray: '3'
      });
    }

    let popupContent = `<b>TRS: ${trs}</b><br>Total Well Footage: ${totalWellFootage.toFixed(2)} feet<br><br>Footage by Interval:`;
    for (const [interval, data] of Object.entries(intervalFootages)) {
      if (typeof data === 'object' && data !== null) {
        const footage = (data as any).footage || 0;
        const wellCount = (data as any).well_count || 0;
        popupContent += `<br>${interval}: ${footage.toFixed(2)} feet (${wellCount.toFixed(0)} wells)`;
      }
    }

    popupContent += '<br><br>Average Footage by Interval:';
    for (const [interval, data] of Object.entries(avgIntervalFootages)) {
      if (typeof data === 'object' && data !== null) {
        const avgFootage = (data as any).footage || 0;
        const avgWellCount = (data as any).well_count || 0;
        popupContent += `<br>${interval}: ${avgFootage.toFixed(2)} feet (${avgWellCount.toFixed(2)} wells)`;
      }
    }

    layer.bindPopup(popupContent);
  }
};

const wellsGeoJsonOptions = {
  onEachFeature: (feature: any, layer: L.Layer) => {
    const operator = feature.properties.operator || 'Unknown';
    const wellStatus = feature.properties.well_status || 'Unknown';
    const color = wellStatus === 'PRODUCING' ? '#00FF00' : '#808080';

    if (layer instanceof L.Path) {
      layer.setStyle({
        color: color,
        weight: 3,
        opacity: 1
      });
    }

    layer.bindTooltip(`Operator: ${operator}<br>Status: ${wellStatus}`, {
      permanent: false,
      direction: 'top',
      pane: 'tooltipPane'
    });
    layer.bindPopup(`Operator: ${operator}<br>Status: ${wellStatus}`);
  },
  pane: 'wellsPane'
};

const onMapReady = (mapInstance: L.Map) => {
  map.value = mapInstance;
  // Create a new pane for wells
  map.value.createPane('wellsPane');
  map.value.getPane('wellsPane')!.style.zIndex = '450';
  
  // Create a new pane for tooltips
  map.value.createPane('tooltipPane');
  map.value.getPane('tooltipPane')!.style.zIndex = '700';
  
  basinStore.fetchTRSData();
  basinStore.fetchWellsData();
};

const centerMapOnLayers = () => {
  if (map.value && (basinStore.trsGeoJSON || basinStore.wellsGeoJSON)) {
    const bounds = L.latLngBounds([]);
    if (basinStore.trsGeoJSON) {
      bounds.extend(L.geoJSON(basinStore.trsGeoJSON).getBounds());
    }
    if (basinStore.wellsGeoJSON) {
      bounds.extend(L.geoJSON(basinStore.wellsGeoJSON).getBounds());
    }
    if (bounds.isValid()) {
      map.value.fitBounds(bounds);
    }
  }
};

onMounted(() => {
  basinStore.fetchTRSData();
  basinStore.fetchWellsData();
});

watch([() => basinStore.trsGeoJSON, () => basinStore.wellsGeoJSON], () => {
  centerMapOnLayers();
}, { deep: true });
</script>

<style scoped>
.basin-map {
  width: 100%;
  height: 100%;
}
</style>