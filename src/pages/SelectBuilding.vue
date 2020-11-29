<template>
  <q-layout>
    <q-page-container>
      <q-page class="bg-light-blue text-center">

        <header>
          <div class="text-white header">
            <span>Привет!</span> <br>
          </div>
          <div class="text-white text">
            <span>Выбери корпус</span>
          </div>
        </header>

        <main>
          <div class="row q-ma-lg" v-for="building in this.buildings"
               :key="building.id">
            <div class="col-1">
            </div>
            <q-btn :to="{name: 'map', params: {buildingId: building.id } }"
                   class="button col-10" unelevated color="green">{{ building.title }}
            </q-btn>
            <div class="col-1">
            </div>
          </div>
        </main>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>

export default {
  name: 'PageSelectBuilding',
  data() {
    return {
      buildings: null,
    }
  },
  methods: {},
  async created() {
    const apiUrl = 'http://194.87.232.192/navigator/api/';
    const response = await fetch(apiUrl + 'building/all');
    if (response.ok) {
      this.buildings = await response.json();
    } else {
      alert("error: " + response.status);
    }
  },

}
</script>
<style scoped>
header {
  padding-top: 80px;
  margin-bottom: 60px;
}

.header {
  font-size: 36px;
  line-height: 42px;

  margin-bottom: 18px;
}

.text {
  margin-top: 0;
  font-size: 24px;
  line-height: 28px;
}

.button {
  font-size: 24px;
  line-height: 28px;
  text-align: center;
}

.button:focus,
.button:active {
  background-color: #7EDA49 !important;
}
</style>
