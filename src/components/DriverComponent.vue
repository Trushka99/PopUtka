<template>
  <v-col cols="12" sm="6" md="4">
    <v-card class="driver-card variant5" elevation="3">
      <div class="status-bar available"></div>
      <div class="content">
        <v-avatar size="56" class="mr-3">
          <v-img src="https://randomuser.me/api/portraits/women/65.jpg" />
        </v-avatar>
        <div>
          <div class="text-subtitle-1">Екатерина Лебедева</div>
          <div class="text-body-2">⭐ 4.5 • 3 года</div>
        </div>
      </div>
    </v-card>
  </v-col>
</template>

<script setup lang="ts">
const driver = {
  name: "Иван Иванов",
  rating: 4.9,
  experience: 7,
  phone: "+7 (999) 222-33-44",
  status: "available", // available | busy
  photo: "https://randomuser.me/api/portraits/men/45.jpg",
};
</script>

<style scoped>
.driver-card {
  border-radius: 14px;
  transition: 0.3s;
}
.driver-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
.driver-card.variant5 {
  display: flex;
  align-items: center;
  overflow: hidden;
}
.status-bar {
  width: 6px;
  height: 100%;
}
.status-bar.available {
  background: #4caf50;
}
.status-bar.busy {
  background: #f44336;
}
.content {
  display: flex;
  align-items: center;
  padding: 12px;
}
</style>
