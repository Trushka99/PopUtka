<script setup lang="tsx">
import { ref, computed } from "vue";
const timeFrom = ref<string | null>(null);
const timeTo = ref<string | null>(null);

const showMenuFrom = ref(false);
const showMenuTo = ref(false);
const formattedFrom = computed(() => timeFrom.value || "");
const formattedTo = computed(() => timeTo.value || "");

const radios = ref("");
const sex = ref("");
</script>
<template>
  <div class="filters">
    <div class="container">
      <v-container class="radios" fluid>
        <div class="flex">
          <h3 class="title">Фильтры</h3>
          <v-icon>mdi-filter-variant</v-icon>
        </div>
        <v-radio-group v-model="radios">
          <v-radio color="primary" value="early">
            <template v-slot:label>
              <div>
                Саммые <strong class="text-success">ранние поездки</strong>
              </div>
            </template></v-radio
          >
          <v-radio color="primary" label="Саммые дешевые поездки" value="cheap">
            <template v-slot:label>
              <div>
                Саммые <strong class="text-success">дешевые поездки</strong>
              </div>
            </template></v-radio
          >
          <v-radio color="primary" value="varified">
            <template v-slot:label>
              <div>Профиль подтвержден</div>
            </template></v-radio
          >
          <v-radio color="primary">
            <template v-slot:label>
              <div>Мгновенное бронирование</div>
            </template></v-radio
          >
        </v-radio-group>
      </v-container>
      <v-container class="radios" fluid>
        <div class="flex">
          <h3 class="title">Стоимость</h3>
          <v-icon>mdi-cash</v-icon>
        </div>
        <v-row justify="space-between">
          <v-col cols="6">
            <v-text-field
              label="Сумма от"
              model-value="10.00"
              suffix="₽"
            ></v-text-field></v-col
          ><v-col cols="6">
            <v-text-field
              label="Сумма до"
              model-value="10.00"
              suffix="₽"
            ></v-text-field></v-col
        ></v-row>
      </v-container>
      <v-container class="radios" fluid>
        <div class="flex">
          <h3 class="title">Время</h3>
          <v-icon>mdi-clock-time-four-outline</v-icon>
        </div>
        <v-row justify="space-between">
          <v-col cols="6">
            <v-text-field v-model="formattedFrom" label="Время от" readonly>
              <v-menu
                v-model="showMenuFrom"
                :close-on-content-click="false"
                activator="parent"
                min-width="0"
              >
                <v-time-picker
                  color="primary"
                  variant="flat"
                  density="comfortable"
                  format="24hr"
                  v-model="timeFrom"
                  @click:minute="showMenuFrom = false"
                ></v-time-picker>
              </v-menu>
            </v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="formattedTo" label="Время до" readonly>
              <v-menu
                v-model="showMenuTo"
                :close-on-content-click="false"
                activator="parent"
                min-width="0"
              >
                <v-time-picker
                  color="primary"
                  variant="flat"
                  density="comfortable"
                  format="24hr"
                  v-model="timeTo"
                  @click:minute="showMenuFrom = false"
                ></v-time-picker>
              </v-menu>
            </v-text-field>
          </v-col>
        </v-row>
      </v-container>
      <v-radio-group v-model="sex" class="sex-row">
        <v-radio color="primary" value="male">
          <template #label>
            <v-icon color="pink">mdi-gender-male</v-icon>
            <div>Хуемрази</div>
          </template>
        </v-radio>

        <v-radio color="primary" value="female">
          <template #label>
            <v-icon color="blue">mdi-gender-female</v-icon>
            <div>Королевы</div>
          </template>
        </v-radio>
      </v-radio-group>
      <v-btn color="info" variant="tonal">Применить фильтры</v-btn>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.filters {
  border-radius: 30px;
  background-color: white;
  width: 30%;
  height: 80vh;
  padding: 40px 0;
  @media (max-width: 920px) {
    width: 90%;

    margin: 0 auto;
  }
}
.title {
  font-size: 20px;
  margin-bottom: 15px;
}
.flex {
  display: flex;
  justify-content: space-between;
}
.sex {
  padding: 0;
}
.sex-row {
  display: flex;
  justify-content: space-between; /* растягиваем по краям */
  width: 100%;
}
.container {
  width: 90%;
  margin: 0 auto;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
}
.radios {
  padding: 0;
}
</style>
