# Frontend screens

See PROJECT-STRUCTURE.md for the current structure. Most screens are display-only HTML/CSS/JavaScript examples. Their form submissions clear inputs and show a notice without saving or sending data.

Meeting/ is a live Jitsi integration adapted from the supplied meetingZoom/script.js. Clicking Join loads the Jitsi iframe with the entered display name, a unique room name and responsive dimensions. Audio and video start muted; participants control their devices inside Jitsi. Each room remains in the page URL for reload/rejoin. Copy Invite shares a direct Jitsi link so it also works when this website is running only on localhost. The public Jitsi service requires the host to sign in. The website must run on HTTPS or localhost for media access. Calls use Jitsi; there is no local meeting or invitation backend.

Run `node scripts/check-meeting.mjs` for room, lifecycle, retry and validation checks using a fake Jitsi API. This does not exercise a real two-person call.
