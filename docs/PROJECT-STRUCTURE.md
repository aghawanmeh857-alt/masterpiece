# OFOQ

Each screen has its own folder and matching HTML, CSS and JavaScript files. Navbar and footer markup is included directly in each HTML file. Arabic copy is written directly in HTML and example data; IDs, filter values and URLs remain stable. `assets/arabic-ui.css` supplies shared Arabic typography, RTL adjustments, readable card text and responsive navigation. `assets/arabic-ui.js` handles disclosure menus, active section links and Arabic browser-validation messages. Other styles and screen behavior remain local to each page.

- hero/userHero.html: the existing 3D entrance.
- Freelance/, Academy/, Jobs/, Internships/, Events/: section screens and nested detail screens.
- Account/Profile/, Dashboard/, Messages/, Settings/: account screens.
- Auth/Login/, Register/: form screens.
- Admin/dashboard.html, Meeting/meeting.html, Credits/credits.html: additional screens.
- assets/ and hero/assets/: images, 3D models and their credits.

Outside Meeting/, content is a fixed example. Forms preview the interface without sending data; there is no account creation, publishing, messaging or scheduling backend. Login validates the form, clears its fields, sets a boolean demo sign-in marker in sessionStorage and returns to the requested local page (or the account dashboard). No credentials or personal data are stored. The home navbar switches between login and logout; logout clears the marker and returns home. Its section links open the corresponding listing pages, while scrolling and the main story button retain the 3D tour. Meeting/ loads Jitsi on explicit join, generates a unique room in the URL and offers a direct Jitsi invitation link. The host must sign in with Jitsi; camera and microphone require HTTPS or localhost. Search, filters, tabs, dialogs and theme controls remain available. There are no JSON files or database.

Open index.html with Live Server or run Start-OFOQ.cmd for the 3D asset preview. The optional Node script only serves static files and does not accept or store submitted data. Bootstrap and Three.js remain CDN dependencies for the existing appearance.

Supporting previews also have their own files: hero/assets/3d/preview/Tour/, hero/assets/3d/preview/Assets/, and hero/assets/3d/Credits/.

Academy/ also includes a local learning experience. `learning.js` manages a cart, wishlist, simulated course ownership, lesson completion and notes in localStorage. `lesson-content.js` supplies original short interactive slide lessons. The course page offers playback, speed, fullscreen, a curriculum, progress and a practice question. These are sample lessons, not a full video course library. Checkout never charges money or asks for payment credentials. Run `node scripts/check-learning.cjs` to verify learning and catalog flows.
