import axios from 'axios';
import { loadAsyncResource } from '@/libs/asyncResource';

export async function fetchAll (store) {
  return loadAsyncResource({
    store,
    path: 'adventures',
    url: '/api/v4/adventures/user',
    deserialize (response) {
      return response.data.data;
    },
  });
}

export async function create (store, adventureData) {
  const response = await axios.post('/api/v4/adventures/user', adventureData);

  // Add the new adventure to the store
  if (store.state.adventures.data) {
    store.state.adventures.data.unshift(response.data.data);
  }

  return response.data.data;
}

export async function update (store, { adventureId, updates }) {
  const response = await axios.put(`/api/v4/adventures/${adventureId}`, updates);

  // Update the adventure in the store
  if (store.state.adventures.data) {
    const index = store.state.adventures.data.findIndex(a => a._id === adventureId);
    if (index !== -1) {
      store.state.adventures.data.splice(index, 1, response.data.data);
    }
  }

  return response.data.data;
}

export async function archive (store, adventureId) {
  await axios.delete(`/api/v4/adventures/${adventureId}`);

  // Remove the adventure from the store
  if (store.state.adventures.data) {
    const index = store.state.adventures.data.findIndex(a => a._id === adventureId);
    if (index !== -1) {
      store.state.adventures.data.splice(index, 1);
    }
  }
}

export async function joinByCode (store, inviteCode) {
  const response = await axios.post('/api/v4/adventures/join/code', { inviteCode });

  // Add the joined adventure to the store
  if (store.state.adventures.data) {
    store.state.adventures.data.unshift(response.data.data);
  }

  return response.data.data;
}

export async function leave (store, adventureId) {
  await axios.post(`/api/v4/adventures/${adventureId}/leave`);

  // Remove the adventure from the store
  if (store.state.adventures.data) {
    const index = store.state.adventures.data.findIndex(a => a._id === adventureId);
    if (index !== -1) {
      store.state.adventures.data.splice(index, 1);
    }
  }
}

export async function getDetails (store, adventureId) {
  const response = await axios.get(`/api/v4/adventures/${adventureId}`);
  return response.data.data;
}

export async function getTasks (store, adventureId) {
  const response = await axios.get(`/api/v4/adventures/${adventureId}/tasks`);
  return response.data.data;
}

export async function kickMember (store, { adventureId, userId }) {
  const response = await axios.post(`/api/v4/adventures/${adventureId}/members/${userId}/kick`);
  return response.data.data;
}

export async function deleteAdventure (store, adventureId) {
  await axios.delete(`/api/v4/adventures/${adventureId}/delete`);

  // Remove the adventure from the store
  if (store.state.adventures.data) {
    const index = store.state.adventures.data.findIndex(a => a._id === adventureId);
    if (index !== -1) {
      store.state.adventures.data.splice(index, 1);
    }
  }
}

export async function createCharacter (store, { adventureId, name, class: characterClass, preferences, gear}) {
  const response = await axios.post(`/api/v4/adventures/${adventureId}/character/create`, {
    name,
    class: characterClass,
    preferences,
    equipment: gear?.equipped || {},
  });

  return response.data.data;
}

export async function getCharacter (store, adventureId) {
  const response = await axios.get(`/api/v4/adventures/${adventureId}/character`);
  return response.data.data;
}

export async function getAdventureCharacters(store, adventureId) {
  const response = await axios.get(`/api/v4/adventures/${adventureId}/characters`);
  const characters = response.data.data;
  console.log('Fetched adventure characters:', characters);
  store.state.adventureCharacters = characters;
  console.log('Store adventureCharacters set to:', store.state.adventureCharacters);
  return characters;
}

export async function equipStarterGear(store, adventureId) {
  const response = await axios.post(`/api/v4/adventures/${adventureId}/character/equip-starter-gear`);
  return response.data.data;
}

// Adventure Task Actions
export async function createAdventureTask(store, { adventureId, taskData }) {
  const response = await axios.post(`/api/v4/adventures/${adventureId}/tasks`, taskData);
  return response.data.data;
}

export async function getAdventureTasks(store, { adventureId, status }) {
  const url = status
    ? `/api/v4/adventures/${adventureId}/tasks?status=${status}`
    : `/api/v4/adventures/${adventureId}/tasks`;
  const response = await axios.get(url);
  return response.data.data;
}

export async function updateAdventureTask(store, { adventureId, taskId, updates }) {
  const response = await axios.put(`/api/v4/adventures/${adventureId}/tasks/${taskId}`, updates);
  return response.data.data;
}

export async function deleteAdventureTask(store, { adventureId, taskId }) {
  await axios.delete(`/api/v4/adventures/${adventureId}/tasks/${taskId}`);
}

export async function syncTaskToPersonal(store, { adventureId, taskId }) {
  const response = await axios.post(`/api/v4/adventures/${adventureId}/tasks/${taskId}/sync`);
  return response.data.data;
}

export async function unsyncTaskFromPersonal(store, { adventureId, taskId }) {
  await axios.delete(`/api/v4/adventures/${adventureId}/tasks/${taskId}/sync`);
}