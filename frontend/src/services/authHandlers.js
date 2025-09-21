
// This module is a bit of a hack to break a circular dependency between AuthContext and the api service.
// It provides a way for the api service to call back into AuthContext for logout and token refresh.

export let logoutHandler = () => {};
export let csrfTokenHandler = () => {};
export let isRefreshing = false;
export let failedQueue = [];

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

export const setCsrfTokenHandler = (handler) => {
  csrfTokenHandler = handler;
};

export const setIsRefreshing = (value) => {
  isRefreshing = value;
};

export const getFailedQueue = () => failedQueue;

export const addToFailedQueue = (request) => {
  failedQueue.push(request);
};

export const clearFailedQueue = () => {
  failedQueue = [];
};
