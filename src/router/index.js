import { createWebHistory, createRouter } from "vue-router";
import Index from "@/views/index.vue";
import Install from "@/views/install.vue";

const routes = [
    {
        path: "/local/applications/timesheet/dist",
        name: "index",
        component: Index,
    },
    {
        path: "/local/applications/timesheet/dist?install=Y",
        name: "install",
        component: Install,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
