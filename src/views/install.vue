<template>
  <h1>Приложение устанавливается</h1>
</template>

<script setup>

import { appRoot, entityCode } from "@/config"
import { Bitrix24 } from "@/classes/Bitrix24"

function installApp() {
  Bitrix24.callMethod('placement.bind', {
    PLACEMENT: 'TASK_VIEW_TAB',
    HANDLER: 'https://' + Bitrix24.getDomain() + appRoot,
    LANG_ALL: {
      ru: {
        TITLE: "Таймшиты",
        DESCRIPTION: ""
      }
    }
  });

  window.BX24.installFinish()
}

Bitrix24.getInfo()
    .then( info => {
      info['INSTALLED']
          ? window.BX24.installFinish()
          : installApp()
    })

</script>

<style scoped>

</style>
