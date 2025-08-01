// Initialise Firebase sans @angular/fire
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '../environments/environment';

const firebaseApp = initializeApp(firebaseConfig.firebase);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

export { firebaseApp, auth, storage };
