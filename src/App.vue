<template>
  <router-view />
</template>


<script>
/* eslint-disable */
import HelloWorld from './components/HelloWorld.vue'
import {Bitrix24} from "@/classes/Bitrix24";

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  created() {
    Bitrix24.getInfo()
        .then( info => {
          info.answer.result.INSTALLED
              ? window.BX24.installFinish()
              : this.$router.push({name: "install"})
        })
  }
}
</script>

<style>
#app {

}
</style>
