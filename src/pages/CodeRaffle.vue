<template>
  <q-page class="row no-wrap">
    <q-tabs v-model="tab" vertical>
      <q-tab name="options" label="Options" :icon="ionCogOutline" />
      <q-tab name="raffle" label="Raffle" :icon="ionDiceOutline" />
    </q-tabs>
    <q-separator vertical />
    <q-tab-panels v-model="tab" animated vertical class="col">
      <q-tab-panel name="options">
        <div class="q-ma-xl q-pa-md page-width">
          <div class="text-h4">Code Raffle</div>
          <p>
            Select active chat members randomly as a raffle. Winners are automatically sent a
            message via a Twitch whisper. You must keep this tab open for this tool to function.
          </p>
          <q-banner class="bg-warning">
            Twitch limits each account to whispering 40 distinct users per day. This tool will not
            be able to send messages after that.
          </q-banner>
          <q-form class="q-mb-md">
            <div class="text-h6">Setup</div>
            <twitch-signin
              v-model="config.twitchAuth"
              hint="Twitch account to use to interact with chat. If you want to use a bot account, log in as the bot here."
              required
            />
            <twitch-channel-selection
              v-model="config.channelName"
              v-model:user-id="config.twitchUserId"
              label="Twitch Channel"
              hint="Twitch channel to monitor for messages. This is the account where the stream is run on."
              required
            />
            <q-input
              v-model="config.command"
              label="Join command"
              hint="Command chat members will use to join the raffle."
              prefix="!"
            />
            <q-input
              v-model="config.message.whisper"
              label="Whisper Template"
              hint="The message to whisper to raffle winners. Use $SECRET in place of the secret code, which will be replace when the message is sent. The secret code can be set on the raffle tab!"
            />
            <q-input
              v-model="config.message.open"
              label="Entry Open Message"
              hint="The message to send in chat when raffle opens. If this is blank, nothing will be sent."
            />
            <q-input
              v-model="config.message.closed"
              label="Entry Closed Message"
              hint="The message to send in chat when raffle closes. If this is blank, nothing will be sent."
            />
            <q-input
              v-model="config.message.winners"
              label="Winners Message"
              hint="The message to send in chat when winners are chosen. If this is blank, nothing will be sent. Use $WINNERS in place of the winners' names."
            />
            <q-checkbox
              v-model="config.previewWinners"
              label="After rolling, preview the list of winners before sending out any messages."
            />
            <div class="text-h6 q-mt-lg">Raffle Eligibility and Luck</div>
            <p>
              A person's highest category determines their luck factors. If someone is in multiple
              categories (e.g. subscriber and vip), the highest luck value is used. Set a category's
              luck to zero to prevent them from entering.
            </p>
            <div class="row" v-for="cat in luckSliders" :key="cat.key">
              <div class="col-2">{{ cat.label }}</div>
              <q-slider
                class="col-6"
                v-model="config.luck[cat.key]"
                label
                :min="0"
                :max="10"
                :step="0.1"
              />
            </div>

            <div class="text-h6 q-mt-lg">Dynamic Luck</div>
            <p>
              Decrease an entry's luck if they have won previously. This information is kept
              persistently between raffles, even if you clear entries.
            </p>
            <div class="row">
              <div class="col-2">Decrease luck by</div>
              <q-slider
                class="col-6"
                v-model="config.dynamicLuck.decreaseFactor"
                label
                :min="0"
                :max="0.9"
                :step="0.1"
              />
            </div>
            <q-option-group
              inline
              v-model="config.dynamicLuck.decreaseMode"
              :options="[
                { label: 'flat reduction', value: 'once' },
                { label: 'stacked reduction for each additional win', value: 'stacked' },
              ]"
            />
            <q-btn class="q-mt-sm" :icon="ionColorWandOutline" @click="clearHistory">
              Clear Selection History
            </q-btn>
          </q-form>
        </div>
      </q-tab-panel>
      <q-tab-panel name="raffle" class="q-pa-none">
        <q-splitter v-model="splitLocation" :limits="[30, 60]" class="fit">
          <template #before>
            <div class="column fit">
              <div class="row q-gutter-sm justify-center q-pa-sm">
                <q-btn v-if="!entryOpen" color="positive" @click="startEntry" :icon="ionPlayOutline"
                  >Open Entry</q-btn
                >
                <q-btn v-if="entryOpen" color="negative" @click="stopEntry" :icon="ionCloseOutline"
                  >Close Entry</q-btn
                >
                <q-btn :disable="entryOpen" :icon="ionTrashOutline" @click="clearEntries"
                  >Clear Entries</q-btn
                >
              </div>
              <q-separator />
              <div class="q-mx-sm row items-center">
                <q-input
                  class="col-10"
                  :bg-color="filterText && 'warning'"
                  v-model="filterText"
                  borderless
                  dense
                  clearable
                  label="Search Users"
                >
                  <template #prepend><q-icon :name="ionSearchOutline" /></template>
                </q-input>
                <div class="col-2">{{ config.entries.length }} total</div>
              </div>
              <q-separator />
              <q-scroll-area class="col-grow" ref="userListScroll">
                <!-- User List -->
                <q-list>
                  <q-item v-for="user in displayedUsers" :key="user.username" clickable>
                    <q-item-section>
                      <div class="row q-gutter-x-md items-center">
                        <div class="text-grey text-caption">{{ user.joinTime }}</div>
                        <q-avatar
                          v-for="role in user.roles"
                          :key="role"
                          :color="
                            role === 'mod'
                              ? 'green'
                              : role === 'vip'
                              ? 'pink'
                              : role === 'sub'
                              ? 'purple'
                              : 'white'
                          "
                          text-color="white"
                          rounded
                          :icon="
                            role === 'mod'
                              ? mdiSword
                              : role === 'vip'
                              ? ionDiamondOutline
                              : role === 'sub'
                              ? ionStar
                              : 'none'
                          "
                          size="sm"
                          font-size="1em"
                        />
                        <div>{{ user.username }}</div>
                      </div>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-btn
                        :icon="ionCloseOutline"
                        flat
                        padding="none"
                        color="negative"
                        @click="removeEntry(user.username)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-scroll-area>
            </div>
          </template>
          <template #after>
            <div class="q-pa-xl page-width column q-gutter-md">
              <reveal-password-input
                v-model="config.secret"
                label="Secret value"
                hint="The secret value to add to the message template and whisper to winners."
              />
              <slider-field
                v-model="config.raffleCount"
                label="Number of winners to draw"
                :min="1"
                :max="20"
              />
              <q-btn
                size="lg"
                color="primary"
                :icon="ionDiceOutline"
                :disable="entryOpen || config.entries.length < config.raffleCount"
                @click="roll()"
              >
                Roll!
              </q-btn>
              <template v-if="config.pendingEntries.length">
                <q-list bordered>
                  <q-item v-for="user in config.pendingEntries" :key="user.userId" clickable>
                    <q-item-section>{{ user.username }}</q-item-section>
                    <q-item-section avatar v-if="config.status === 'confirmed'">
                      <q-btn flat @click="sendWhisperMessage(user.userId)">Resend</q-btn>
                    </q-item-section>
                  </q-item>
                </q-list>
                <q-btn
                  v-if="config.previewWinners"
                  size="lg"
                  color="positive"
                  :icon="ionSendOutline"
                  :disable="config.status === 'confirmed'"
                  :loading="config.status === 'sending'"
                  @click="confirm()"
                >
                  Confirm and Send!
                </q-btn>
              </template>
            </div>
          </template>
        </q-splitter>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import TwitchSignin from 'src/components/TwitchSignin.vue';
import TwitchChannelSelection from 'src/components/TwitchChannelSelection.vue';
import RevealPasswordInput from 'src/components/RevealPasswordInput.vue';
import SliderField from 'src/components/SliderField.vue';
import {
  ionColorWandOutline,
  ionCloseOutline,
  ionSearchOutline,
  ionPlayOutline,
  ionTrashOutline,
  ionDiamondOutline,
  ionStar,
  ionCogOutline,
  ionDiceOutline,
  ionSendOutline,
} from '@quasar/extras/ionicons-v6';
import { useStorage } from '@vueuse/core';
import { ref } from 'vue';
import { QScrollArea, useQuasar } from 'quasar';
import { mdiSword } from '@quasar/extras/mdi-v7';
import { computed } from 'vue';
import { TmiClientWrapper } from 'src/api/twitch';
import { sendWhisper } from 'src/api/twitch';
import { HTTPError } from 'ky';

type ChatRole = 'none' | 'sub' | 'vip' | 'mod';

interface RaffleEntry {
  userId: string;
  username: string;
  roles: ChatRole[];
  joinTime: string;
  prob: number;
}

interface CodeRaffleOptions {
  channelName: string;
  twitchAuth?: { username: string; token: string };
  twitchUserId?: number;
  command: string;
  entries: RaffleEntry[];
  pendingEntries: RaffleEntry[];
  previousEntryCounts: { [username: string]: number };
  message: {
    whisper: string;
    winners: string;
    open: string;
    closed: string;
  };
  secret: string;
  raffleCount: number;
  luck: { [role in ChatRole]: number };
  dynamicLuck: {
    decreaseFactor: number;
    decreaseMode: 'once' | 'stacked';
  };
  previewWinners: boolean;
  status: 'pending' | 'sending' | 'confirmed';
}

const config = useStorage<CodeRaffleOptions>('codeRaffle.config', {
  channelName: '',
  entries: [],
  pendingEntries: [],
  previousEntryCounts: {},
  command: 'join',
  message: {
    whisper: 'You won the raffle! Join our game at https://jackbox.tv and enter room code $SECRET',
    winners: 'The winners have been chosen! They are: $WINNERS',
    open: 'The raffle is open!',
    closed: 'The raffle is now closed!',
  },
  secret: 'XXXX',
  raffleCount: 3,
  luck: {
    none: 1,
    sub: 1,
    vip: 1,
    mod: 1,
  },
  dynamicLuck: {
    decreaseFactor: 0.1,
    decreaseMode: 'once',
  },
  previewWinners: false,
  status: 'pending',
});
const filterText = ref('');
const entryOpen = ref(false);
const tab = ref('options');
const splitLocation = ref(30);
const userListScroll = ref<QScrollArea>();
const quasar = useQuasar();
const luckSliders: Array<{ label: string; key: ChatRole }> = [
  { label: 'Moderator', key: 'mod' },
  { label: 'VIP', key: 'vip' },
  { label: 'Subscriber', key: 'sub' },
  { label: 'Everyone Else', key: 'none' },
];
const displayedUsers = computed(() =>
  config.value.entries.filter(
    (user) =>
      !filterText.value.trim() ||
      user.username.toLowerCase().includes(filterText.value.toLowerCase().trim())
  )
);
const chat = new TmiClientWrapper();

chat.on('chat', (channel, userstate, message, self) => {
  if (
    !self &&
    entryOpen.value &&
    message === '!' + config.value.command &&
    userstate['display-name']
  ) {
    if (!config.value.entries.find((u) => u.username === userstate['display-name'])) {
      let prob = config.value.luck.none,
        roles: ChatRole[] = [];
      if (userstate.mod) {
        prob = Math.max(prob, config.value.luck.mod);
        roles.push('mod');
      }
      if (userstate.vip) {
        prob = Math.max(prob, config.value.luck.vip);
        roles.push('vip');
      }
      if (userstate.subscriber) {
        prob = Math.max(prob, config.value.luck.sub);
        roles.push('sub');
      }
      if (
        config.value.dynamicLuck.decreaseMode === 'once' &&
        config.value.previousEntryCounts[userstate['display-name']]
      ) {
        prob *= 1.0 - config.value.dynamicLuck.decreaseFactor;
      } else if (config.value.dynamicLuck.decreaseMode === 'stacked') {
        const wins = config.value.previousEntryCounts[userstate['display-name']] ?? 0;
        prob *= Math.pow(1.0 - config.value.dynamicLuck.decreaseFactor, wins);
      }

      config.value.entries.push({
        username: userstate['display-name'],
        userId: userstate['user-id'] as string,
        joinTime: new Date().toLocaleTimeString(),
        roles,
        prob,
      });
      userListScroll.value?.setScrollPercentage('vertical', 1, 100);
    }
  }
});

function clearHistory() {
  config.value.previousEntryCounts = {};
}

function clearEntries() {
  config.value.entries = [];
}

function removeEntry(username: string) {
  config.value.entries = config.value.entries.filter((u) => u.username !== username);
}

async function startEntry() {
  if (!config.value.twitchAuth?.token || !config.value.channelName) {
    quasar.notify({
      message: 'You must log in to twitch and select a channel before opening the raffle.',
      color: 'negative',
    });
    return;
  }

  try {
    chat.setAuth(
      [config.value.channelName],
      config.value.twitchAuth?.username,
      config.value.twitchAuth?.token
    );
    await chat.connect();
    if (config.value.message.open) {
      await chat.say(config.value.channelName, config.value.message.open);
    }
  } catch (error) {
    quasar.notify({
      message: 'Error communicating with twitch: ' + error,
      color: 'negative',
    });
  }

  entryOpen.value = true;
}

async function stopEntry() {
  if (config.value.message.closed) {
    await chat.say(config.value.channelName, config.value.message.closed);
  }
  entryOpen.value = false;
}

function roll() {
  // Compute cumulative probabilities
  const cumulativeProbs = config.value.entries.reduce<number[]>((accum, user) => {
    accum.push((accum[accum.length - 1] ?? 0) + user.prob);
    return accum;
  }, []);
  // Generate random numbers until we get enough distinct elements
  const indices: number[] = [];
  while (indices.length < config.value.raffleCount) {
    const randNum = Math.random() * cumulativeProbs[cumulativeProbs.length - 1];
    const index = cumulativeProbs.findIndex((i) => i >= randNum);
    console.log(cumulativeProbs, randNum, index);
    if (!indices.includes(index)) {
      indices.push(index);
    }
  }
  console.log(indices);
  config.value.pendingEntries = indices.map((i) => config.value.entries[i]);
  if (!config.value.previewWinners) {
    confirm();
  }
  config.value.status = 'pending';
}

async function sendWhisperMessage(userId: string) {
  try {
    // use a direct call because all twitch libs still use the old /w command that twitch no longer supports.
    await sendWhisper(userId, config.value.message.whisper.replace('$SECRET', config.value.secret));
  } catch (error) {
    let reason = `${error}`;
    if (error instanceof HTTPError) {
      reason = (await error.response.json()).message;
    }
    quasar.notify({ message: 'Error whispering user: ' + reason, color: 'negative' });
  }
}

async function confirm() {
  // Send whispers
  config.value.status = 'sending';
  config.value.pendingEntries.forEach((u, index) =>
    // Twitch api allows 3 whispers per second; only run 2/sec in case of rate limiting
    setTimeout(() => sendWhisperMessage(u.userId), index * 500)
  );
  if (config.value.message.winners) {
    chat.say(
      config.value.channelName,
      config.value.message.winners.replace(
        '$WINNERS',
        config.value.pendingEntries.map((e) => e.username).join(', ')
      )
    );
  }
  config.value.status = 'confirmed';
}
</script>
