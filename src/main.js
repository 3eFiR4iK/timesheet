import { createApp } from 'vue'
import App from './App.vue'
import router from "./router";
import PrimeVue from 'primevue/config';
import Button from "primevue/button";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Menubar from 'primevue/menubar';

import 'primevue/resources/themes/lara-light-teal/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

const app = createApp(App);

app.use(router)
app.use(PrimeVue)

app.component('Button', Button)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('DataTable', DataTable)
app.component('Menubar', Menubar)


let scriptElem = document.createElement('script')
scriptElem.setAttribute('src', 'js/bxApi.js')
scriptElem.setAttribute('id', 'bx')
document.body.appendChild(scriptElem)

// now wait for it to load...
scriptElem.onload = () => {

    window.BX24.init(() => {
        app.mount('#app')
    })
}
