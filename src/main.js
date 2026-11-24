import { createApp } from 'vue';
import QrcodeVue from 'qrcode.vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/style.css';
import App from './App.vue';
import { translate } from './utils/i18n';

const app = createApp(App);

app.config.globalProperties.$gettext = translate;
app.component('qrcode-vue', QrcodeVue);
app.mount('#app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('./sw.js')
            .then(() => {
                console.log('ServiceWorker registration successful');
            })
            .catch((err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
