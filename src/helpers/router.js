import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '@/stores';
import { HomeView, LoginView, TestView,OpenView } from '@/views';

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    linkActiveClass: 'active',
    routes: [
        { path: '/', component: HomeView },
        { path: '/login', component: LoginView },
        { path: '/test', component: TestView },
        { path: '/open', component: OpenView },

        // otherwise redirect to not protected landing page
        { path: '/:pathMatch(.*)*', redirect: '/open' }
    ]
});

router.beforeEach(async (to) => {
    // redirect to login page if not logged in and trying to access a restricted page
    const publicPages = ['/login','/open'];
    const authRequired = !publicPages.includes(to.path);
    const authStore = useAuthStore();

    if(to.path ==="/"){
        return {
            path: '/open',
        };
    }
    if (authRequired && !authStore.user) {
        return {
            path: '/login',
            query: { returnUrl: to.href }
        };
    }
});
