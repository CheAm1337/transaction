import Vue from 'vue';
import VueRouter from 'vue-router';
import LoginComponent from "@/components/AuthorizationComponent.vue";
import TransactionComponent from "@/components/TransactionComponent.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Login",
    component: LoginComponent,
  },
  {
    path: "/transaction",
    name: "Transaction",
    component: TransactionComponent,
  },
];

const router = new VueRouter({
  routes,
  mode: 'history',
});

export default router;
