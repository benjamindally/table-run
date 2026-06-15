# Mobile Release & OTA Runbook

Run everything from `packages/mobile/` (NOT the repo root — the root has its own
`app.json` that will shadow this one and break config resolution).

```bash
cd ~/Projects/league-genius/packages/mobile
```

---

## The mental model (read once)

There are **two independent version numbers**:

| Field | What it is | When you change it |
|-------|-----------|--------------------|
| `expo.version` (`app.json`) | **Marketing version** shown in the store (`1.0.1`). | Every store submission. Must be **higher** than what's live in the App Store / Play, or the submission is rejected. |
| `expo.runtimeVersion` (`app.json`) | **Native generation** — the silo OTA updates flow within. Currently a fixed string: **`"1"`**. | **Only when you change native code** (add/upgrade a native dependency, change native config, bump Expo SDK). |

**OTA updates only reach builds whose `runtimeVersion` matches the update's
`runtimeVersion`.** Because our runtime is a fixed string decoupled from the
marketing version, you can ship `1.0.1`, `1.0.2`, `1.1.0` to the store and OTA
JS to **all of them**, as long as they were all built at `runtimeVersion "1"`.

When you finally change native code, bump runtimeVersion to `"2"`, rebuild, and
from then on OTA to `"2"`.

---

## Scenario A — JS / asset-only change (the on-the-fly path)

Anything that does NOT touch native code: React components, hooks, screens,
business logic, styles, images. **No rebuild needed.**

```bash
cd ~/Projects/league-genius/packages/mobile
# make sure your changes are committed
npx eas-cli update --branch production --message "what changed"
```

**Verify it actually went out:**
1. The command output must show **`Runtime version 1`** (must match installed builds).
2. `npx eas-cli channel:view production` → the `production` branch's most recent
   group should be at **Runtime Version 1**, with your message + timestamp.
3. On a device: force-quit → reopen → force-quit → reopen (expo-updates applies
   on the launch *after* it downloads). Open **Profile → About League Genius** —
   the footer shows the running version, runtime, and **OTA update id + time**.
   If it shows your update id with a recent time, it landed.

---

## Scenario B — native change OR a new store release

Touched a native dependency, native config, or Expo SDK? Or just shipping a new
store version? You need a real build.

1. If native code changed, bump the runtime silo in `app.json`:
   `"runtimeVersion": "2"` (then OTA to `"2"` afterward).
2. Bump `expo.version` for the store (e.g. `1.0.1` → `1.0.2`). Build numbers
   (`ios.buildNumber`, `android.versionCode`) auto-increment via the `production`
   profile, but keep them ahead of what's live.
3. Build + submit:
   ```bash
   npx eas-cli build --platform all --profile production --auto-submit
   ```
4. Install from TestFlight / Play internal, verify, then release in App Store
   Connect / Play Console.

---

## When an OTA "doesn't land" — 60-second debug

Check these three in order; one of them is always the cause:

1. **On-device About screen** (Profile → About League Genius). Shows what's
   actually running:
   - `Runtime 1 · production` → confirms the silo + channel.
   - `OTA update <id> · Updated <time>` → an OTA is applied. `Bundled build —
     no OTA update applied` → still on the embedded bundle.
2. **`npx eas-cli channel:view production`** → is the channel serving an update
   at **the same runtime** the installed build reports? Runtime mismatch is the
   #1 killer. (`eas-cli build:list` shows a build's runtime.)
3. **Native update logs** — the updater narrates what it's doing:
   - iOS: plug into Mac → **Console.app** → select device → filter `EXUpdates` →
     relaunch the app.
   - Android: `adb logcat | grep -i expo`
   - "No update available" = runtime/channel mismatch. Silence = the build has no
     working updater (needs a rebuild). A download error = network/assets.

---

## Footguns we already hit (don't repeat)

1. **Bumping `version` while on `appVersion` runtime policy orphaned every OTA.**
   With `policy: "appVersion"`, runtime == marketing version, so bumping to
   `1.0.1` before any `1.0.1` build shipped sent updates into a silo no device
   was in. Fixed by switching to a fixed `runtimeVersion` string.
2. **A store binary with a dead/absent updater can't be OTA'd, ever.** No amount
   of publishing fixes it — only a fresh build with a working updater does. After
   that one build, OTA works for everything that follows.
3. **Always run `eas` commands from `packages/mobile/`,** never the repo root.
