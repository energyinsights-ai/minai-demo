<template>
  <div id="map" class="map-container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import { useBasinStore } from '@/stores/basinStore';
import rigIconImage from '/assets/rig.png';

const map = ref<L.Map | null>(null);
const basinStore = useBasinStore();
const markerLayer = ref<L.LayerGroup | null>(null);
const wellLayer = ref<L.GeoJSON | null>(null);

const rigIcon = L.icon({
  iconUrl: rigIconImage,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const updateLayers = () => {
  if (map.value) {
    updateRigMarkers();
    updateWellLayer();
  } else {
    console.error('Map is not initialized');
  }
};

const updateRigMarkers = () => {
  if (markerLayer.value) {
    markerLayer.value.clearLayers();
  } else if (map.value) {
    markerLayer.value = L.layerGroup().addTo(map.value);
  }

  const markers = basinStore.visibleRigs.map(rig => {
    return L.marker([rig.lat_mean, rig.lon_mean], { icon: rigIcon })
      .bindTooltip(`
        <b>Rig ID:</b> ${rig.rig_id}<br>
        <b>Lease Name:</b> ${rig.lease_name}<br>
        <b>Operator:</b> ${rig.operator}<br>
        <b>First Date:</b> ${rig.first_date}<br>
        <b>Last Date:</b> ${rig.last_date}
      `, {
        permanent: false,
        direction: 'top',
        opacity: 0.9,
        className: 'rig-tooltip'
      });
  });

  if (markerLayer.value) {
    L.featureGroup(markers).addTo(markerLayer.value);
  }
};

const updateWellLayer = () => {
  if (wellLayer.value) {
    map.value?.removeLayer(wellLayer.value);
    wellLayer.value = null;
  }

  if (basinStore.selectedOperator.operator !== 'All' && basinStore.visibleWells.length > 0) {
    wellLayer.value = L.geoJSON({
      type: "FeatureCollection",
      features: basinStore.visibleWells
    }, {
      style: (feature) => ({
        color: feature.properties.color || 'blue', // Use the color from the data list
        weight: 2,
        opacity: 0.6
      }),
      onEachFeature: (feature, layer) => {
        if (feature.geometry.type === 'LineString') {
          layer.bindTooltip(`
            <b>Well ID:</b> ${feature.properties.well_name}<br>
            <b>Operator:</b> ${feature.properties.operator}<br>
            <b>Permit Approved Date:</b> ${feature.properties.permit_approved_date}<br>
            <b>Spud Date:</b> ${feature.properties.spud_date}
          `, {
            permanent: false,
            direction: 'top',
            opacity: 0.9,
            className: 'well-tooltip'
          });
        }
      }
    }).addTo(map.value!);
  }
};

onMounted(async () => {
  // Initialize the map
  map.value = L.map('map');

  // Add OpenStreetMap tile layer
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/en-us/home">Esri</a>',
  }).addTo(map.value);

  // Fetch GeoJSON data from the backend
  await Promise.all([
    basinStore.fetchGeoJson(),
    basinStore.fetchRigs(),
    basinStore.fetchWells()
  ]);

  if (basinStore.geoJson) {
    // Add GeoJSON layer to the map
    const geoJsonLayer = L.geoJSON(basinStore.geoJson, {
      style: {
        color: 'lightgray',
        weight: 2,
        fillOpacity: 0.5
      }
    }).addTo(map.value);

    // Center the map on the GeoJSON layer
    map.value.fitBounds(geoJsonLayer.getBounds());
  }

  updateLayers();
});

watch(() => basinStore.selectedOperator, updateLayers);
watch(() => basinStore.currentDate, updateLayers);
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>

<style>
@import 'leaflet/dist/leaflet.css';

.rig-tooltip, .well-tooltip {
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ccc;
  padding: 5px;
  font-size: 12px;
}
</style>