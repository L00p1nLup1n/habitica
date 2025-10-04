export function adventures (state) {
  return state.adventures.data || [];
}

export function adventuresLoading (state) {
  return state.adventures.loading;
}

export function adventuresError (state) {
  return state.adventures.error;
}

export function activeAdventures (state) {
  return (state.adventures.data || []).filter(adventure => !adventure.archived);
}

export function archivedAdventures (state) {
  return (state.adventures.data || []).filter(adventure => adventure.archived);
}

export function getAdventureById (state) {
  return adventureId => {
    if (!state.adventures.data) return null;
    return state.adventures.data.find(adventure => adventure._id === adventureId);
  };
}
