<script setup>
/* eslint-disable */
import { ref } from "vue"
import { tsFromUrl, tsListId, gridColumns, taskIdFieldName } from "@/config"
import { Bitrix24 } from "@/classes/Bitrix24"
import dateFormat from "dateformat"
import Paginator from 'primevue/paginator'

let users = [];
let totalRecords = ref()
let tsList = ref()
const placement = Bitrix24.getPlacementInfo()
let page = ref()
page.value = 0
const limit = 50
function openSidePanel() {
  const BX = window.top.BX
  BX.SidePanel.Instance.open(tsFromUrl, {
    events: {
      onLoad: function (event) {
        if (event.slider.url !== tsFromUrl) {
          event.slider.close()
          const arUrl = event.slider.url.split('/')
          const tsId = arUrl[arUrl.length - 2]
          console.log(tsId)
          if (tsId > 0) {
            Bitrix24.addTs(placement.options.taskId, tsId).then(() => {
              page.value = 0
              loadTsList()
              event.slider.close()
              window.top.BX.SidePanel.Instance.cleanUpClosedSlider(event.slider)
            })
          }
        }
      }
    }
  })
}

function loadTsList(start = 0) {

  const filter = {}

  filter[taskIdFieldName] = placement.options.taskId

  Bitrix24.callMethod('crm.item.list', {
    entityTypeId: tsListId,
    filter,
    order: {
      createdTime: 'DESC'
    },
    select: ['*'],
    start: start
  }).then(listItems => {
    totalRecords.value = listItems.answer.total
    users = []

    if (totalRecords.value <= 0) {
      return
    }

    for (let item of listItems.answer.result.items) {
      users.push(item.createdBy);
    }

    users = users.filter(function(item, pos){
      return users.indexOf(item) == pos;
    });
    Bitrix24.callMethod('user.get', {
      ID: users,
      ADMIN_MODE: 'True'
    }).then(response => {
      for (let item of response.answer.result) {
        users[item.ID] = item;
      }
      tsList.value = listItems.answer.result.items
    })
  })
}

function openExtSidePanel(url) {
  window.top.BX.SidePanel.Instance.open(url)
}

function changePage(changedPage) {
  window.scrollTo(0,0);
  loadTsList(changedPage.page * 50)
}

loadTsList()
</script>

<template>
  <div class="ts-list-wrapper">
    <div class="ts-list-table">
      <DataTable :value="tsList" tableStyle="min-width: 50rem">
        <template #header>
          <div class="flex flex-wrap align-items-center justify-content-between gap-2">
            <Button icon="pi pi-plus" @click="openSidePanel" />
          </div>
        </template>
        <Column v-for="col of gridColumns" :key="col.field" :field="col.field" :header="col.header">
          <template v-if="col.field === 'title'" #body="slotProps">
            <span class="sidepanel-link" @click="openExtSidePanel(`/crm/type/${tsListId}/details/${slotProps.data.id}/`)">{{ slotProps.data.title }}</span>
          </template>
          <template v-if="col.field === 'createdBy'" #body="slotProps">
            <span class="sidepanel-link" @click="openExtSidePanel(Bitrix24.getUserLink(slotProps.data.createdBy))">{{ users[slotProps.data.createdBy].LAST_NAME }} {{ users[slotProps.data.createdBy].NAME }}</span>
          </template>
          <template v-if="col.field === 'ufCrmPropertyDataSpisanieTs1'" #body="slotProps">
            {{ dateFormat(new Date(slotProps.data.createdTime), 'dd.mm.yyyy H:M') }}
          </template>
        </Column>
      </DataTable>

      <Paginator :rows="limit" :totalRecords="totalRecords" @page="changePage" v-model:first="page"></Paginator>
    </div>
  </div>


</template>

<style scoped>
    .sidepanel-link {
      cursor: pointer;
    }

    .sidepanel-link:hover {
      text-decoration: underline;
    }
</style>
