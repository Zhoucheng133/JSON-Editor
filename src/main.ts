import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { createPinia } from "pinia";
import { i18n } from "./i18n";

const pinia = createPinia()

createApp(App)
.use(pinia)
.use(i18n)
.mount("#app");
