# Eventra Camera Utility — Desktop App Specification

**Version:** 1.0  
**Target platform:** Windows 10/11, macOS 12+  
**Framework:** Electron 30+ (Node.js 20 LTS bundled)  
**Purpose:** Bridge between a tethered DSLR/mirrorless camera and the Eventra cloud. Each new photo is uploaded to the photographer's active event in real time.

---

## 1. Architecture Overview

```
┌──────────────┐      USB / Wi-Fi      ┌──────────────────────────────────┐
│  Camera body │ ──────────────────── ▶│     Electron main process        │
└──────────────┘  gphoto2 / WIA API    │  ┌────────────┐  ┌────────────┐ │
                                        │  │ Capture    │  │ Upload     │ │
                                        │  │ thread     │→ │ thread     │ │
                                        │  └────────────┘  └─────┬──────┘ │
                                        │                         │        │
                                        │  ┌──────────────────────▼──────┐ │
                                        │  │  Offline queue (SQLite)     │ │
                                        │  └──────────────────────────── ┘ │
                                        └──────────────────────────────────┘
                                                        │ HTTPS (API key)
                                                        ▼
                                              Eventra Cloud API
                                         POST /api/cameras/:id/ingest/start
                                         PUT  <presigned R2 URL>
                                         POST /api/cameras/:id/ingest/complete
```

---

## 2. Authentication & Pairing

### 2.1 First-time pairing

1. Photographer opens the utility and clicks **Add Camera**.
2. The utility displays a 6-digit pairing code for visual confirmation (optional UX step).
3. Photographer logs into the Eventra web app → Settings → Camera2Cloud → **New Camera**, enters a name, and copies the generated **API Key** (`uuid`).
4. Photographer pastes the API key into the utility. It is stored in the OS credential store (Keychain / Windows Credential Manager).
5. The utility calls `POST /api/cameras/:id/heartbeat` with `X-Camera-Key`. A 200 response confirms pairing.

### 2.2 Ongoing authentication

Every request to the API uses the header:

```
X-Camera-Key: <apiKey>
```

No JWT, no user login required on the desktop side.

---

## 3. Camera Detection

### Windows
- Use **WIA (Windows Image Acquisition)** via Node.js native addon (`node-wia`) or a child-process call to the bundled `wia-capture.exe` helper.
- Alternatively, shell to `gphoto2` if installed (prefer for Canon/Nikon raw capture).

### macOS
- Shell to `gphoto2` (bundled in the `.app` via Homebrew prefix).
- Fallback: `ImageCaptureCore` via an Objective-C helper invoked over IPC.

### Detection loop
- Poll every 2 s for new attached USB devices.
- On new camera detected, emit `camera:attached` IPC event to the renderer.
- On disconnect, emit `camera:detached` and pause uploads.

---

## 4. Capture Thread

The capture thread is a Node.js `worker_threads` Worker (`capture-worker.js`):

```
while (running) {
  const files = gphoto2.capture_and_download()  // blocks up to 500 ms
  for (file of files) {
    offlineQueue.push({ localPath: file, retries: 0 })
  }
  sleep(100ms)
}
```

- Uses `--capture-image-and-download` (Canon/Nikon) or `--wait-event=CAPTURECOMPLETE` for tethered live-view cameras.
- Raw files (`.CR3`, `.NEF`, `.ARW`) are captured and uploaded as-is; the Eventra media worker handles any conversion.
- Downloaded files are stored in `%TEMP%/eventra-capture/` and deleted after a successful upload ack.

---

## 5. Upload Thread

The upload thread is a second `worker_threads` Worker (`upload-worker.js`):

### 5.1 Upload flow

```
1. Dequeue item from offlineQueue
2. POST /api/cameras/:id/ingest/start
   Body: { filename, contentType, sizeBytes, multipart: sizeBytes > 100MB }
   → Returns { mediaId, key, uploadUrl | (uploadId + partUrl), multipart }

3a. If single-part:
     PUT <uploadUrl>  — stream file bytes
     POST /api/cameras/:id/ingest/complete
       Body: { mediaId, key }

3b. If multipart (> 100 MB):
     For each 10 MB chunk:
       GET next part presign URL (or cache from ingest/start for part 1)
       PUT <partUrl>  — send chunk, save ETag
     POST /api/cameras/:id/ingest/complete
       Body: { mediaId, key, uploadId, parts: [{PartNumber, ETag}] }

4. On HTTP 200:  delete temp file, mark queue item DONE
5. On HTTP 4xx:  log + discard (do not retry — likely a config error)
6. On HTTP 5xx or network error:  increment retries, re-enqueue with
   exponential backoff (5s, 15s, 60s, 300s); after 10 retries → DEAD
```

### 5.2 Concurrency

- Up to **3 concurrent uploads** per utility instance.
- A `p-limit` semaphore gates goroutine concurrency.

### 5.3 Bandwidth throttling (optional setting)

- User can set a maximum upload speed in MB/s (default: unlimited).
- Throttle is applied via a `stream-throttle` Transform stream wrapping each upload.

---

## 6. Offline Queue (SQLite)

Stored in `userData/eventra-queue.db`:

```sql
CREATE TABLE upload_queue (
  id          TEXT PRIMARY KEY,
  local_path  TEXT NOT NULL,
  filename    TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  camera_id   TEXT NOT NULL,
  event_id    TEXT NOT NULL,
  status      TEXT DEFAULT 'PENDING',   -- PENDING | UPLOADING | DONE | DEAD
  retries     INTEGER DEFAULT 0,
  next_retry  INTEGER DEFAULT 0,        -- Unix ms
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
```

On startup, all `UPLOADING` rows are reset to `PENDING` (crash recovery).

---

## 7. Heartbeat

- Every **30 seconds**, `POST /api/cameras/:id/heartbeat` with `X-Camera-Key`.
- If the API returns non-200 for 3 consecutive heartbeats, show a reconnection UI and stop capturing.
- The server marks the camera `DISCONNECTED` after missing 3 heartbeats (90 s TTL handled server-side via a cron or BullMQ delayed job — future work).

---

## 8. UI (Electron Renderer — React)

### 8.1 Main window layout

```
┌─────────────────────────────────────────────────────────────┐
│  Eventra Camera Utility                        [_] [□] [X]  │
├──────────────────────┬──────────────────────────────────────┤
│  Camera              │  Upload Queue                        │
│  ● Sony A7 IV   [✓] │  ⏳  DSC_0142.ARW   2.4 MB  ████░  │
│  ○ Canon R5         │  ✓   DSC_0141.ARW   2.3 MB  done    │
│  [+ Add Camera]     │  ✗   DSC_0139.ARW   2.4 MB  retry 2 │
│                      │                                      │
│  Event: Wedding      │  Uploaded today: 143 files           │
│  [Change Event]      │  Queue depth:      2 pending         │
└──────────────────────┴──────────────────────────────────────┘
```

### 8.2 Per-camera card

- Camera model + connection indicator (green/yellow/red dot)
- Assigned event name
- Photos uploaded this session
- Last upload timestamp
- **Pause / Resume** toggle

### 8.3 System tray

- Tray icon shows connection state (green = capturing, yellow = uploading only, grey = idle)
- Right-click menu: **Open**, **Pause all**, **Quit**
- Native desktop notifications for upload errors and successful batch completions

---

## 9. Settings

| Setting | Default | Notes |
|---------|---------|-------|
| Startup on login | On | OS auto-launch |
| Min upload speed | None | Throttle in MB/s |
| Capture folder | `%TEMP%/eventra-capture` | Temp storage |
| Delete after upload | On | Free disk |
| Log level | info | Written to `userData/logs/` |
| FTP mode | Off | Alternative ingest path |

---

## 10. FTP Mode (Alternative Ingest)

For cameras that only support FTP push (Canon, Nikon, Sony built-in Wi-Fi FTP):

1. User configures the camera's built-in FTP settings:
   - **Host:** Photographer's laptop IP (or router DDNS)
   - **Port:** `2121` (default; configurable in Eventra web app)
   - **Username/Password:** from the CameraAccount in Eventra
2. The Eventra API server runs an embedded FTP listener (`ftpServer.js`).
3. No desktop utility needed — the camera connects directly to the API server over the network.

The desktop utility does **not** run its own FTP server.

---

## 11. Build & Distribution

### Electron Forge config (abbreviated)

```json
{
  "packagerConfig": {
    "name": "Eventra Camera Utility",
    "icon": "assets/icon",
    "extraResource": ["vendor/gphoto2"]
  },
  "makers": [
    { "name": "@electron-forge/maker-squirrel", "platforms": ["win32"] },
    { "name": "@electron-forge/maker-dmg",      "platforms": ["darwin"] }
  ]
}
```

### Auto-update

- Use `electron-updater` pointing to the Eventra releases S3 bucket.
- Silent background update; notify user and prompt to restart.

---

## 12. Security

- API key stored in OS credential store — never in plain-text config files.
- All API calls over HTTPS (certificate pinning for the production API domain).
- Temp capture files stored in a user-only temp directory (`chmod 700` on macOS/Linux).
- No camera credentials leave the device.

---

## 13. Deliverables Checklist

- [ ] `electron-app/` — Electron project scaffold
- [ ] `electron-app/src/main/capture-worker.js` — camera capture loop
- [ ] `electron-app/src/main/upload-worker.js` — presign + PUT + complete
- [ ] `electron-app/src/main/offline-queue.js` — SQLite queue
- [ ] `electron-app/src/main/heartbeat.js` — 30s heartbeat timer
- [ ] `electron-app/src/renderer/` — React UI (camera cards, queue table, tray)
- [ ] `electron-app/forge.config.js` — build config
- [ ] Backend: `src/ftpServer.js` ✅
- [ ] Backend: `src/routes/cameras.js` ✅
