<template>
  <transition-group>
    <div v-for="timer in state" :key="timer.title" class="timer-container">
      <div class="time" :class="{ done: timer.done }">{{ timer.time }}</div>
      <div class="title">{{ timer.title }}</div>
    </div>
  </transition-group>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { onMounted, onUnmounted, ref } from 'vue';
import ComfyJs, { OnMessageFlags } from 'comfy.js';
import Duration from '@icholy/duration';
import ComfyJS from 'comfy.js';

export interface TimerWidgetOptions {
  preview?: boolean;
  twitchAuth?: { username: string; token: string };
  channelName: string;
  colors: {
    time: string;
    done: string;
    border: string;
    shadow: string;
    text: string;
    textShadow: string;
  };
  size: {
    time: number;
    title: number;
  };
  animationSpeed: number;
  textAlign: 'left' | 'right';
  minRole: 'broadcaster' | 'moderator' | 'vip' | 'subscriber';
}

interface TimerData {
  time: number;
  direction: 'up' | 'down';
  title: string;
}

interface TimerState {
  time: string;
  done: boolean;
  title: string;
}

const props = defineProps<TimerWidgetOptions>();
const timerData = useStorage<TimerData[]>('timer.state', []);
const state = ref<TimerState[]>([]);
let connected = false;

let interval = -1;
onMounted(async () => {
  if (props.preview) {
    state.value = [
      { time: '00:00', done: true, title: 'Test Timer: Done' },
      { time: '1:23:45', done: false, title: 'Test Timer: Not Done' },
      { time: '1:23:45:00', done: false, title: 'Test Timer: Long' },
    ];
  } else {
    interval = window.setInterval(updateState, 500);
    if (props.twitchAuth) {
      ComfyJs.Init(props.twitchAuth.username, props.twitchAuth.token, props.channelName);
    } else {
      ComfyJs.Init(props.channelName);
    }
  }
});

onUnmounted(() => {
  clearInterval(interval);
  if (connected) ComfyJs.Disconnect();
});

function hasPermissions(userFlags: OnMessageFlags) {
  switch (props.minRole) {
    case 'broadcaster':
      return userFlags.broadcaster;
    case 'moderator':
      return userFlags.broadcaster || userFlags.mod;
    case 'vip':
      return userFlags.broadcaster || userFlags.mod || userFlags.vip;
    case 'subscriber':
      return userFlags.broadcaster || userFlags.mod || userFlags.vip || userFlags.subscriber;
  }
}

function reply(user: string, message: string) {
  if (props.twitchAuth) {
    ComfyJs.Say(`@${user} -> ${message}`, props.channelName);
  }
}

ComfyJs.onCommand = (user, command, message, flags) => {
  if (!hasPermissions(flags)) {
    reply(user, "You can't do that.");
    return;
  }
  switch (command) {
    case 'timer':
      const [firstToken, ...restTokens] = message.split(/\s+/);
      const title = restTokens.length ? restTokens.join(' ') : '';
      if (firstToken === 'off') {
        removeTimer(title);
      } else {
        addTimer(firstToken, title);
      }
  }
};

ComfyJS.onConnected = () => (connected = true);

/** Update the state timers are drawn based on */
function updateState() {
  const now = Date.now();
  state.value = timerData.value.map(({ time, title, direction }) => {
    const durationMs = direction === 'down' ? time - now : now - time;
    const formatted = formatTime(durationMs);
    return { time: formatted, done: durationMs < 100, title };
  });
}

function padNumber(num: number) {
  return num.toString().padStart(2, '0');
}

/** Formats time as days:hours:minutes:seconds */
function formatTime(milliseconds: number) {
  if (milliseconds > 500) {
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const hours = Math.floor(milliseconds / (60 * 60 * 1000)) % 24;
    const minutes = Math.floor(milliseconds / (60 * 1000)) % 60;
    const seconds = Math.floor(milliseconds / 1000) % 60;
    let formatted = '';
    if (days > 0) {
      formatted += days.toString() + ':';
    }
    if (hours > 0) {
      formatted += padNumber(hours) + ':';
    }
    formatted += padNumber(minutes) + ':' + padNumber(seconds);
    return formatted;
  } else {
    return '00:00';
  }
}

function addTimer(duration: string, title: string) {
  let newTimer: TimerData;
  if (duration === 'up') {
    newTimer = { time: Date.now(), direction: 'up', title };
  } else {
    const durationMs = Duration.parse(duration).milliseconds();
    newTimer = { time: Date.now() + durationMs + 500, direction: 'down', title };
    // extra half second buffer
  }
  const existingIndex = timerData.value.findIndex((t) => t.title === title);
  if (existingIndex > -1) {
    timerData.value[existingIndex] = newTimer;
    return 'Replaced timer with the same name.';
  } else {
    timerData.value.push(newTimer);
  }
}

function removeTimer(title: string) {
  // See if a timer with the given title can be found
  let index = timerData.value.findIndex((timer) => timer.title === title);
  if (index === -1) {
    index = parseInt(title[0]) - 1;
  }
  if (index >= 0 && index < timerData.value.length) {
    timerData.value.splice(index, 1);
  }
}
</script>

<style scoped lang="sass">
@import url('https://fonts.cdnfonts.com/css/digital-7-mono')
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap')

.timer-container
  margin-bottom: 12px
  text-align: v-bind("$props.textAlign")
  width: 100%

.time
  color: v-bind("$props.colors.time")
  -webkit-text-stroke: 1px v-bind("$props.colors.border")
  text-shadow: 4px 4px v-bind("$props.colors.shadow")
  font-family: "Digital-7 Mono", "Courier New", monospace
  font-size: v-bind("$props.size.time + 'px'")
  line-height: v-bind("$props.size.time * 0.8 + 'px'")

  &.done
    @keyframes flash
      0%, 40%
        color: v-bind("$props.colors.time")
      50%, 90%
        color: v-bind("$props.colors.done")
    animation: flash v-bind("$props.animationSpeed + 'ms'") infinite

.title
  color: v-bind("$props.colors.text")
  text-shadow: 3px 3px v-bind("$props.colors.textShadow")
  font-family: 'Bebas Neue', sans-serif
  font-size: v-bind("$props.size.title + 'px'")
  line-height: v-bind("$props.size.title * 0.9 + 'px'")
  width: 100%

.v-enter-active, .v-leave-active
  transition: all 0.5s ease

.v-enter-from, .v-leave-to
  opacity: 0
  transform: translateX(80px)
</style>
