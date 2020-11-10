<template>
  <q-page>
    <div class="input-container">
      <!--      <q-input rounded outlined v-model="userInput" id="input" class="text-orange" placeholder="Поиск"-->
      <!--               v-on:change="handleInput" bg-color="primary" text-color="primary" ref="input"></q-input>-->
      <input v-model="userInput" class="input" placeholder="Поиск" v-on:change="handleInput">

    </div>
    <div id="map" ref="map"></div>
  </q-page>
</template>

<script>
import L from 'leaflet/dist/leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import mapImage from 'assets/tef_level-4.svg'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [24, 36],
  iconAnchor: [12, 36]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default {
  name: 'PageIndex',
  data() {
    return {
      userInput: null,
      map: null,
      itemToCoordinates: null
    }
  },
  methods: {
    handleInput() {
      if (this.itemToCoordinates[this.userInput]) {
        console.log(this.userInput);

        L.marker(this.itemToCoordinates[this.userInput], DefaultIcon).addTo(this.map);

        const coordinates = this.itemToCoordinates[this.userInput];
        coordinates[0] += 10;
        this.map.setView(coordinates, this.map.getMaxZoom());
      }
    }
  },
  mounted() {
    // code from: http://kempe.net/blog/2014/06/14/leaflet-pan-zoom-image.html

    const w = 287*5,
      h = 87*5,
      url = mapImage;

    this.map = L.map('map', {
      center: [0, 0],
      maxZoom: 4,
      minZoom: 1,
      zoom: 1,
      crs: L.CRS.Simple
    });

    // calculate the edges of the image, in coordinate space
    const southWest = this.map.unproject([0, h], this.map.getMaxZoom() - 1);
    const northEast = this.map.unproject([w, 0], this.map.getMaxZoom() - 1);
    const bounds = new L.LatLngBounds(southWest, northEast);

    // add the image overlay,
    // so that it covers the entire map
    L.imageOverlay(url, bounds).addTo(this.map);

    // tell leaflet that the map is exactly as big as the image
    this.map.setMaxBounds(bounds);

    const windowHeight = window.innerHeight;
    this.$refs['map'].style.height = windowHeight / 1.5 + 'px';
    console.log(windowHeight);


    const leafletHref = document.querySelector('a[href="https://leafletjs.com"]');
    leafletHref.parentElement.parentElement.remove();

    this.itemToCoordinates = {
      1: [0, 0],
      2: [-10, 10],
      3: [-1*(87*5/8), 287*5/8],
    }
  },

}
</script>
<style>
#map {
  width: 100%;
  /*height: 450px;*/
  border: 1px solid #ccc;
  margin-bottom: 10px;

  z-index: 0;
}

.input-container {
  width: 100%;

  position: absolute;
  padding: 12px 10px;
  z-index: 1;
}
.input {
  width: 100%;
  height: 50px;

  position: relative;

  padding-left: 50px;

  border: none;
  border-radius: 30px;

  background-color: #03A9F4;
  background-image: url(../assets/marker.svg);
  background-repeat: no-repeat;
  background-position-x: 12px;
  background-position-y: center;
  background-size: 35px;

  color: white;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.35);
}
.input:focus {
  outline: none;
}
input::placeholder {
  color: white;
}


/* кнопки + и - */
.leaflet-control-container {
  position: absolute;
  right: 70px;
  bottom: 120px;
}
.leaflet-touch .leaflet-bar a {
  width: 40px;
  height: 40px;
  line-height: 40px;
}
.leaflet-control-zoom a {
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65);
}
.leaflet-bar a {
  background-color: #03A9F4;
  border: 1px solid rgba(0, 0, 0, .15);
  color: white;
}
.leaflet-bar a:hover {
  background-color: white;
  border: 1px solid rgba(0, 0, 0, .15);
  color: #03A9F4;
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
