importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// This is required for the service worker to handle background messages
firebase.initializeApp({
  apiKey: "AIzaSyB4asms_LyYqluR9v9EZrKohsvNF7Xqwbo",
  authDomain: "gen-lang-client-0959045190.firebaseapp.com",
  projectId: "gen-lang-client-0959045190",
  storageBucket: "gen-lang-client-0959045190.firebasestorage.app",
  messagingSenderId: "958469007898",
  appId: "1:958469007898:web:7c9a852967b8c2b5b97fa3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
