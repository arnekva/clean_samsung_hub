# Clean Hub for Samsung TVs

A clean, ad-free app dashboard for Samsung Tizen TVs: your favourite apps in a dock, your
HDMI inputs, and a grid of the apps you actually use, without the banners and
recommendation rows of Samsung's Smart Hub.

It installs as a normal app through Samsung's Developer Mode. No root, no firmware changes,
and nothing of Samsung's is removed or modified.

> Not affiliated with or endorsed by Samsung. Inspired by
> [CleanYourTV](https://github.com/Gathin23/cleanyourtv), which does the same job (and more)
> for Android and Google TV.

## What it does, and what it can't

| Does | Can't |
|---|---|
| Favourites dock: hold **OK** on any app to add or remove it | Replace Samsung Home: the **Home button** always opens Samsung's Smart Hub |
| Shows connected **HDMI inputs**; **Back** returns to the dashboard | Remove or disable Samsung's own apps or ad services |
| Lists only real apps (store, third-party and Samsung's user apps) | Start automatically on every power-on (see [Startup](#make-the-tv-start-in-clean-hub)) |
| Clock, greeting and the name of the highlighted app | |

Samsung's public developer access only lets you install and run your own apps, so these
limits come from the TV, not from this project.

### Why the app list is filtered so strictly

A Samsung TV reports well over 100 "visible" apps, most of them internal tools: setup wizards,
Smart Hub reset, cloning, hotel-mode and **factory test apps**. Opening the factory burn-in
test (`org.tizen.AgingApp`) from an early version of this dashboard put a 2025 The Frame into a
colour-cycling test pattern that survived restarts and unplugging, until it finished on its own.

So Clean Hub uses an allow-list: apps from Samsung's store (10-character package IDs),
apps from other companies, and a short list of Samsung's own viewer apps such as Netflix,
Prime Video, Apple TV, Internet, Art Mode and Samsung TV Plus. Everything else is hidden.
If an app you use is missing, add its ID to `SAMSUNG_USER_APPS` in [app/js/main.js](app/js/main.js).

## Tested on

| TV | Model | Year | Tizen |
|---|---|---|---|
| Samsung The Frame 50" | TQ50LS03FAUXXC | 2025 | 9.0 |

Reports from other models are welcome. Open an issue with your model number and what worked.

## Setup

You need a Mac, Windows or Linux computer on the same network as the TV, and a free Samsung
account. The whole setup takes about 30 minutes the first time.

### 1. Turn on Developer Mode on the TV

1. Find your computer's IP address (on a Mac: `ipconfig getifaddr en0`).
2. On the TV, open the **Apps** tab on the Home screen.
3. Enter **1 2 3 4 5**. Remotes without number keys have a **123** button that shows a number pad.
   The code is picky: on the 2025 The Frame it only worked after several tries by hand, and
   sending the keys over the network never worked. On some 2024+ models it has to be entered
   with the **Settings** tile at the bottom of the Apps page highlighted.
4. In the **Developer Mode** box, switch it **On**, enter your computer's IP, and press **OK**.
5. **Restart the TV properly: unplug it for 30 seconds.** The power button only puts it in
   standby (or Art Mode), and Developer Mode doesn't start until a real restart.

### 2. Install Samsung's Tizen command-line tools

1. Download the **web-cli** installer for your system from
   [download.tizen.org/sdk/Installer](https://download.tizen.org/sdk/Installer/) (about 330 MB).
2. Run it **without sudo**, for example:
   ```bash
   chmod +x web-cli_Tizen_SDK_10.0_macos-64.bin
   ./web-cli_Tizen_SDK_10.0_macos-64.bin --accept-license ~/tizen-studio
   ```
   Running it with sudo leaves `~/.package-manager` owned by root, and the package manager then
   fails with a misleading "JDK not found" error. Fix that with
   `sudo chown -R "$(whoami)" ~/.package-manager`.
3. Install Samsung's TV and certificate extensions:
   ```bash
   ~/tizen-studio/package-manager/package-manager-cli.bin install --accept-license cert-add-on Certificate-Manager TV-SAMSUNG-Extension-Tools
   ```
4. **Apple Silicon Macs:** Samsung's `sdb` tool is Intel-only, so install Rosetta first:
   `softwareupdate --install-rosetta --agree-to-license`.

### 3. Create your signing certificate

A Samsung certificate only works on the TVs listed in it, so everyone has to make their own.
That's also why there's no ready-made app file to download.

1. Connect to the TV: `~/tizen-studio/tools/sdb connect <TV-IP>:26101`
2. Open **Certificate Manager** (`~/tizen-studio/tools/certificate-manager/`).
3. Create a new profile: **Samsung** → **TV** → a profile name of your choice.
4. Author certificate: create a new one and sign in with your Samsung account.
5. Distributor certificate: create a new one, privilege **Public**. The TV's DUID fills in
   automatically while the TV is connected. Finish.

Keep the certificate files (in `~/SamsungCertificate/`) and their passwords private and backed
up. You need them for every update. Certificates are valid for one year.

### 4. Install Clean Hub

```bash
TV_HOST=192.168.1.50 CERT_PROFILE=<your profile name> scripts/install.sh
```

The script packages the app with your certificate, installs it and starts it. Afterwards it
appears in the TV's **Apps** list as **Clean Hub**.

## Make the TV start in Clean Hub

Samsung doesn't let apps replace the Home screen, but you can make the TV come back to the last
app you used:

1. **Settings → All Settings → General & Privacy → Start Screen Options**
   (on some firmware: **General → Smart Features**).
2. Turn **off** "Start with Smart Hub Home" and "Autorun Samsung TV Plus".
3. Turn **on** "Autorun Last App".
4. Leave Clean Hub open when you turn the TV off.

Without step 2, a TV with no aerial or cable starts in Samsung TV Plus instead. Samsung owners
report these settings don't stick on some firmware versions.

## Fewer ads elsewhere

- **Settings → General & Privacy → Terms & Privacy:** turn off **Interest-Based Advertisement**
  and **Viewing Information Services**.
- Point the TV's DNS at an ad-blocking resolver (**Connection → Network → Network Status →
  IP Settings**), for example AdGuard DNS `94.140.14.14`. This can break Samsung TV Plus.

## Development

- [app/](app/) is a plain Tizen web app: `config.xml`, `index.html`, `css/`, `js/main.js`.
- `scripts/preview.sh` runs it in a desktop browser at http://localhost:8765 with fake apps
  from [preview/mock.js](preview/mock.js). Arrow keys and Enter work like the remote; **R**
  stands in for the red button.
- Debugging on the TV: `~/tizen-studio/tools/sdb -s <TV-IP>:26101 shell 0 debug CleanSHub1.Dashboard`
  prints a port; forward it with `sdb forward tcp:9222 tcp:<port>` and open
  `http://localhost:9222/json` for a Chrome DevTools connection.

When sharing logs or reports, leave out the TV's DUID, MAC addresses and IP. The TV's
`http://<tv>:8001/api/v2/` reply includes all of them.

## License

[MIT](LICENSE)
