import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { createPinia } from "pinia";
const pinia = createPinia()

createApp(App)
.use(pinia)
.mount("#app");
