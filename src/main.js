import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import { router } from './helpers';
import { useAuthStore } from './stores';

// setup fake backend
import { fakeBackend } from './helpers';
fakeBackend();

startApp();

// async start function to enable waiting for refresh token call
async function startApp () {
    const app = createApp(App);

    app.use(createPinia());
    app.use(router);

    // attempt to auto refresh token before startup
    try {
        const authStore = useAuthStore();
        await authStore.refreshToken();
    } catch {
        // catch error to start app on success or failure
    }

    app.mount('#app');
}