<script setup lang="ts">
import { ref } from 'vue'
import { useActivityStore } from '@/stores/activity'
import { Pencil, Save, X } from 'lucide-vue-next'

const store = useActivityStore()
const editing = ref(false)

function toggleEdit() {
  editing.value = !editing.value
}

async function save() {
  await store.saveActivity({})
  editing.value = false
}
</script>

<template>
  <div class="activity-banner">
    <div class="banner-bg"></div>
    <div class="banner-content">
      <div class="banner-left">
        <template v-if="!editing">
          <h1 class="banner-title">{{ store.activity.name || '未命名活动' }}</h1>
          <div class="banner-meta">
            <span v-if="store.activity.date">📅 {{ store.activity.date }}</span>
            <span v-if="store.activity.location">📍 {{ store.activity.location }}</span>
            <span v-if="store.activity.participantCount">👥 {{ store.activity.participantCount }} 人</span>
          </div>
          <button class="btn-edit" @click="toggleEdit">
            <Pencil :size="14" />
            <span>编辑</span>
          </button>
        </template>
        <template v-else>
          <div class="edit-form">
            <input
              v-model="store.activity.name"
              type="text"
              class="input-title"
              placeholder="活动名称"
            />
            <div class="edit-row">
              <input
                v-model="store.activity.date"
                type="date"
                class="input-field"
              />
              <input
                v-model="store.activity.location"
                type="text"
                class="input-field"
                placeholder="活动地点"
              />
              <input
                v-model.number="store.activity.participantCount"
                type="number"
                class="input-field w-24"
                placeholder="人数"
                min="0"
              />
            </div>
            <div class="edit-actions">
              <button class="btn-save" @click="save">
                <Save :size="14" />
                <span>保存</span>
              </button>
              <button class="btn-cancel" @click="editing = false">
                <X :size="14" />
                <span>取消</span>
              </button>
            </div>
          </div>
        </template>
      </div>
      <div class="banner-right">
        <div class="leaf-icon">🌿</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-banner {
  @apply relative rounded-2xl overflow-hidden mb-6;
  min-height: 100px;
}

.banner-bg {
  @apply absolute inset-0;
  background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%);
}

.banner-content {
  @apply relative z-10 flex items-center justify-between px-8 py-6;
}

.banner-left {
  @apply flex-1;
}

.banner-title {
  @apply text-2xl font-bold text-white mb-2;
  font-family: 'Playfair Display', serif;
}

.banner-meta {
  @apply flex gap-4 text-white/80 text-sm mb-3;
}

.btn-edit {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/90
    bg-white/10 hover:bg-white/20 transition-all text-sm cursor-pointer border-0;
}

.edit-form {
  @apply flex flex-col gap-3;
}

.input-title {
  @apply bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-lg font-semibold
    placeholder-white/40 outline-none focus:border-white/50 transition-colors;
}

.input-field {
  @apply bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm
    placeholder-white/40 outline-none focus:border-white/50 transition-colors;
}

.edit-row {
  @apply flex gap-3 flex-wrap;
}

.edit-actions {
  @apply flex gap-2;
}

.btn-save {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white
    bg-emerald-600 hover:bg-emerald-500 transition-all text-sm cursor-pointer border-0;
}

.btn-cancel {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/80
    bg-white/10 hover:bg-white/20 transition-all text-sm cursor-pointer border-0;
}

.leaf-icon {
  @apply text-5xl opacity-80;
}

.w-24 {
  width: 6rem;
}
</style>
