export const IDBHelper = {
    db: null,

    async init(dbName, version, storeName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },

    async put(storeName, value, key) {
        if (!this.db) await this.init('photo', 1, storeName);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const req = key ? store.put(value, key) : store.put(value);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async get(storeName, key) {
        if (!this.db) await this.init('photo', 1, storeName);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            if (key) {
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            } else {
                const result = [];
                const cursorReq = store.openCursor();
                cursorReq.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        result.push([cursor.key, cursor.value]);
                        cursor.continue();
                    } else {
                        resolve(result);
                    }
                };
                cursorReq.onerror = () => reject(cursorReq.error);
            }
        });
    },

    async remove(dbName) {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        return indexedDB.deleteDatabase(dbName);
    },

    async getAll(storeName) {
        return this.get(storeName);
    }
};
