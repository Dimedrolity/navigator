<template>
  <q-page>
    <div class="top-input-container">
      <q-input v-model="findLocationInput" v-on:change="findLocation" placeholder="Поиск" value="" rounded standout
               bg-color="light-blue" color="white">
        <template v-slot:prepend>
          <q-avatar>
            <img src="../assets/marker-icon.svg" alt="marker">
          </q-avatar>
        </template>
      </q-input>
    </div>
    <div id="map" ref="map"></div>

    <q-btn v-if="this.currentLevelObject" @click="isLevelDialogOpen = true" round stack class="change-level" color="light-blue" text-color="white">
      <span class="number">{{ this.currentLevelObject.level }}</span>
      <span class="word">этаж</span>
    </q-btn>

    <q-dialog v-if="isLevelDialogOpen" v-model="isLevelDialogOpen">
      <q-card class="change-level__dialog text-center bg-light-blue text-white custom-text">
        <q-card-section class="row items-center q-pb-none">
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pb-none q-mb-xl">
          <span>Выбери этаж</span>
        </q-card-section>
        <q-card-section>
          <div v-for="level in levels" @click="setLevel(level); isLevelDialogOpen = false" class="level bg-green q-mb-md">{{ level.level }} этаж</div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-btn v-if="!isRoutePanelOpen" @click="isRoutePanelOpen = true" round color="light-blue" text-color="white" class="route">
      <q-img src="../assets/route.svg" alt="route"></q-img>
    </q-btn>

    <div v-if="isRoutePanelOpen" class="route-panel-container">
      <div class="route-panel">
        <q-input v-model="fromInput" placeholder="129" value="" bg-color="light-blue" color="white" class="input q-mb-md q-mr-none"/>

        <q-input v-model="toInput" placeholder="105" value="" bg-color="light-blue" color="white" class="input q-mb-md"/>
      </div>
      <q-btn @click="makeRoute" color="grey-10" text-color="white" class="done-button">Построить маршрут</q-btn>

      <q-btn @click="isRoutePanelOpen = false" class="hide-button" round color="light-blue" text-color="white">
        <q-img src="../assets/hide-route-panel.svg" alt="route"></q-img>
      </q-btn>
    </div>


  </q-page>
</template>

<script>
import L from 'leaflet/dist/leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import { colors } from 'quasar';
import {declOfNum} from 'src/utils';

let DefaultIcon = L.icon({
  iconUrl: icon,
  iconSize: [24, 36],
  iconAnchor: [12, 36]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default {
  name: 'PageMap',
  props: {
    buildingId: String,
    voiceMode: Boolean
  },
  data() {
    return {
      findLocationInput: null,
      map: null,
      mapWidth: null,
      mapHeight: null,

      levels: null,
      currentLevelObject: null,
      sizeMultiplier: 5,
      isLevelDialogOpen: false,
      isRoutePanelOpen: false,
      fromInput: null,
      toInput: null,

      leafletPolylineObject: null,
      currentMarkersObjects: []
    }
  },
  methods: {
    findLocation() {
      const locationLevel = this.levels.find(level => level.locations
        .find(location => location.title.includes(this.findLocationInput)));
      if (!locationLevel)
        return
      this.setLevel(locationLevel)

      const location = this.currentLevelObject.locations.find(location => location.title.includes(this.findLocationInput));
      if (location) {
        const leafletPoint = this.convertPixelToLeafletPoint(location.points.x1, location.points.y1);

        if (!this.currentLevelObject.markersPoints)
          this.currentLevelObject.markersPoints = []
        this.currentLevelObject.markersPoints.push(leafletPoint)

        this.addMarker(leafletPoint)

        this.map.setView([leafletPoint[0] + 10, leafletPoint[1]], this.map.getMaxZoom());
      }
    },
    updateMapImage() {
      const img = new Image();
      img.onload = () => {
        this.mapWidth = img.width * this.sizeMultiplier;
        this.mapHeight = img.height * this.sizeMultiplier;

        // calculate the edges of the image, in coordinate space
        const southWest = this.map.unproject([0, this.mapHeight], this.map.getMaxZoom() - 1);
        const northEast = this.map.unproject([this.mapWidth, 0], this.map.getMaxZoom() - 1);
        const bounds = new L.LatLngBounds(southWest, northEast);

        if (this.overlay) {
          this.map.removeLayer(this.overlay);
        }
        this.overlay = L.imageOverlay(img, bounds);
        this.overlay.addTo(this.map);

        // tell leaflet that the map is exactly as big as the image
        this.map.setMaxBounds(bounds);
      }
      img.src = require('../assets/' + this.buildingId + '/' + this.level + '.svg');
    },
    setLevel(level) {
      if (this.currentLevelObject !== level) {
        this.currentLevelObject = level;
      }
    },
    async makeRoute() {
      const apiUrl = 'http://194.87.232.192/navigator/api/';

      const locationFrom = this.allLocations.find(location => location.title
        .includes(this.fromInput)
        // .includes('127')
      );
      const locationTo = this.allLocations.find(location => location.title
        .includes(this.toInput)
        // .includes('111')
      );

      if (!locationFrom || !locationTo)
        alert('некорректный ввод');

      const response = await fetch(apiUrl + 'path?' + 'from=' + locationFrom.id + '&to='+ locationTo.id);

      if (response.ok) {
        const route = await response.json()

        if (this.voiceMode) {
          const text = this.calculateTextByPoints(route)
          TTS.speak({
              text: text,
              locale: 'ru-RU',
              rate: 1
            }, function () {}, function (reason) {
              alert(reason);
            });
        }

        const points = route.map(routeElement => {
          return this.convertPixelToLeafletPoint(routeElement.x, routeElement.y);
        });

        this.currentLevelObject.polylinePoints = points
        this.removePolyline()
        this.addPolyline(points)

        this.map.invalidateSize();
      } else {
        alert("error: " + response.status);
      }
    },
    calculateTextByPoints(points) {
      const textParts = []

      if (points.length > 2) {
        for (let i = 0; i < points.length - 2; i++) {
          if ((points[i].x - points[i + 1].x) === 0) {

            if (points[i + 1].title && points[i + 1].title.length > 1) {
              textParts.push(`пройдите прямо до аудитории ${points[i + 1].title}`)
            } else {
              const count = Math.abs(points[i].y - points[i + 1].y)
              textParts.push(`пройдите прямо ${count} ${declOfNum(count, ['метр', 'метра', 'метров'])}`)
            }

            if ((points[i + 1].y - points[i + 2].y) === 0) {
              const direction = this.calculateRotationDirection([points[i], points[i + 1], points[i + 2],]);
              textParts.push(`поверните ${direction}`)
            }
          } else if ((points[i].y - points[i + 1].y) === 0) {

            if (points[i + 1].title && points[i + 1].title.length > 1) {
              textParts.push(`пройдите прямо до аудитории ${points[i + 1].title}`)
            } else {
              const count = Math.abs(points[i].x - points[i + 1].x)
              textParts.push(`пройдите прямо ${count} ${declOfNum(count, ['метр', 'метра', 'метров'])}`)
            }

            if ((points[i + 1].x - points[i + 2].x) === 0) {
              const direction = this.calculateRotationDirection([points[i], points[i + 1], points[i + 2],]);
              textParts.push(`поверните ${direction}`)
            }
          }
        }
      } else {
        const count = Math.abs(points[0].y - points[1].y) + Math.abs(points[0].y - points[1].y)
        textParts.push(`пройдите прямо ${count} ${declOfNum(count, ['метр', 'метра', 'метров'])}`)
      }

      return textParts.join('. ');
    },
    calculateRotationDirection(points){
      const left = 'налево';
      const right = 'направо';
      let result;
      let i=0;
      if ((points[i].x - points[i+1].x) === 0) {
        const dy = points[i+1].y - points[i].y;
        const dx = points[i+2].x - points[i+1].x;
        if ((dy > 0 && dx > 0) || (dy < 0 && dx < 0)) {
          result = left;
        } else {
          result = right
        }
      } else {
        const dx = points[i+1].x - points[i].x;
        const dy = points[i+2].y - points[i+1].y;
        if ((dy > 0 && dx > 0) || (dy < 0 && dx < 0)) {
          result = right;
        } else {
          result = left
        }
      }

      return result;
    },
    convertPixelToLeafletPoint(x, y) {
      const leafletDivider = 8;
      return [parseInt(y) * this.sizeMultiplier / leafletDivider * -1,
        parseInt(x) * this.sizeMultiplier / leafletDivider];
    },

    addMarker(leafletPoint) {
      const marker = L.marker(leafletPoint, DefaultIcon)
      marker.addTo(this.map)
      this.currentMarkersObjects.push(marker)
    },
    removeAllMarkers() {
      for (const marker of this.currentMarkersObjects) {
        marker.remove(this.map)
      }
      this.currentMarkersObjects = []
    },
    addPolyline(leafletPoints) {
      this.leafletPolylineObject = L.polyline(leafletPoints, {color: colors.getBrand('positive')})
      this.leafletPolylineObject.addTo(this.map)
    },
    removePolyline() {
      if (this.leafletPolylineObject) {
        this.leafletPolylineObject.remove(this.map)
        this.leafletPolylineObject = null;
      }
    },
  },
  async created() {
    const apiUrl = 'http://194.87.232.192/navigator/api/';
    const response = await fetch(apiUrl + 'level?buildingId=' + this.buildingId);
    if (response.ok) {
      this.levels = await response.json();

      const firstLevel = this.levels.find(level => level.level === "1");
      if (!firstLevel)
        alert('first level not found');
      this.setLevel(firstLevel)
    } else {
      alert("error: " + response.status);
    }
  },
  mounted() {
    this.map = L.map('map', {
      center: [0, 0],
      maxZoom: 4,
      minZoom: 1,
      zoom: 2,
      crs: L.CRS.Simple,
      attributionControl: false,
    });
    this.$refs['map'].style.height = window.innerHeight - 50 + 'px';
  },
  computed: {
    level: function () {
      return this.currentLevelObject ? this.currentLevelObject.level : 1;
    },
    allLocations: function () {
      return this.levels.map(level => level.locations).flat();
    },
  },
  watch: {
    currentLevelObject: function (val) {
      this.updateMapImage();

      this.removeAllMarkers()
      if (val.markersPoints && val.markersPoints.length > 0) {
        for (const markerPoint of val.markersPoints) {
          this.addMarker(markerPoint)
        }
      }

      this.removePolyline()
      if (val.polylinePoints && val.polylinePoints.length > 0)
        this.addPolyline(val.polylinePoints)
    },
  }
}
</script>
<style lang="scss">
#map {
  width: 100%;
  /*height: 450px;*/
  border: 1px solid #ccc;

  z-index: 0;
  background-color: white;
}

.top-input-container {
  width: 100%;

  position: absolute;
  top: 0;
  padding: 12px 10px;
  z-index: 1;
}
input {
    color: white !important;
}
input::placeholder {
  color: white !important;
  opacity: 1 !important;
}

.change-level {
  position: absolute;
  top: 40%;
  left: 10px;
}
.change-level .number {
  font-size: 18px;
  line-height: 21px;
  font-weight: 500;
  text-transform: lowercase;
}
.change-level .word {
  font-size: 10px;
  line-height: 12px;
  font-weight: 400;
  text-transform: lowercase;
}

.change-level__dialog {
  width: 90%;
}

.change-level__dialog .level {
  cursor: pointer;
  padding: 20px;
}
.change-level__dialog .level:focus,
.change-level__dialog .level:active {
  background-color: #7EDA49 !important;
}

.route {
  position: absolute;
  bottom: 10%;
  left: 10px;

  padding: 15px;
}
.route-panel-container {
  width: 100%;
  position: absolute;
  bottom: 0;

  background-color: $light-blue;
}
.route-panel {
  width: 90px;
  margin: auto;
  padding: 12px 0;
}
.route-panel .input {
  border-bottom: 2px solid white;
  font-size: 30px;
}
.route-panel-container .done-button {
  width: 100%;
}
.route-panel-container .hide-button {
  position: absolute;
  top: -30px;
  right: 10px;

  padding: 10px;
}


.custom-text {
  font-size: 24px;
  line-height: 28px;
}


/* кнопки + и - */
.leaflet-control-container {
  position: absolute;
  right: 60px;
  top: 35%;
}

.leaflet-touch .leaflet-bar a {
  width: 40px;
  height: 40px;
  line-height: 40px;
}

.leaflet-control-zoom a {
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65);
}

.leaflet-bar a,
.leaflet-bar a:hover {
  background-color: $light-blue;
  border: 1px solid rgba(0, 0, 0, .15);
  color: white;
}

.leaflet-bar a.leaflet-disabled {
  cursor: default;
  background-color: white;
  color: grey;
}

.leaflet-touch .leaflet-bar a:first-child {
  border-radius: 50%;
}

.leaflet-touch .leaflet-bar a:last-child {
  border-radius: 50%;
}

.leaflet-control-zoom a.leaflet-control-zoom-out {
  margin-top: 15px;
}

.leaflet-touch .leaflet-control-layers,
.leaflet-touch .leaflet-bar {
  border: none;
}

</style>
