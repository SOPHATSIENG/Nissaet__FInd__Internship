const STEP1_KEY = 'registrationStep1';
const STEP2_KEY = 'registrationStep2';
const ROLE_KEY = 'registrationRole';

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

export const registrationStorage = {
  getStep1() {
    return parseJson(localStorage.getItem(STEP1_KEY));
  },

  setStep1(payload) {
    localStorage.setItem(STEP1_KEY, JSON.stringify(payload));
  },

  getStep2() {
    return parseJson(localStorage.getItem(STEP2_KEY));
  },

  setStep2(payload) {
    localStorage.setItem(STEP2_KEY, JSON.stringify(payload));
  },

  clearStep2() {
    localStorage.removeItem(STEP2_KEY);
  },

  getRole() {
    return localStorage.getItem(ROLE_KEY);
  },

  setRole(role) {
    localStorage.setItem(ROLE_KEY, role);
  },

  clearAll() {
    localStorage.removeItem(STEP1_KEY);
    localStorage.removeItem(STEP2_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
};
