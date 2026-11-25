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

    makeClassKey(className, seatNum) {
        return `${className}:${seatNum}`;
    },

    async put(storeName, value, key) {
        if (!this.db) await this.init('photo', 1, storeName);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const req = key !== undefined ? store.put(value, key) : store.put(value);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async get(storeName, key) {
        if (!this.db) await this.init('photo', 1, storeName);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            if (key !== undefined) {
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

    async putForClass(storeName, className, seatNum, value) {
        return this.put(storeName, value, this.makeClassKey(className, seatNum));
    },

    async getForClass(storeName, className, seatNum) {
        return this.get(storeName, this.makeClassKey(className, seatNum));
    },

    async getByClass(storeName, className) {
        if (!this.db) await this.init('photo', 1, storeName);
        const prefix = `${className}:`;

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const result = [];
            const cursorReq = store.openCursor();
            cursorReq.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
                        const seatNum = parseInt(cursor.key.slice(prefix.length), 10);
                        if (!isNaN(seatNum)) {
                            result.push([seatNum, cursor.value]);
                        }
                    }
                    cursor.continue();
                } else {
                    resolve(result);
                }
            };
            cursorReq.onerror = () => reject(cursorReq.error);
        });
    },

    async clearClass(storeName, className) {
        if (!this.db) await this.init('photo', 1, storeName);
        const prefix = `${className}:`;

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const cursorReq = store.openCursor();
            cursorReq.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
                        cursor.delete();
                    }
                    cursor.continue();
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async renameClass(storeName, oldName, newName) {
        if (oldName === newName) return;
        const entries = await this.getByClass(storeName, oldName);
        if (!entries.length) return;

        if (!this.db) await this.init('photo', 1, storeName);
        const oldPrefix = `${oldName}:`;

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            for (const [seatNum, value] of entries) {
                store.put(value, this.makeClassKey(newName, seatNum));
                store.delete(`${oldPrefix}${seatNum}`);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async migrateLegacyPhotos(storeName, defaultClassName) {
        if (!this.db) await this.init('photo', 1, storeName);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const cursorReq = store.openCursor();
            cursorReq.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const isLegacyKey =
                        typeof cursor.key === 'number' ||
                        (typeof cursor.key === 'string' && /^\d+$/.test(cursor.key));
                    if (isLegacyKey) {
                        store.put(cursor.value, this.makeClassKey(defaultClassName, parseInt(cursor.key, 10)));
                        cursor.delete();
                    }
                    cursor.continue();
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
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
