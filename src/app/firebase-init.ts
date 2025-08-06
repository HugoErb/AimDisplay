// src/app/firebase-init.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { environment } from '../environments/environment';

// Initialise Firebase une seule fois (protection contre multiple instanciations)
const firebaseApp = !getApps().length ? initializeApp(environment.firebase) : getApps()[0];
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

export { firebaseApp, auth, storage };
