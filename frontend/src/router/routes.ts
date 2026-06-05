import type { RouteRecordRaw } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import AppLayout from '@/components/AppLayout.vue'
import DashboardView from '@/views/DashboardView.vue'
import PrescriptionListView from '@/views/PrescriptionListView.vue'
import PrescriptionFormView from '@/views/PrescriptionFormView.vue'
import PrescriptionDetailView from '@/views/PrescriptionDetailView.vue'
import PatientListView from '@/views/PatientListView.vue'
import DeliveryListView from '@/views/DeliveryListView.vue'
import NotificationCenterView from '@/views/NotificationCenterView.vue'
import ForbiddenView from '@/views/ForbiddenView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guest: true },
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: '工作台', roles: ['assistant', 'doctor', 'courier', 'patient', 'pharmacist'], group: '主菜单' },
      },
      {
        path: 'prescriptions',
        name: 'PrescriptionList',
        component: PrescriptionListView,
        meta: { title: '处方管理', roles: ['assistant', 'doctor', 'patient', 'pharmacist'], group: '业务管理' },
      },
      {
        path: 'prescriptions/new',
        name: 'PrescriptionCreate',
        component: PrescriptionFormView,
        meta: { title: '新建处方', roles: ['assistant'], group: '业务管理' },
      },
      {
        path: 'prescriptions/:id/edit',
        name: 'PrescriptionEdit',
        component: PrescriptionFormView,
        meta: { title: '编辑处方', roles: ['assistant'], sidebar: false },
      },
      {
        path: 'prescriptions/:id',
        name: 'PrescriptionDetail',
        component: PrescriptionDetailView,
        meta: { title: '处方详情', roles: ['assistant', 'doctor', 'courier', 'patient', 'pharmacist'], sidebar: false },
      },
      {
        path: 'patients',
        name: 'PatientList',
        component: PatientListView,
        meta: { title: '患者管理', roles: ['assistant', 'doctor', 'pharmacist'], group: '业务管理' },
      },
      {
        path: 'pharmacy',
        name: 'PharmacyDashboard',
        component: () => import('@/views/PharmacyDashboardView.vue'),
        meta: { title: '药剂师工作台', roles: ['pharmacist'], group: '业务管理' },
      },
      {
        path: 'dispensing/:prescriptionId',
        name: 'Dispensing',
        component: () => import('@/views/DispensingView.vue'),
        meta: { title: '配药', roles: ['pharmacist'], sidebar: false },
      },
      {
        path: 'delivery',
        name: 'DeliveryList',
        component: DeliveryListView,
        meta: { title: '配送管理', roles: ['courier'], group: '业务管理' },
      },
      {
        path: 'notifications',
        name: 'NotificationCenter',
        component: NotificationCenterView,
        meta: { title: '通知中心', roles: ['assistant', 'doctor', 'courier', 'patient', 'pharmacist'], group: '其他' },
      },
    ],
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: ForbiddenView,
    meta: { roles: ['assistant', 'doctor', 'courier', 'patient', 'pharmacist'], sidebar: false },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: { roles: ['assistant', 'doctor', 'courier', 'patient', 'pharmacist'], sidebar: false },
  },
]
