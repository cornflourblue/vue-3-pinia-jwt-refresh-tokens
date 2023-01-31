<script setup>
import { RouterLink, RouterView } from 'vue-router';

import { useAuthStore } from '@/stores';

const authStore = useAuthStore();
</script>

<template>
    <div class="app-container bg-light">
        <nav v-show="authStore.user" class="navbar navbar-expand navbar-dark bg-dark px-3">
            <div class="navbar-nav">
                <RouterLink to="/" class="nav-item nav-link">Home</RouterLink>
                <button @click="authStore.logout()" class="btn btn-link nav-item nav-link">Logout</button>
            </div>
        </nav>
        <div class="container pt-4 pb-4">
            <RouterView />
        </div>
    </div>
</template>

<style>
@import '@/assets/base.css';
</style>