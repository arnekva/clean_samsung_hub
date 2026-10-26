# Clean Hub

A simple app launcher for Samsung Tizen TVs. It shows your favourite apps, your HDMI inputs and
a grid of installed apps, without Smart Hub's banners and recommendation rows.

It's a regular Tizen web app, installed through Developer Mode with your own Samsung
certificate. It doesn't remove or change anything on the TV.

Not affiliated with Samsung. For Android and Google TV, see
[CleanYourTV](https://github.com/Gathin23/cleanyourtv).

## Limitations

- The Home button still opens Samsung's Smart Hub. Apps can't replace it.
- Samsung's own apps and ad services can't be removed or disabled with developer access.
- You need to build and sign it yourself. Samsung certificates are tied to specific TVs, so
  there's no ready-made download.

## Usage

| Remote | Action |
|---|---|
| Arrows | Move |
| OK | Open app or input |
| Hold OK | Add or remove favourite |
| Back | Leave an HDMI input |

The grid only shows store apps, third-party apps and a few Samsung apps (Netflix, Prime Video,
Apple TV, Internet, Art Mode, Samsung TV Plus and so on). The TV reports over 100 internal apps
as visible, including factory tools: opening `org.tizen.AgingApp` starts a burn-in test pattern
that runs until it finishes, even across restarts. To show a missing app, add its ID to
`SAMSUNG_USER_APPS` in [app/js/main.js](app/js/main.js).

Tested on a 2025 The Frame (TQ50LS03FAUXXC, Tizen 9.0).

## Setup

### 1. Developer Mode

1. Note your computer's IP address (macOS: `ipconfig getifaddr en0`).
2. On the TV, open the **Apps** tab and enter `12345` (use the **123** button if the remote has
   no number keys). On some models it only works with the **Settings** tile at the bottom of
   the Apps page highlighted, and it can take a few tries.
3. Turn Developer Mode on, enter your computer's IP and press OK.
4. Unplug the TV for 30 seconds. The power button only puts it in standby.

### 2. Tizen CLI

1. Download the web-cli installer from
   [download.tizen.org/sdk/Installer](https://download.tizen.org/sdk/Installer/) and run it
   without sudo:
   ```bash
   chmod +x web-cli_Tizen_SDK_10.0_macos-64.bin
   ./web-cli_Tizen_SDK_10.0_macos-64.bin --accept-license ~/tizen-studio
   ```
   If you did use sudo, run `sudo chown -R "$(whoami)" ~/.package-manager` afterwards.
2. Install the Samsung extensions:
   ```bash
   ~/tizen-studio/package-manager/package-manager-cli.bin install --accept-license cert-add-on Certificate-Manager TV-SAMSUNG-Extension-Tools
   ```
3. On Apple Silicon, install Rosetta (`sdb` is Intel-only):
   `softwareupdate --install-rosetta --agree-to-license`

### 3. Certificate

1. Connect to the TV: `~/tizen-studio/tools/sdb connect <tv-ip>:26101`
2. Open Certificate Manager from `~/tizen-studio/tools/certificate-manager/`.
3. Create a profile: **Samsung** → **TV**, new author certificate (sign in with a Samsung
   account), new distributor certificate with **Public** privilege. The TV's DUID is filled in
   while it's connected.

Certificates are saved in `~/SamsungCertificate/` and expire after a year. Keep them and their
passwords private.

### 4. Install

```bash
TV_HOST=<tv-ip> CERT_PROFILE=<profile> scripts/install.sh
```

The app shows up as **Clean Hub** under Apps.

## Starting the TV in Clean Hub

In **Settings → All Settings → General & Privacy → Start Screen Options**, turn off
**Start with Smart Hub Home** and **Autorun Samsung TV Plus**, and turn on **Autorun Last App**.
The TV then reopens whatever app was last open. Without turning off TV Plus autorun, a TV with no
aerial starts in Samsung TV Plus.

## Development

- `scripts/preview.sh` runs the app in a browser at http://localhost:8765 with fake data from
  [preview/mock.js](preview/mock.js). R acts as the red button.
- To debug on the TV, run
  `~/tizen-studio/tools/sdb -s <tv-ip>:26101 shell 0 debug CleanSHub1.Dashboard`, forward the
  printed port with `sdb forward tcp:9222 tcp:<port>`, and connect Chrome DevTools via
  http://localhost:9222/json.

The TV's `http://<tv-ip>:8001/api/v2/` response includes its DUID and MAC addresses, so leave
those out of issues and logs.

## License

[MIT](LICENSE)
