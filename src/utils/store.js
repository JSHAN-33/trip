import React from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase config — reusing existing project, data lives under trips/
const firebaseConfig = {
  apiKey: "AIzaSyCvIr8q_ghk9FgbP7E1vO_qMYN9HhiyNOg",
  authDomain: "korea-seoul.firebaseapp.com",
  databaseURL: "https://korea-seoul-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "korea-seoul",
  storageBucket: "korea-seoul.firebasestorage.app",
  messagingSenderId: "786613591410",
  appId: "1:786613591410:web:99c5cde8d07a5467ce11eb",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

// ── Upload image to Firebase Storage ──
export async function uploadImage(file) {
  const ext = file.name.split('.').pop();
  const path = `trip/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

// ── Unique ID generator ──
let idCounter = Date.now();
export function uid() {
  return (idCounter++).toString(36);
}

// ── Firebase array fix (converts {0: x, 1: y} back to arrays) ──
function fixArrays(val) {
  if (val === null || val === undefined || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(fixArrays);
  const keys = Object.keys(val);
  const isArrayLike = keys.length > 0 && keys.every((k, i) => String(i) === k);
  if (isArrayLike) return keys.map(k => fixArrays(val[k]));
  const result = {};
  for (const k of keys) result[k] = fixArrays(val[k]);
  return result;
}

// ── Deep merge: fill missing keys from defaults ──
function deepMerge(defaults, data) {
  if (!data) return JSON.parse(JSON.stringify(defaults));
  if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults)) return data;
  data = fixArrays(data);
  if (typeof data !== 'object' || Array.isArray(data)) return data;
  const result = {};
  for (const key of Object.keys(defaults)) {
    const dVal = defaults[key];
    const sVal = data[key];
    if (sVal === undefined || sVal === null) {
      result[key] = JSON.parse(JSON.stringify(dVal));
    } else if (Array.isArray(dVal)) {
      result[key] = Array.isArray(sVal) ? sVal : Object.values(sVal);
    } else if (dVal !== null && typeof dVal === 'object' && !Array.isArray(dVal)) {
      result[key] = deepMerge(dVal, sVal);
    } else {
      result[key] = sVal;
    }
  }
  for (const key of Object.keys(data)) {
    if (!(key in result)) result[key] = data[key];
  }
  return result;
}

function cleanForFirebase(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ── Default trip data ──
export function createDefaultTripData(opts = {}) {
  const days = opts.days || 5;
  const itinerary = {};
  for (let i = 1; i <= days; i++) itinerary[`day${i}`] = [];

  return {
    name: opts.name || 'My Trip',
    country: opts.country || 'KR',
    currency: opts.currency || 'KRW',
    currencySymbol: opts.currencySymbol || '\u20a9',
    exchangeRate: opts.exchangeRate || 0.0235,
    themeId: opts.themeId || 'cocoaBlue',
    days,
    nights: opts.nights || Math.max(days - 1, 0),
    members: [],
    luggage: {},
    info: {
      flights: [
        { id: 'f1', type: 'outbound', date: '', flightNo: '', airline: '', depTime: '', arrTime: '', depCode: '', depName: '', arrCode: '', arrName: '' },
        { id: 'f2', type: 'inbound', date: '', flightNo: '', airline: '', depTime: '', arrTime: '', depCode: '', depName: '', arrCode: '', arrName: '' },
      ],
      accommodations: [],
    },
    itinerary,
    mustBuy: { shared: [], personal: {} },
    expenses: { shared: [], personal: {} },
    createdAt: new Date().toISOString(),
  };
}

// ── Trip store (per-trip state management) ──
const tripStores = {};

function getTripStore(tripId) {
  if (tripStores[tripId]) return tripStores[tripId];

  const dataRef = ref(db, `trips/${tripId}`);
  const store = {
    listeners: new Set(),
    cachedData: null,
    loaded: false,
    unsub: null,
  };

  store.unsub = onValue(dataRef, (snapshot) => {
    const val = snapshot.val();
    const defaults = createDefaultTripData();
    store.cachedData = val ? deepMerge(defaults, val) : null;
    store.loaded = true;
    store.listeners.forEach(fn => fn(store.cachedData));
  });

  tripStores[tripId] = store;
  return store;
}

export function getTripData(tripId) {
  const store = getTripStore(tripId);
  return store.cachedData;
}

export function setTripData(tripId, updater) {
  const store = getTripStore(tripId);
  const current = store.cachedData;
  if (!current) return;

  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  store.cachedData = next;
  store.listeners.forEach(fn => fn(next));

  const dataRef = ref(db, `trips/${tripId}`);
  set(dataRef, cleanForFirebase(next));
  return next;
}

export function subscribeTripData(tripId, fn) {
  const store = getTripStore(tripId);
  store.listeners.add(fn);
  return () => store.listeners.delete(fn);
}

// ── React hook for trip data ──
export function useTripStore(tripId) {
  const [data, setLocalData] = React.useState(() => getTripData(tripId));

  React.useEffect(() => {
    if (!tripId) return;
    const unsub = subscribeTripData(tripId, setLocalData);
    setLocalData(getTripData(tripId));
    return unsub;
  }, [tripId]);

  const update = React.useCallback(
    (updater) => setTripData(tripId, updater),
    [tripId]
  );

  return [data, update];
}

// ── Create a new trip in Firebase ──
export async function createTrip(tripId, opts) {
  const data = createDefaultTripData(opts);
  const dataRef = ref(db, `trips/${tripId}`);
  await set(dataRef, cleanForFirebase(data));
  return data;
}

// ── Check if a trip exists ──
export function checkTripExists(tripId) {
  return new Promise((resolve) => {
    const dataRef = ref(db, `trips/${tripId}`);
    const unsub = onValue(dataRef, (snapshot) => {
      resolve(snapshot.exists());
      unsub();
    }, { onlyOnce: true });
  });
}

// ── My Trips (localStorage) ──
const MY_TRIPS_KEY = 'trip-my-trips';

export function getMyTrips() {
  try {
    return JSON.parse(localStorage.getItem(MY_TRIPS_KEY)) || [];
  } catch {
    return [];
  }
}

export function addMyTrip(trip) {
  const trips = getMyTrips().filter(t => t.id !== trip.id);
  trips.unshift(trip);
  localStorage.setItem(MY_TRIPS_KEY, JSON.stringify(trips));
}

export function removeMyTrip(tripId) {
  const trips = getMyTrips().filter(t => t.id !== tripId);
  localStorage.setItem(MY_TRIPS_KEY, JSON.stringify(trips));
}

// ── Nickname (per-trip, localStorage) ──
export function getTripNickname(tripId) {
  return localStorage.getItem(`trip-user-${tripId}`) || null;
}

export function setTripNickname(tripId, name) {
  localStorage.setItem(`trip-user-${tripId}`, name);
}

// ── Currency conversion helpers ──
export function foreignToTwd(amount, rate) {
  return Math.round(amount * rate);
}

export function twdToForeign(twd, rate) {
  return Math.round(twd / rate);
}

// ── Settlement calculation ──
export function calculateSettlements(expenses, members) {
  if (!expenses.length || !members.length) return [];

  const balances = {};
  members.forEach(m => (balances[m] = 0));

  expenses.forEach(exp => {
    const splitPeople = exp.splitAmong?.length ? exp.splitAmong : members;
    const perPerson = exp.amountTWD / splitPeople.length;

    if (balances[exp.paidBy] !== undefined) {
      balances[exp.paidBy] += exp.amountTWD - perPerson;
    }
    splitPeople.forEach(person => {
      if (person !== exp.paidBy && balances[person] !== undefined) {
        balances[person] -= perPerson;
      }
    });
  });

  const settlements = [];
  const debtors = Object.entries(balances).filter(([, v]) => v < -0.5).sort((a, b) => a[1] - b[1]);
  const creditors = Object.entries(balances).filter(([, v]) => v > 0.5).sort((a, b) => b[1] - a[1]);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i][1], creditors[j][1]);
    if (amount > 0.5) {
      settlements.push({ from: debtors[i][0], to: creditors[j][0], amount: Math.round(amount) });
    }
    debtors[i][1] += amount;
    creditors[j][1] -= amount;
    if (Math.abs(debtors[i][1]) < 0.5) i++;
    if (Math.abs(creditors[j][1]) < 0.5) j++;
  }

  return settlements;
}
