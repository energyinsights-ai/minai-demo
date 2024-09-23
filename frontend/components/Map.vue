<template>
  <div id="map" ref="mapContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';
import { useBasinStore } from '@/stores/basinStore';

const mapContainer = ref(null);
const map = ref(null);
const basinStore = useBasinStore();
let markerLayer = null;

onMounted(() => {
  map.value = L.map(mapContainer.value).setView([31.7, -102.5], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value);
  updateMarkers();
});

const updateMarkers = () => {
  if (markerLayer) {
    map.value.removeLayer(markerLayer);
  }
  const markers = basinStore.createMarkers();
  markerLayer = L.layerGroup(markers).addTo(map.value);
};

watch(() => basinStore.filteredRigs, updateMarkers, { deep: true });
</script>

<style scoped>
#map {
  height: 400px;
  width: 100%;
}
</style>