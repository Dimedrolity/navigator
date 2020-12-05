<template>
  <q-page>
    <div class="input-container">
      <q-input v-model="userInput" v-on:change="handleInput" placeholder="Поиск" value="" rounded standout
               bg-color="light-blue" class="input2">
        <template v-slot:prepend>
          <q-avatar>
            <img src="../assets/marker-icon.svg" alt="marker">
          </q-avatar>
        </template>
      </q-input>
    </div>
    <div id="map" ref="map"></div>

    <q-btn v-if="this.currentLevelObject" @click="isLevelDialogOpen = true" round stack color="light-blue"
           text-color="white" class="change-level">
      <span class="number">{{ this.currentLevelObject.level }}</span>
      <span class="word">этаж</span>
    </q-btn>

    <q-dialog v-model="isLevelDialogOpen">
      <q-card class="change-level_dialog">
        <q-card-section class=" q-pb-none">
          <div class="text-h6 text-center">Выберите этаж</div>
        </q-card-section>

        <q-card-section>
          <div v-for="level in levels" @click="changeLevel(level)" class="level q-mb-sm">{{ level.level }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import L from 'leaflet/dist/leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [24, 36],
  iconAnchor: [12, 36]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default {
  name: 'PageMap',
  props: {
    buildingId: String,
  },
  data() {
    return {
      userInput: null,
      map: null,
      mapWidth: null,
      mapHeight: null,

      levels: null,
      currentLevelObject: null,
      sizeMultiplier: 5,
      leafletDivider: 8,
      isLevelDialogOpen: false
    }
  },
  methods: {
    handleInput() {
      const location = this.locations.find(location => location.title === this.userInput);
      if (location) {
        const y = parseInt(location.points.y1) * this.sizeMultiplier / this.leafletDivider * -1;
        const x = parseInt(location.points.x1) * this.sizeMultiplier / this.leafletDivider;

        L.marker([y, x], DefaultIcon).addTo(this.map);
        this.map.setView([y + 10, x], this.map.getMaxZoom());
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
    createMap() {
      this.map = L.map('map', {
        center: [0, 0],
        maxZoom: 4,
        minZoom: 1,
        zoom: 2,
        crs: L.CRS.Simple
      });

      this.$refs['map'].style.height = window.innerHeight - 50 + 'px';

      const leafletHref = document.querySelector('a[href="https://leafletjs.com"]');
      leafletHref.parentElement.parentElement.remove();

      this.updateMapImage();

      //через 10 сек сменить на другой этаж
      // const newLevel = 2;
      // setTimeout(()=>{
      //   this.currentLevelObject = this.levels.find(level => level.level === newLevel.toString())
      //   this.updateMapImage();
      //
      // },10*1000);
    },
    changeLevel(level) {
      if (level !== this.currentLevelObject) {
        this.currentLevelObject = level;
        this.updateMapImage();
        this.isLevelDialogOpen = false
      }
    }
  },

  async mounted() {
    // code from: http://kempe.net/blog/2014/06/14/leaflet-pan-zoom-image.html
    const apiUrl = 'http://194.87.232.192/navigator/api/';
    const response = await fetch(apiUrl + 'level?buildingId=' + this.buildingId);
    if (response.ok) {
      this.levels = await response.json();
      const firstLevel = this.levels.find(level => level.level === "1");
      if (!firstLevel)
        new Error('first level not found');
      this.currentLevelObject = firstLevel;

      this.createMap();
    } else {
      alert("error: " + response.status);
    }
  },
  computed: {
    locations: function () {
      return this.currentLevelObject.locations;
    },
    level: function () {
      return this.currentLevelObject.level;
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

.input-container {
  width: 100%;

  position: absolute;
  top: 0;
  padding: 12px 10px;
  z-index: 1;
}

input::placeholder {
  color: white !important;
  opacity: 1 !important;
}

//.input {
//  width: 100%;
//  height: 50px;
//
//  padding-left: 50px;
//
//  border: none;
//  border-radius: 30px;
//
//  background-color: $light-blue;
//  background-image: url(../assets/marker-icon.svg);
//  background-repeat: no-repeat;
//  background-position-x: 12px;
//  background-position-y: center;
//  background-size: 35px;
//
//  color: white;
//  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.35);
//
//  &:focus {
//    outline: none;
//  }
//  &::placeholder {
//    color: white !important;
//  }
//}



//.change-level {
//  display: flex;
//  flex-direction: column;
//  align-items: center;
//
//  background-color: $light-blue;
//  color: white;
//  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65);
//
//  border: 1px solid rgba(0, 0, 0, .15);
//  border-radius: 50%;
//  outline: none;
//
//  padding: 6px 11px;
//
//  position: absolute;
//  top: 50%;
//  left: 10px;
//
//  z-index: 1;
//}
//
//.change-level .number {
//  font-size: 18px;
//  line-height: 21px;
//}
//
//.change-level .word {
//  font-size: 10px;
//  line-height: 12px;
//}



.change-level {
  position: absolute;
  top: 50%;
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

.change-level_dialog {
  text-align: center;

  width: 90%;
}

.change-level_dialog .text {
  text-align: center !important;
}
.level {
  padding: 20px;
  border: 1px solid black;
  text-align: center;
}



/* кнопки + и - */
.leaflet-control-container {
  position: absolute;
  right: 70px;
  top: 45%;
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
