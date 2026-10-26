// Fake tizen API so Clean Hub can be checked in a desktop browser.
// Includes system and factory entries like a real TV reports, which the app must hide.
window.tizen = {
    application: {
        getAppsInfo: function (ok) {
            var userApps = [
                ['MCmYXNxgcu.DisneyPlus', 'Disney+'], ['9Ur5IzDKqV.TizenYouTube', 'YouTube'],
                ['org.tizen.netflix-app', 'Netflix'], ['org.tizen.primevideo', 'Prime Video'],
                ['rJeHak5zRg.Spotify', 'Spotify'], ['n8N84lD1cR.NRKTVBeta', 'NRK TV'],
                ['PyZfkXAf88.tv2sumoTizen', 'TV 2 Play'], ['niYSnzL6h1.Viaplay', 'Viaplay'],
                ['5b8c3eb16b.BeamCTVDev', 'HBO Max'], ['com.samsung.tv.aria-video', 'Apple TV'],
                ['org.tizen.browser', 'Internet'], ['com.samsung.tv.SmartThingsApp', 'SmartThings'],
                ['org.tizen.art-app', 'ArtApp'], ['com.microsoft.copilot', 'Copilot']
            ];
            var systemApps = [
                ['org.tizen.AgingApp', 'AgingApp'], ['org.tizen.factory', 'factory'],
                ['org.tizen.smarthub-reset', 'org.tizen.smarthub-reset'], ['org.tizen.cloning', 'cloning'],
                ['yL49PNFmjW.PromotionApp', 'Samsung Promotion'], ['com.samsung.tv.sdm', 'sdm']
            ];
            ok(userApps.concat(systemApps).map(function (a) {
                return { id: a[0], name: a[1], show: true, iconPath: 'icon.png' };
            }));
        },
        launch: function (id) { console.log('launch', id); }
    },
    systeminfo: {
        getPropertyValue: function (p, ok) {
            ok({ connected: [{ type: 'HDMI', number: 1 }, { type: 'HDMI', number: 2 }, { type: 'TV', number: 1 }] });
        }
    },
    tvinputdevice: { registerKey: function () {} }
};

// The browser has no red button; let R stand in for it.
document.addEventListener('keydown', function (e) {
    if (e.key === 'r' || e.key === 'R') {
        document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 403, bubbles: true }));
    }
});
