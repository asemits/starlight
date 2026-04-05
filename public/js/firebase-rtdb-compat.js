(function () {
  const OP_KEY = "__starlight_rtdb_op";
  const DOC_ID_PREFIX = "__id__";
  const DOC_ID_FIELD = Object.freeze({ __starlight_document_id: true });

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function deepClone(value) {
    if (!isObject(value)) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => deepClone(item));
    }
    const out = {};
    Object.keys(value).forEach((key) => {
      out[key] = deepClone(value[key]);
    });
    return out;
  }

  function splitPath(path) {
    const clean = String(path || "").trim().replace(/^\/+|\/+$/g, "");
    if (!clean) {
      return [];
    }
    return clean.split("/").filter((segment) => segment.length > 0);
  }

  function joinPath() {
    const segments = [];
    for (let i = 0; i < arguments.length; i += 1) {
      const partSegments = splitPath(arguments[i]);
      for (let j = 0; j < partSegments.length; j += 1) {
        segments.push(partSegments[j]);
      }
    }
    return segments.join("/");
  }

  function toUtf8Bytes(input) {
    return new TextEncoder().encode(String(input || ""));
  }

  function fromUtf8Bytes(bytes) {
    return new TextDecoder().decode(bytes);
  }

  function bytesToBase64Url(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(value) {
    const base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(pad);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function shouldEncodeDocId(docId) {
    return /[.#$\[\]/]/.test(docId);
  }

  function encodeDocId(docId) {
    const clean = String(docId || "");
    if (!clean) {
      return DOC_ID_PREFIX;
    }
    if (!shouldEncodeDocId(clean)) {
      return clean;
    }
    return DOC_ID_PREFIX + bytesToBase64Url(toUtf8Bytes(clean));
  }

  function decodeDocId(encoded) {
    const clean = String(encoded || "");
    if (!clean.startsWith(DOC_ID_PREFIX)) {
      return clean;
    }
    const payload = clean.slice(DOC_ID_PREFIX.length);
    if (!payload) {
      return "";
    }
    try {
      return fromUtf8Bytes(base64UrlToBytes(payload));
    } catch (_error) {
      return clean;
    }
  }

  function pathToRtdb(path) {
    const segments = splitPath(path);
    const mapped = segments.map((segment, index) => {
      if (index % 2 === 0) {
        return segment;
      }
      return encodeDocId(segment);
    });
    return mapped.join("/");
  }

  function randomId() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    let id = "";
    for (let i = 0; i < bytes.length; i += 1) {
      id += alphabet[bytes[i] % alphabet.length];
    }
    return id;
  }

  function opValue(name, payload) {
    const out = {};
    out[OP_KEY] = name;
    if (payload !== undefined) {
      out.value = payload;
    }
    return out;
  }

  function isOpValue(value, expectedName) {
    if (!isObject(value) || !Object.prototype.hasOwnProperty.call(value, OP_KEY)) {
      return false;
    }
    if (!expectedName) {
      return true;
    }
    return value[OP_KEY] === expectedName;
  }

  function convertWriteValue(database, value) {
    if (isOpValue(value, "serverTimestamp")) {
      return database.ServerValue.TIMESTAMP;
    }
    if (isOpValue(value, "increment")) {
      const amount = Number(value.value || 0);
      return database.ServerValue.increment(Number.isFinite(amount) ? amount : 0);
    }
    if (isOpValue(value, "delete")) {
      return null;
    }
    if (Array.isArray(value)) {
      return value.map((item) => convertWriteValue(database, item));
    }
    if (isPlainObject(value)) {
      const out = {};
      Object.keys(value).forEach((key) => {
        out[key] = convertWriteValue(database, value[key]);
      });
      return out;
    }
    return value;
  }

  function flattenForUpdate(database, value, prefix, out) {
    if (isOpValue(value, "delete")) {
      if (prefix) {
        out[prefix] = null;
      }
      return;
    }

    if (isPlainObject(value) && !isOpValue(value)) {
      const keys = Object.keys(value);
      if (!keys.length) {
        if (prefix) {
          out[prefix] = {};
        }
        return;
      }
      keys.forEach((key) => {
        const next = prefix ? `${prefix}/${key}` : key;
        flattenForUpdate(database, value[key], next, out);
      });
      return;
    }

    if (prefix) {
      out[prefix] = convertWriteValue(database, value);
    }
  }

  function buildParticipantsMap(participants) {
    const out = {};
    if (!Array.isArray(participants)) {
      return out;
    }
    participants.forEach((uid) => {
      const key = String(uid || "").trim();
      if (key) {
        out[key] = true;
      }
    });
    return out;
  }

  function applyPathDecorators(path, input) {
    if (!isPlainObject(input)) {
      return input;
    }
    const segments = splitPath(path);
    const output = deepClone(input);

    if (segments.length === 2 && segments[0] === "privateChats" && Array.isArray(output.participants)) {
      output.participantsMap = buildParticipantsMap(output.participants);
    }

    return output;
  }

  function getFieldValue(data, fieldPath) {
    if (!fieldPath) {
      return undefined;
    }
    if (!isObject(data)) {
      return undefined;
    }
    const parts = String(fieldPath).split(".");
    let current = data;
    for (let i = 0; i < parts.length; i += 1) {
      if (!isObject(current) || !Object.prototype.hasOwnProperty.call(current, parts[i])) {
        return undefined;
      }
      current = current[parts[i]];
    }
    return current;
  }

  function equalValues(a, b) {
    if (a === b) {
      return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i += 1) {
        if (!equalValues(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    if (isPlainObject(a) && isPlainObject(b)) {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) {
        return false;
      }
      for (let i = 0; i < aKeys.length; i += 1) {
        const key = aKeys[i];
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
          return false;
        }
        if (!equalValues(a[key], b[key])) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  function asComparable(value) {
    if (value === undefined) {
      return { type: 0, value: "" };
    }
    if (value === null) {
      return { type: 1, value: "" };
    }
    if (typeof value === "number") {
      return { type: 2, value };
    }
    if (typeof value === "string") {
      return { type: 3, value };
    }
    if (typeof value === "boolean") {
      return { type: 4, value: value ? 1 : 0 };
    }
    return { type: 5, value: JSON.stringify(value) };
  }

  function compareValues(a, b) {
    const left = asComparable(a);
    const right = asComparable(b);
    if (left.type !== right.type) {
      return left.type - right.type;
    }
    if (left.value < right.value) {
      return -1;
    }
    if (left.value > right.value) {
      return 1;
    }
    return 0;
  }

  function parseSnapshotCallbacks(args) {
    let next = null;
    let error = null;

    if (typeof args[0] === "function") {
      next = args[0];
      if (typeof args[1] === "function") {
        error = args[1];
      }
      return { next, error };
    }

    if (args[0] && typeof args[0] === "object" && (typeof args[0].next === "function" || typeof args[0].error === "function")) {
      next = typeof args[0].next === "function" ? args[0].next.bind(args[0]) : null;
      error = typeof args[0].error === "function" ? args[0].error.bind(args[0]) : null;
      return { next, error };
    }

    if (typeof args[1] === "function") {
      next = args[1];
      if (typeof args[2] === "function") {
        error = args[2];
      }
      return { next, error };
    }

    throw new Error("onSnapshot requires a callback.");
  }

  function isDocumentIdFieldPath(fieldPath) {
    return isObject(fieldPath) && fieldPath.__starlight_document_id === true;
  }

  class CompatDocumentSnapshot {
    constructor(ref, exists, data) {
      this.ref = ref;
      this.id = ref.id;
      this.exists = Boolean(exists);
      this._data = data;
    }

    data() {
      if (!this.exists) {
        return undefined;
      }
      return deepClone(this._data);
    }
  }

  class CompatQuerySnapshot {
    constructor(docs) {
      this.docs = docs;
      this.size = docs.length;
      this.empty = docs.length === 0;
    }

    forEach(callback) {
      this.docs.forEach((doc) => callback(doc));
    }
  }

  class CompatDocumentReference {
    constructor(db, path) {
      this._db = db;
      this.path = splitPath(path).join("/");
      const segments = splitPath(this.path);
      this.id = segments.length ? segments[segments.length - 1] : "";
      this._segments = segments;
    }

    get parent() {
      if (this._segments.length < 2) {
        return null;
      }
      return new CompatCollectionReference(this._db, this._segments.slice(0, -1).join("/"));
    }

    collection(name) {
      return new CompatCollectionReference(this._db, joinPath(this.path, String(name || "")));
    }

    async get() {
      return this._db._getDocument(this.path);
    }

    async set(data, options) {
      return this._db._setDocument(this.path, data, options || {});
    }

    async update(data) {
      return this._db._updateDocument(this.path, data || {});
    }

    async delete() {
      return this._db._deleteDocument(this.path);
    }

    onSnapshot() {
      const callbacks = parseSnapshotCallbacks(arguments);
      const ref = this._db._rawRef(this.path);
      const handler = (snap) => {
        const value = snap.val();
        const exists = value !== null && value !== undefined;
        const docSnap = new CompatDocumentSnapshot(this, exists, exists ? deepClone(value) : undefined);
        callbacks.next(docSnap);
      };
      const errorHandler = callbacks.error || null;
      ref.on("value", handler, errorHandler || undefined);
      return function unsubscribe() {
        ref.off("value", handler);
      };
    }
  }

  class CompatQuery {
    constructor(db, source, filters, order, limitValue, cursor) {
      this._db = db;
      this._source = source;
      this._filters = filters || [];
      this._order = order || null;
      this._limit = Number.isFinite(limitValue) ? limitValue : null;
      this._cursor = cursor || null;
    }

    _clone(overrides) {
      return new CompatQuery(
        this._db,
        overrides && overrides.source ? overrides.source : this._source,
        overrides && overrides.filters ? overrides.filters : this._filters,
        overrides && Object.prototype.hasOwnProperty.call(overrides, "order") ? overrides.order : this._order,
        overrides && Object.prototype.hasOwnProperty.call(overrides, "limitValue") ? overrides.limitValue : this._limit,
        overrides && Object.prototype.hasOwnProperty.call(overrides, "cursor") ? overrides.cursor : this._cursor
      );
    }

    where(fieldPath, opStr, value) {
      const filter = {
        fieldPath,
        isDocId: isDocumentIdFieldPath(fieldPath),
        op: String(opStr || "=="),
        value
      };
      return this._clone({ filters: this._filters.concat([filter]) });
    }

    orderBy(fieldPath, directionStr) {
      const direction = String(directionStr || "asc").toLowerCase() === "desc" ? "desc" : "asc";
      const order = {
        fieldPath,
        isDocId: isDocumentIdFieldPath(fieldPath),
        direction
      };
      return this._clone({ order });
    }

    limit(count) {
      const parsed = Number(count);
      const safe = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
      return this._clone({ limitValue: safe });
    }

    startAfter(cursorValue) {
      let cursor = null;
      if (cursorValue && typeof cursorValue === "object" && typeof cursorValue.data === "function" && typeof cursorValue.id === "string") {
        const data = cursorValue.data() || {};
        const orderValue = this._order
          ? (this._order.isDocId ? cursorValue.id : getFieldValue(data, this._order.fieldPath))
          : cursorValue.id;
        cursor = {
          id: cursorValue.id,
          orderValue,
          byDocument: true
        };
      } else {
        cursor = {
          id: null,
          orderValue: cursorValue,
          byDocument: false
        };
      }
      return this._clone({ cursor });
    }

    _getParticipantsArrayContainsFilter() {
      return this._filters.find((filter) => {
        return !filter.isDocId
          && filter.op === "array-contains"
          && filter.fieldPath === "participants"
          && typeof filter.value === "string"
          && filter.value.trim().length > 0;
      }) || null;
    }

    _getFriendRequestUidEqualityFilter() {
      return this._filters.find((filter) => {
        return !filter.isDocId
          && filter.op === "=="
          && (filter.fieldPath === "toUid" || filter.fieldPath === "fromUid")
          && typeof filter.value === "string"
          && filter.value.trim().length > 0;
      }) || null;
    }

    _getScopedRefInfo() {
      if (this._source.kind !== "collection") {
        return null;
      }

      let ref = this._db._rawRef(this._source.path);
      const collectionPath = splitPath(this._source.path).join("/");

      if (collectionPath === "friendRequests") {
        const requestUidFilter = this._getFriendRequestUidEqualityFilter();
        if (requestUidFilter) {
          const indexPath = requestUidFilter.fieldPath === "toUid"
            ? joinPath("userFriendRequestsIncoming", requestUidFilter.value)
            : joinPath("userFriendRequestsOutgoing", requestUidFilter.value);
          ref = this._db._rawRef(indexPath);
          return { ref };
        }
      }

      const participantFilter = this._getParticipantsArrayContainsFilter();

      if (participantFilter) {
        if (collectionPath === "privateChats") {
          ref = this._db._rawRef(joinPath("userChats", participantFilter.value));
        } else {
          ref = ref.orderByChild(`participantsMap/${participantFilter.value}`).equalTo(true);
        }
      } else {
        const equalityFilter = this._filters.find((filter) => {
          return !filter.isDocId
            && filter.op === "=="
            && typeof filter.fieldPath === "string"
            && filter.fieldPath.length > 0;
        });

        if (equalityFilter) {
          ref = ref.orderByChild(equalityFilter.fieldPath).equalTo(equalityFilter.value);
        } else if (this._order && !this._order.isDocId && typeof this._order.fieldPath === "string" && this._order.fieldPath.length > 0) {
          ref = ref.orderByChild(this._order.fieldPath);
        } else if (this._order && this._order.isDocId) {
          ref = ref.orderByKey();
        }
      }

      if (this._limit && this._limit > 0 && !this._cursor) {
        if (this._order && this._order.direction === "desc") {
          ref = ref.limitToLast(this._limit);
        } else {
          ref = ref.limitToFirst(this._limit);
        }
      }

      return { ref };
    }

    async _loadDocs() {
      if (this._source.kind === "collection") {
        const collectionPath = splitPath(this._source.path).join("/");
        if (collectionPath === "friendRequests") {
          const requestUidFilter = this._getFriendRequestUidEqualityFilter();
          if (requestUidFilter) {
            const direction = requestUidFilter.fieldPath === "toUid" ? "incoming" : "outgoing";
            return this._db._getFriendRequestsForUser(requestUidFilter.value, direction);
          }
        }
        if (collectionPath === "privateChats") {
          const participantFilter = this._getParticipantsArrayContainsFilter();
          if (participantFilter) {
            return this._db._getPrivateChatsForUser(participantFilter.value);
          }
        }
        return this._db._getCollectionDocs(this._source.path, this._getScopedRefInfo());
      }
      if (this._source.kind === "collectionGroup") {
        return this._db._getCollectionGroupDocs(this._source.collectionId);
      }
      return [];
    }

    _matchesFilter(doc, filter) {
      const actual = filter.isDocId ? doc.id : getFieldValue(doc.data, filter.fieldPath);
      if (filter.op === "==") {
        return equalValues(actual, filter.value);
      }
      if (filter.op === ">") {
        return compareValues(actual, filter.value) > 0;
      }
      if (filter.op === ">=") {
        return compareValues(actual, filter.value) >= 0;
      }
      if (filter.op === "<") {
        return compareValues(actual, filter.value) < 0;
      }
      if (filter.op === "<=") {
        return compareValues(actual, filter.value) <= 0;
      }
      if (filter.op === "array-contains") {
        if (!Array.isArray(actual)) {
          return false;
        }
        return actual.some((item) => equalValues(item, filter.value));
      }
      return false;
    }

    _applyFilters(docs) {
      if (!this._filters.length) {
        return docs;
      }
      return docs.filter((doc) => this._filters.every((filter) => this._matchesFilter(doc, filter)));
    }

    _orderValueForDoc(doc) {
      if (!this._order) {
        return doc.id;
      }
      if (this._order.isDocId) {
        return doc.id;
      }
      return getFieldValue(doc.data, this._order.fieldPath);
    }

    _applyOrdering(docs) {
      if (!this._order) {
        return docs;
      }
      const direction = this._order.direction === "desc" ? -1 : 1;
      const sorted = docs.slice();
      sorted.sort((a, b) => {
        const cmp = compareValues(this._orderValueForDoc(a), this._orderValueForDoc(b));
        if (cmp !== 0) {
          return cmp * direction;
        }
        return compareValues(a.id, b.id) * direction;
      });
      return sorted;
    }

    _passesCursor(doc) {
      if (!this._cursor) {
        return true;
      }

      const direction = this._order && this._order.direction === "desc" ? -1 : 1;
      const docOrderValue = this._order ? this._orderValueForDoc(doc) : doc.id;
      const cursorOrderValue = this._cursor.orderValue;

      let cmp = compareValues(docOrderValue, cursorOrderValue);
      if (cmp === 0 && this._cursor.id) {
        cmp = compareValues(doc.id, this._cursor.id);
      }

      cmp *= direction;
      return cmp > 0;
    }

    _applyCursor(docs) {
      if (!this._cursor) {
        return docs;
      }
      return docs.filter((doc) => this._passesCursor(doc));
    }

    _applyLimit(docs) {
      if (!this._limit || this._limit <= 0) {
        return docs;
      }
      return docs.slice(0, this._limit);
    }

    async get() {
      const loaded = await this._loadDocs();
      const filtered = this._applyFilters(loaded);
      const ordered = this._applyOrdering(filtered);
      const cursorApplied = this._applyCursor(ordered);
      const limited = this._applyLimit(cursorApplied);
      const snapshots = limited.map((doc) => {
        const ref = new CompatDocumentReference(this._db, doc.path);
        return new CompatDocumentSnapshot(ref, true, doc.data);
      });
      return new CompatQuerySnapshot(snapshots);
    }

    onSnapshot() {
      const callbacks = parseSnapshotCallbacks(arguments);
      let listenRef = null;
      if (this._source.kind === "collection") {
        const scoped = this._getScopedRefInfo();
        listenRef = scoped && scoped.ref ? scoped.ref : this._db._rawRef(this._source.path);
      } else {
        const listenPath = this._source.kind === "collectionGroup"
          ? (this._source.collectionId === "players" ? "gameStats" : "")
          : this._source.path;
        listenRef = this._db._rawRef(listenPath);
      }
      const handleChange = () => {
        this.get()
          .then((snapshot) => {
            callbacks.next(snapshot);
          })
          .catch((error) => {
            if (callbacks.error) {
              callbacks.error(error);
            }
          });
      };
      listenRef.on("value", handleChange, callbacks.error || undefined);
      return function unsubscribe() {
        listenRef.off("value", handleChange);
      };
    }
  }

  class CompatCollectionReference extends CompatQuery {
    constructor(db, path) {
      const cleanPath = splitPath(path).join("/");
      super(db, { kind: "collection", path: cleanPath }, [], null, null, null);
      this.path = cleanPath;
      const segments = splitPath(cleanPath);
      this.id = segments.length ? segments[segments.length - 1] : "";
      this._segments = segments;
    }

    get parent() {
      if (this._segments.length < 2) {
        return null;
      }
      return new CompatDocumentReference(this._db, this._segments.slice(0, -1).join("/"));
    }

    doc(docId) {
      const id = docId === undefined || docId === null ? randomId() : String(docId);
      return new CompatDocumentReference(this._db, joinPath(this.path, id));
    }

    async add(data) {
      const ref = this.doc();
      await ref.set(data || {});
      return ref;
    }
  }

  class CompatWriteBatch {
    constructor(db) {
      this._db = db;
      this._ops = [];
    }

    set(ref, data, options) {
      this._ops.push({ type: "set", ref, data, options: options || {} });
      return this;
    }

    update(ref, data) {
      this._ops.push({ type: "update", ref, data });
      return this;
    }

    delete(ref) {
      this._ops.push({ type: "delete", ref });
      return this;
    }

    async commit() {
      for (let i = 0; i < this._ops.length; i += 1) {
        const op = this._ops[i];
        if (op.type === "set") {
          await this._db._setDocument(op.ref.path, op.data, op.options || {});
        } else if (op.type === "update") {
          await this._db._updateDocument(op.ref.path, op.data || {});
        } else if (op.type === "delete") {
          await this._db._deleteDocument(op.ref.path);
        }
      }
    }
  }

  class CompatTransaction {
    constructor(db) {
      this._db = db;
      this._ops = [];
      this._cache = new Map();
    }

    async get(ref) {
      const path = ref.path;
      if (this._cache.has(path)) {
        return this._cache.get(path);
      }
      const snap = await this._db._getDocument(path);
      this._cache.set(path, snap);
      return snap;
    }

    set(ref, data, options) {
      this._ops.push({ type: "set", path: ref.path, data, options: options || {} });
    }

    update(ref, data) {
      this._ops.push({ type: "update", path: ref.path, data: data || {} });
    }

    delete(ref) {
      this._ops.push({ type: "delete", path: ref.path });
    }

    async _commit() {
      for (let i = 0; i < this._ops.length; i += 1) {
        const op = this._ops[i];
        if (op.type === "set") {
          await this._db._setDocument(op.path, op.data, op.options || {});
        } else if (op.type === "update") {
          await this._db._updateDocument(op.path, op.data || {});
        } else if (op.type === "delete") {
          await this._db._deleteDocument(op.path);
        }
      }
    }
  }

  class CompatDatabase {
    constructor(rtdb) {
      this._rtdb = rtdb;
      this._databaseNamespace = window.firebase && window.firebase.database ? window.firebase.database : null;
      if (!this._databaseNamespace) {
        throw new Error("Firebase Realtime Database SDK is not loaded.");
      }
    }

    _rawRef(path) {
      const rtdbPath = pathToRtdb(path);
      if (!rtdbPath) {
        return this._rtdb.ref();
      }
      return this._rtdb.ref(rtdbPath);
    }

    async _getDocument(path) {
      const ref = this._rawRef(path);
      const snap = await ref.once("value");
      const value = snap.val();
      const exists = value !== null && value !== undefined;
      return new CompatDocumentSnapshot(new CompatDocumentReference(this, path), exists, exists ? deepClone(value) : undefined);
    }

    async _setDocument(path, data, options) {
      const decorated = applyPathDecorators(path, data || {});
      const ref = this._rawRef(path);
      const merge = Boolean(options && options.merge);
      if (!merge) {
        const payload = convertWriteValue(this._databaseNamespace, decorated);
        await ref.set(payload);
        await this._syncPrivateChatIndex(path, decorated);
        await this._syncFriendRequestIndex(path, decorated);
        return;
      }

      const updates = {};
      flattenForUpdate(this._databaseNamespace, decorated, "", updates);
      if (!Object.keys(updates).length) {
        await this._syncPrivateChatIndex(path, decorated);
        await this._syncFriendRequestIndex(path, decorated);
        return;
      }
      await ref.update(updates);
      await this._syncPrivateChatIndex(path, decorated);
      await this._syncFriendRequestIndex(path, decorated);
    }

    async _updateDocument(path, data) {
      const decorated = applyPathDecorators(path, data || {});
      const updates = {};
      flattenForUpdate(this._databaseNamespace, decorated, "", updates);
      if (!Object.keys(updates).length) {
        await this._syncPrivateChatIndex(path, decorated);
        await this._syncFriendRequestIndex(path, decorated);
        return;
      }
      await this._rawRef(path).update(updates);
      await this._syncPrivateChatIndex(path, decorated);
      await this._syncFriendRequestIndex(path, decorated);
    }

    async _deleteDocument(path) {
      await this._rawRef(path).remove();
    }

    async _syncPrivateChatIndex(path, data) {
      const segments = splitPath(path);
      if (segments.length !== 2 || segments[0] !== "privateChats") {
        return;
      }

      if (!isPlainObject(data) || !Array.isArray(data.participants)) {
        return;
      }

      const chatId = segments[1];
      const updates = {};
      data.participants.forEach((uidValue) => {
        const uid = String(uidValue || "").trim();
        if (!uid) {
          return;
        }
        const rtdbPath = pathToRtdb(joinPath("userChats", uid, chatId));
        updates[rtdbPath] = true;
      });

      if (!Object.keys(updates).length) {
        return;
      }

      await this._rtdb.ref().update(updates);
    }

    async _syncFriendRequestIndex(path, data) {
      const segments = splitPath(path);
      if (segments.length !== 2 || segments[0] !== "friendRequests") {
        return;
      }

      let payload = isPlainObject(data) ? deepClone(data) : {};
      let fromUid = String(payload.fromUid || "").trim();
      let toUid = String(payload.toUid || "").trim();
      let status = String(payload.status || "").trim() || "pending";

      if (!fromUid || !toUid) {
        const existing = await this._getDocument(path);
        if (!existing.exists) {
          return;
        }
        const existingData = existing.data() || {};
        fromUid = fromUid || String(existingData.fromUid || "").trim();
        toUid = toUid || String(existingData.toUid || "").trim();
        status = status || String(existingData.status || "").trim() || "pending";
      }

      if (!fromUid || !toUid) {
        return;
      }

      const requestId = segments[1];
      const updates = {};
      updates[pathToRtdb(joinPath("userFriendRequestsIncoming", toUid, requestId))] = status;
      updates[pathToRtdb(joinPath("userFriendRequestsOutgoing", fromUid, requestId))] = status;

      await this._rtdb.ref().update(updates);
    }

    async _getFriendRequestsForUser(uidValue, direction) {
      const uid = String(uidValue || "").trim();
      if (!uid) {
        return [];
      }

      const indexPath = direction === "incoming"
        ? joinPath("userFriendRequestsIncoming", uid)
        : joinPath("userFriendRequestsOutgoing", uid);
      const indexSnap = await this._rawRef(indexPath).once("value");
      const indexValue = indexSnap.val();
      if (!isObject(indexValue)) {
        return [];
      }

      const requestIds = Object.keys(indexValue)
        .filter((key) => indexValue[key] !== null && indexValue[key] !== undefined)
        .map((key) => decodeDocId(key));

      if (!requestIds.length) {
        return [];
      }

      const docs = [];
      const snapshots = await Promise.all(requestIds.map((requestId) => this._getDocument(joinPath("friendRequests", requestId))));
      for (let i = 0; i < snapshots.length; i += 1) {
        const snap = snapshots[i];
        if (!snap || !snap.exists) {
          continue;
        }
        docs.push({
          id: requestIds[i],
          path: joinPath("friendRequests", requestIds[i]),
          data: snap.data() || {}
        });
      }

      return docs;
    }

    async _getPrivateChatsForUser(uidValue) {
      const uid = String(uidValue || "").trim();
      if (!uid) {
        return [];
      }

      const indexSnap = await this._rawRef(joinPath("userChats", uid)).once("value");
      const indexValue = indexSnap.val();
      if (!isObject(indexValue)) {
        return [];
      }

      const chatIds = Object.keys(indexValue)
        .filter((key) => Boolean(indexValue[key]))
        .map((key) => decodeDocId(key));

      if (!chatIds.length) {
        return [];
      }

      const docs = [];
      const snapshots = await Promise.all(chatIds.map((chatId) => this._getDocument(joinPath("privateChats", chatId))));
      for (let i = 0; i < snapshots.length; i += 1) {
        const snap = snapshots[i];
        if (!snap || !snap.exists) {
          continue;
        }
        docs.push({
          id: chatIds[i],
          path: joinPath("privateChats", chatIds[i]),
          data: snap.data() || {}
        });
      }

      return docs;
    }

    async _getCollectionDocs(collectionPath, scopedRefInfo) {
      const ref = scopedRefInfo && scopedRefInfo.ref ? scopedRefInfo.ref : this._rawRef(collectionPath);
      const snap = await ref.once("value");
      const value = snap.val();
      if (!isObject(value)) {
        return [];
      }

      const docs = [];
      snap.forEach((childSnap) => {
        const key = childSnap.key;
        const docId = decodeDocId(key);
        const docPath = joinPath(collectionPath, docId);
        const docValue = childSnap.val();
        if (docValue === null || docValue === undefined) {
          return false;
        }
        docs.push({
          id: docId,
          path: docPath,
          data: deepClone(docValue)
        });
        return false;
      });

      if (!docs.length) {
        const keys = Object.keys(value);
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          const docId = decodeDocId(key);
          const docPath = joinPath(collectionPath, docId);
          const docValue = value[key];
          if (docValue === null || docValue === undefined) {
            continue;
          }
          docs.push({
            id: docId,
            path: docPath,
            data: deepClone(docValue)
          });
        }
      }

      return docs;
    }

    async _getCollectionGroupDocs(collectionId) {
      const target = String(collectionId || "");
      if (target !== "players") {
        return [];
      }

      const gameStatsRef = this._rawRef("gameStats");
      const gameStatsSnap = await gameStatsRef.once("value");
      const gameStats = gameStatsSnap.val();
      if (!isObject(gameStats)) {
        return [];
      }

      const docs = [];
      const gameIds = Object.keys(gameStats);
      for (let i = 0; i < gameIds.length; i += 1) {
        const gameKey = gameIds[i];
        const gameId = decodeDocId(gameKey);
        const gameNode = gameStats[gameKey];
        if (!isObject(gameNode) || !isObject(gameNode.players)) {
          continue;
        }

        const playerIds = Object.keys(gameNode.players);
        for (let j = 0; j < playerIds.length; j += 1) {
          const playerKey = playerIds[j];
          const playerDocId = decodeDocId(playerKey);
          const playerNode = gameNode.players[playerKey];
          if (playerNode === null || playerNode === undefined) {
            continue;
          }
          docs.push({
            id: playerDocId,
            path: joinPath("gameStats", gameId, "players", playerDocId),
            data: deepClone(playerNode)
          });
        }
      }

      return docs;
    }

    collection(path) {
      return new CompatCollectionReference(this, path);
    }

    doc(path) {
      return new CompatDocumentReference(this, path);
    }

    collectionGroup(collectionId) {
      return new CompatQuery(this, { kind: "collectionGroup", collectionId: String(collectionId || "") }, [], null, null, null);
    }

    batch() {
      return new CompatWriteBatch(this);
    }

    async runTransaction(updateFn) {
      const tx = new CompatTransaction(this);
      const result = await updateFn(tx);
      await tx._commit();
      return result;
    }
  }

  const fieldValue = {
    serverTimestamp: function serverTimestamp() {
      return opValue("serverTimestamp");
    },
    increment: function increment(amount) {
      return opValue("increment", Number(amount || 0));
    },
    delete: function removeField() {
      return opValue("delete");
    }
  };

  const fieldPath = {
    documentId: function documentId() {
      return DOC_ID_FIELD;
    }
  };

  function installFirebaseNamespace() {
    if (!window.firebase) {
      return;
    }

    const namespace = isObject(window.firebase.firestore) ? window.firebase.firestore : {};
    namespace.FieldValue = fieldValue;
    namespace.FieldPath = fieldPath;
    window.firebase.firestore = namespace;
  }

  installFirebaseNamespace();

  window.createStarlightRtdbCompatDb = function createStarlightRtdbCompatDb(databaseInstance) {
    installFirebaseNamespace();
    return new CompatDatabase(databaseInstance);
  };
})();
