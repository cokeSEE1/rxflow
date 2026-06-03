import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '工作台', roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
      {
        path: 'prescriptions',
        name: 'PrescriptionList',
        component: () => import('@/views/PrescriptionListView.vue'),
        meta: { title: '处方管理', roles: ['assistant', 'doctor', 'patient'] },
      },
      {
        path: 'prescriptions/new',
        name: 'PrescriptionCreate',
        component: () => import('@/views/PrescriptionFormView.vue'),
        meta: { title: '新建处方', roles: ['assistant'] },
      },
      {
        path: 'prescriptions/:id/edit',
        name: 'PrescriptionEdit',
        component: () => import('@/views/PrescriptionFormView.vue'),
        meta: { title: '编辑处方', roles: ['assistant'] },
      },
      {
        path: 'prescriptions/:id',
        name: 'PrescriptionDetail',
        component: () => import('@/views/PrescriptionDetailView.vue'),
        meta: { title: '处方详情', roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
      {
        path: 'patients',
        name: 'PatientList',
        component: () => import('@/views/PatientListView.vue'),
        meta: { title: '患者管理', roles: ['assistant', 'doctor'] },
      },
      {
        path: 'delivery',
        name: 'DeliveryList',
        component: () => import('@/views/DeliveryListView.vue'),
        meta: { title: '配送管理', roles: ['courier'] },
      },
      {
        path: 'notifications',
        name: 'NotificationCenter',
        component: () => import('@/views/NotificationCenterView.vue'),
        meta: { title: '通知中心', roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
      {
        path: 'forbidden',
        name: 'Forbidden',
        component: () => import('@/views/ForbiddenView.vue'),
        meta: { roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
    ],
  },
]
