<template>
  <q-layout view="lHh Lpr lFf">

    <q-header elevated>
      <q-toolbar class="bg-light-blue">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="leftDrawerOpen = !leftDrawerOpen"/>

        <q-toolbar-title>
          Меню
        </q-toolbar-title>

      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered no-swipe-open content-class="bg-light-blue q-pa-md">
      <span class="text-white text-h5">Настройки</span>
      <q-list>
        <q-item>
            <div class="row items-center text-white text-weight-regular">
              <div class="col-9 ">
                <span class="text-body1 wrap">Голосовой помощник</span>
              </div>
              <div class="col-3">
                <q-toggle v-model="voiceMode" color="white" size="xl"/>
              </div>
            </div>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view :voiceMode="voiceMode"/>
    </q-page-container>
  </q-layout>
</template>

<script>


export default {
  name: 'MainLayout',
  components: {},
  data() {
    return {
      leftDrawerOpen: false,
      voiceMode: false
    }
  }
}
</script>
