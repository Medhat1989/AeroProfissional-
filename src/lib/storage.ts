// Simple IndexedDB wrapper for storing large candidate data (including base64 media)
const DB_NAME = 'AeroProfessionalDB';
const STORE_NAME = 'candidates';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveCandidates = async (candidates: any[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // We store the whole array as one entry for simplicity, similar to localStorage
    await new Promise((resolve, reject) => {
      const request = store.put(candidates, 'current_list');
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB Save Error:', err);
    // Fallback to localStorage for small data if IDB fails (unlikely)
    try {
      localStorage.setItem('aeroprofessional_candidates', JSON.stringify(candidates));
    } catch (lsErr) {
      console.warn('All storage options exhausted.');
    }
  }
};

export const loadCandidates = async (): Promise<any[] | null> => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.get('current_list');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB Load Error:', err);
    const saved = localStorage.getItem('aeroprofessional_candidates');
    return saved ? JSON.parse(saved) : null;
  }
};
