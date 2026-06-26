import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8UAietSudETUsm3WfH68yDAxeSf-3cP0",
  authDomain: "noah-setlist-game.firebaseapp.com",
  projectId: "noah-setlist-game",
  storageBucket: "noah-setlist-game.firebasestorage.app",
  messagingSenderId: "301280157264",
  appId: "1:301280157264:web:9c31e405aa002634397b55"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);