<template>
  <h1>Приложение устанавливается</h1>
</template>

<script setup>

import { appRoot, entityCode } from "@/config"
import { Bitrix24 } from "@/classes/Bitrix24"

function installApp() {
  Bitrix24.callMethod('placement.bind', {
    PLACEMENT: 'TASK_VIEW_TAB',
    HANDLER: Bitrix24.getDomain() + appRoot,
    LANG_ALL: {
      ru: {
        TITLE: "Таймшиты",
        DESCRIPTION: ""
      }
    }
  });

  Bitrix24.callMethod('entity.add', {
    ENTITY: entityCode,
    NAME: 'TS_TAB_APP задачи-тш',
    ACCESS: {
      AU: 'W'
    }
  })

  const props = [
    {
      ENTITY: entityCode,
      PROPERTY: 'taskId',
      NAME: "ИД задачи",
      TYPE: "S"
    },
    {
      ENTITY: entityCode,
      PROPERTY: 'tsId',
      NAME: "ИД тш",
      TYPE: "S"
    },
  ];

  for (const prop of props) {
    Bitrix24.callMethod('entity.item.property.add', prop)
  }

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
