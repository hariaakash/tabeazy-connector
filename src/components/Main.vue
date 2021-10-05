<template>
  <main
    class="dark:bg-gray-800 font-mono bg-white relative overflow-hidden h-screen"
  >
    <header class="h-24 sm:h-32 flex items-center z-30 w-full">
      <div class="container mx-auto px-6 flex items-center justify-between">
        <div
          @click="openExternalUrl('mailto:support@tabeazy.com')"
          class="uppercase text-gray-800 dark:text-white font-black text-3xl flex items-center"
        >
          <svg
            width="25"
            height="25"
            viewBox="0 0 1792 1792"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1664 1504v-768q-32 36-69 66-268 206-426 338-51 43-83 67t-86.5 48.5-102.5 24.5h-2q-48 0-102.5-24.5t-86.5-48.5-83-67q-158-132-426-338-37-30-69-66v768q0 13 9.5 22.5t22.5 9.5h1472q13 0 22.5-9.5t9.5-22.5zm0-1051v-24.5l-.5-13-3-12.5-5.5-9-9-7.5-14-2.5h-1472q-13 0-22.5 9.5t-9.5 22.5q0 168 147 284 193 152 401 317 6 5 35 29.5t46 37.5 44.5 31.5 50.5 27.5 43 9h2q20 0 43-9t50.5-27.5 44.5-31.5 46-37.5 35-29.5q208-165 401-317 54-43 100.5-115.5t46.5-131.5zm128-37v1088q0 66-47 113t-113 47h-1472q-66 0-113-47t-47-113v-1088q0-66 47-113t113-47h1472q66 0 113 47t47 113z"
            ></path>
          </svg>
          <span class="text-xs ml-3 mt-1">
            support@tabeazy.com
          </span>
        </div>
        <div class="flex items-center">
          <nav
            class="font-sen text-gray-800 dark:text-white uppercase text-lg lg:flex items-center hidden"
          >
            <a
              @click="openExternalUrl('https://seller.tabeazy.com')"
              class="py-2 px-6 flex hover:text-black"
            >
              Home
            </a>
            <a
              @click="openExternalUrl('https://tabeazy.com')"
              class="py-2 px-6 flex hover:text-black"
            >
              Store
            </a>
            <a
              @click="openExternalUrl('https://seller.tabeazy.com/support')"
              class="py-2 px-6 flex hover:text-black"
            >
              Support
            </a>
          </nav>
          <button class="lg:hidden flex flex-col ml-4">
            <span class="w-6 h-1 bg-gray-800 dark:bg-white mb-1"> </span>
            <span class="w-6 h-1 bg-gray-800 dark:bg-white mb-1"> </span>
            <span class="w-6 h-1 bg-gray-800 dark:bg-white mb-1"> </span>
          </button>
        </div>
      </div>
    </header>
    <div class="flex relative z-20 items-center">
      <div
        class="container mx-auto px-6 flex flex-col justify-between items-center relative py-4"
      >
        <div class="flex flex-col">
          <img
            src="https://res.cloudinary.com/tabeazy/image/upload/f_auto,q_100,f_auto,h_100,c_fill/v1616145730/logo/logo_primary_text_dark_gxwb9a.png"
            class="w-56 mx-auto"
          />
          <p
            class="text-4xl my-6 text-center dark:text-white pt-10"
            v-if="company"
          >
            Hi, <span class="uppercase">{{ company }}</span> seller
          </p>
          <p class="text-3xl text-center dark:text-white py-6">
            Welcome to Tabeazy Connector!
          </p>
          <h2
            class="max-w-3xl text-5xl md:text-2xl font-bold mx-auto dark:text-white text-gray-800 text-center py-2 pt-10"
          >
            {{ currentAction.message }}
          </h2>
          <div class="bg-white rounded-lg w-72 shadow block p-4 m-auto pt-5" v-if="lastEvent">
            <div>
              <span class="text-xs font-light inline-block py-1 px-2 uppercase rounded-full text-white bg-green-500">
                  Last data sent at {{ lastEventFormatted }}
              </span>
            </div>
          </div>

          <!-- Action -->
          <div
            class="flex items-center justify-center mt-3"
            v-if="currentAction.button"
          >
            <a
              @click="triggerAction()"
              class="uppercase py-2 my-2 px-4 md:mt-10 bg-transparent dark:text-gray-800 dark:bg-white hover:dark:bg-gray-100 border-2 border-gray-800 text-gray-800 dark:text-white hover:bg-gray-800 hover:text-white text-md"
            >
              {{ currentAction.button }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { ipcRenderer, shell } from 'electron';
import moment from 'moment';

import store from '../helpers/store';

export default {
  name: 'Home',
  data: () => ({
    company: null,
    status: 'Idle',
    lastEvent: '',
    lastEventInterval: null,
    actions: [
      {
        status: 'Connecting',
        message: '🚀 Connecting',
        // href: 'https://seller.tabeazy.com',
        // button: 'Visit Support',
      },
      {
        status: 'NoSettings',
        message: '🤔 Settings not found',
        href: 'https://seller.tabeazy.com',
        button: 'Visit Support',
      },
      {
        status: 'InvalidSettings',
        message: '🤔 Settings are invalid',
        href: 'https://seller.tabeazy.com',
        button: 'Visit Support',
      },
      {
        status: 'APITokenInvalid',
        message: '🤔 API expired/invalid',
        href: 'https://seller.tabeazy.com',
        button: 'Visit Support',
      },
      {
        status: 'Success',
        message: '🛸 Synchronization going good',
        action: 'destroyConnector',
        button: 'Stop',
      },
      {
        status: 'Idle',
        message: '🧘 Meditating',
        action: 'startConnector',
        button: 'Start',
      },
    ],
  }),
  async created() {
    await this.startConnector();
  },
  async beforeUnmount() {
    await this.destroyConnector();
  },
  computed: {
    currentAction() {
      const action = this.actions.find((x) => x.status === this.status);
      return action;
    },
    lastEventFormatted() {
      return moment(this.lastEvent).format('MM/DD/YYYY hh:mm');
    },
  },
  methods: {
    triggerAction() {
      if (this.currentAction.href) {
        this.openExternalUrl(this.currentAction.href);
      } else if (this.currentAction.action) {
        this[this.currentAction.action]();
      }
    },
    openExternalUrl(url) {
      shell.openExternal(url);
    },
    async startConnector() {
      try {
        console.log('triggered');
        this.status = 'Connecting';
        const checkForSettingsFile = await ipcRenderer.invoke(
          'checkForSettingsFile',
        );
        console.log(checkForSettingsFile.settingsPath);
        if (!checkForSettingsFile.settings) return (this.status = 'NoSettings');

        const checkForSettingsIntegrity = await ipcRenderer.invoke(
          'checkForSettingsIntegrity',
        );
        if (!checkForSettingsIntegrity) return (this.status = 'InvalidSettings');

        const fetchSeller = await ipcRenderer.invoke('fetchSeller');
        if (!fetchSeller) return (this.status = 'APITokenInvalid');

        this.company = fetchSeller.company.name;

        this.lastEventInterval = setInterval(() => {
          const { date } = store.get('lastEvent');
          if (date) this.lastEvent = date;
        }, (60 - new Date().getSeconds()) * 1000);

        return (this.status = 'Success');
      } catch (err) {
        console.log(err);
        return (this.status = 'Idle');
      }
    },
    async destroyConnector() {
      if (this.status === 'Success') {
        await ipcRenderer.invoke('destroyConnector');
      }

      if (this.lastEventInterval) {
        clearInterval(this.lastEventInterval);
        this.lastEvent = null;
      }

      return (this.status = 'Idle');
    },
  },
};
</script>
