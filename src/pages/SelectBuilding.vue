<template>
  <q-page>
    <router-link v-for="building in this.buildings" :to="{name: 'map', params:{buildingId: building.id}}"
                 :key="building.id">{{ building.title }}
    </router-link>
  </q-page>
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
<style></style>
