# Betűkaland (Typing Adventure): teacher notes

Version 0.8.3: all seven regions are playable, each with three levels and a boss, plus a practice corner (daily goals with a streak, sentence practice, a tricky-letter drill, the endless road, and a storybook) and crowns to win on every level of a finished region. The menus can be Hungarian or English, the text uses a font made for young readers (three to choose from), and the keyboard can be Hungarian or US English. Title screen, player profiles with a choice of thirteen figures, placement test, world map, shop, rest spots, results with stars and a chart, saving with a code and a file, the teacher screen with CSV export, and credits.

## Running it

Online: put the folder in a GitHub repository and turn on GitHub Pages (see README.md). Students open the link in Chrome, Edge or Safari. Nothing to install.

Offline: double-click `index.html`. It works from a USB stick or a shared drive, on Mac, Windows and Chromebook, because every image and sound is also packed into `assets/pack.js` (browsers refuse to load loose files for a page opened from disk).

The canvas is 384×216 pixels, scaled by a whole number to stay sharp: 3× on a 1366×768 screen, 4× on 1080p, more on an iMac. If the game looks small, make the browser window full screen (Ctrl+Cmd+F on a Mac, F11 on Windows).

## What a child does

1. "Ki játszik?": picks their profile or makes a new one: a nickname (not their real name), a figure to play as (Nyuszi, Berie, Béka, Gomba, Rák, Sirály, and the seven animals suggested by class 4.B: Gepárd, Panda, Tűzróka, Csótány, Tigris, Csikóhal, Jegesmedve; two pages, < > or the arrow keys turn the page), their grade band (3-4 or 5-6) and the word language (Hungarian or English). The figure is the hero that walks through the levels; creatures of the same kind are left out of that child's levels, so a frog never meets a frog. Shop outfits recolour whichever figure was chosen. The figure can be changed any time for free in the shop on the map (Bolt → Figurák); the stars, coins, outfits and pets stay.
2. Placement test, first time only, about two minutes. Five words for each of: home row, top row, bottom row, capitals, accents, numbers. It stops at the first stage they cannot pass at 90% accuracy (and a gentle minimum speed), and opens the map up to that region. "Kihagyom" skips it.
3. World map: arrow keys choose a region, 1 to 4 choose a level, Enter plays. Mouse works everywhere too.
4. A level: the bunny walks; creatures, gates, wobbly bridges and chests arrive carrying a word. Typing it clears the way. A correct letter turns green with a spark and a click; a wrong letter only shakes the bubble a little with a soft sound. Creatures that arrive simply wait. Nothing can be lost.
5. Level 1 of a region starts with a warm-up that shows each new key and the finger that presses it.
6. Results: stars, accuracy, speed in words per minute, coins, and a chart of the last 12 levels.

Each level takes 2 to 4 minutes at a young child's pace (about 80 characters for grades 3-4, 130 for grades 5-6), so a lesson fits several.

## The seven regions

| # | Region | Keys | Look | Creatures | Boss |
|---|---|---|---|---|---|
| 1 | Napos rét | a s d f j k l é | Sunny meadow | frogs, mushrooms, gulls; mini-boss toad | Béka Lovag |
| 2 | Homokos part | g h, then q w e r t z u i o p | beach with palms | crabs, sandbugs, gulls; mini-boss shell | Kócos Sirály |
| 3 | Kagylós öböl | y x c v b n m , . - | beach, often at sunset | starfish, octopus, crabs; mini-boss shell | Viharmadár |
| 4 | Hegyi ösvény | capitals with Shift | mountains at dusk | recoloured frogs and mushrooms; mini-boss toad | Sárkányfióka |
| 5 | Vörös kanyon | á í ó ö ő ú ü ű | red canyon | recoloured crabs and starfish | Napmadár |
| 6 | Alkonyerdő | 0-9 and ? ! : ( ) " | pine forest with a full moon | mushrooms, frogs, octopus; mini-boss slime | Esti Sárkány |
| 7 | Felhővár | sentences and short stories | above the clouds | everyone | Felhősárkány |

Region 4 shows a tip when a child uses the Shift on the same side as the letter ("Tipp: ehhez a jobb oldali Shift kell!"); it is never counted as a mistake. Region 6 mixes numbers into phrases ("3 cica", "Hány alma? 5!", "(42)", "Ceruza: 12 darab.") and its boss alternates real sentences with number phrases. Region 7 types whole stories sentence by sentence; the boss is one complete five-sentence story. English-language profiles practise Region 5 with Hungarian words, because English has no accented words.

Beating a boss opens the next region, and "Tovább" on the results screen goes straight to it.

## How the learning works

Inside a region the material climbs: level 1 letters and syllables, level 2 syllables and real words, level 3 words and word pairs and ends with a mini-boss sentence, the boss is five sentences (seven for grades 5-6).

Words come only from keys the child has unlocked. With eight keys in Region 1 the Hungarian list gives 26 real words (kés, kék, fél, sas, dal, falka, kakas, sakk...) and 14 short sentences ("a kék sas fél"). Spelling is always correct: words with á, ó, ű and the rest appear only once Region 5 teaches those keys; nothing is "simplified" by dropping accents.

Adaptive practice: every key keeps a rolling accuracy and reaction time. About a third of the words in a level are chosen to contain the child's weakest keys.

Stars put accuracy first: one star for finishing, two at 92% accuracy, three at 96% plus the speed target for the region (7 WPM for grades 3-4, 11 for 5-6, two more per later region). WPM counts 5 characters as a word and only counts typing time, not walking (pauses over 3 seconds count as 3 seconds).

Every level is assembled fresh from a seeded random generator: the creature mix, the order of chests, gates, bridges, the shop and the rest spot, the sky (morning, day, sunset, night) and the weather (falling leaves, wind, rain). "Kihívás" (in the practice corner) is the daily challenge: the date is the seed, so the whole class gets the same level that day.

## Practice corner (Gyakorlás)

The first button on the map. Nothing here unlocks anything; it is extra typing for children who want more, for early finishers, for a quiet ten minutes at the start of a lesson, and for children who have finished every region. Three tabs (keys 1, 2, 3):

- Ma (Today): three small goals for the day and the streak, plus the daily challenge (Enter).
- Gyakorlás (Practice): pick a region with the arrow keys (it decides which letters appear), then one of three modes (up/down):
  - Mondatok (Sentences), see below.
  - Nehéz betűk (Tricky letters): a drill built from the child's own three weakest keys, from the same per-key data as the teacher table. Two short warm-up rows of those keys, then real words that contain them. The keys are shown before starting. A brand-new player gets the region's new keys instead.
  - Végtelen út (Endless road): creatures keep coming, each a little faster. The word shows at once and can be typed while the creature walks closer. One that reaches the hero costs a heart; three hearts, then the run ends. The record (words in one run) is kept per child. This is the only mode where something can be "lost", so it lives here as an optional challenge, never on the main path.
- Mondatok: short, simple sentences from any region the child has opened, chosen with the arrow keys. 8 sentences for grades 3-4, 10 for grades 5-6, one per creature, last one opens a chest. Only keys the child already knows, so a Region 1 child gets "a kék sas fél" and a Region 7 child gets "Szép a virág." A sample sentence shows before starting.
- Történetek: the storybook. Short everyday stories (getting up in the morning, the garden, the market, school, pancakes, the park, a birthday, the shop, a trip, a hamster, the rain, drawing...) typed sentence by sentence. When the last sentence is typed, the whole story appears on one page to read back. Each story keeps its best stars. A story opens as soon as the child has every key it needs: the first four (Regions 3, no capitals yet) are written in lower case, Region 5 adds accented ones, Region 6 opens the rest. 17 Hungarian stories, 7 English ones.

Practice and story results go into the child's history and the teacher table like any level, and earn a few coins, but give no map stars.

## Daily goals, streak and crowns: something to do after the last boss

Daily goals: every day each child gets three small goals, one "amount" goal (type 250 letters, or 400 for grades 5-6; or finish 3 rounds) and two others drawn from: get 3 stars, reach 95% accuracy, type a whole story, do the tricky-letter drill, play the daily challenge, reach 15 (25) words on the endless road. They change every day, differ between children, and anything counts, including normal levels. Each goal pays 10 coins, all three a 15-coin bonus. Progress shows on the Today tab, and the map's top bar shows how many are done (the tick, 0/3 to 3/3); clicking it opens the Today tab.

Streak: the flame on the map counts the days in a row on which the child finished at least one round. A day without play starts it again from 1 (play on Monday and Wednesday: Wednesday is day 1 again), so weekends break it. That is fine: it is a nudge, not a rule, and the game never scolds. The longest streak is remembered.

Crowns: once a region's boss is beaten, every level in that region (boss included) gets a crown to win: 97% accuracy and a speed 4 WPM above that level's 3-star target. Empty crowns appear next to the stars on the map and turn gold when won. The results screen tells the child what the crown needs after a 3-star round. Numbers: `BK.CROWN` in `src/config.js`.

The teacher table and the CSV now also show crowns, the current streak and the endless-road record.

Adding a story: in `data/words_hu.js`, add an object to `BK_STORIES_HU` with an `id`, a `title` and `lines` (one sentence per line, 4 to 6 lines). The game works out by itself which region opens it.

## Rewards

Coins from every creature, chest and boss; treasures (fruit and sweets icons) in the Hátizsák; outfits (five colours of the child's figure) and pets (Rákocska, Homokbogár, Sirály) in Karou's shop, which walks behind the bunny. The map lights up as regions are cleared.

## Settings (per child)

Two columns. On/off: on-screen keyboard, finger colours, music, sounds, speed-run mode (a visible timer and best times, off by default; for older students). Choices (click to cycle): word language, interface language, font, keyboard (Magyar / English (US)).

## Language: menus and words are separate

Two different settings, so foreign students can follow the game:

- Interface language (Nyelv / Language): every menu, button, tip, region and boss name, the finger names and the save-code screen, in Hungarian or English. The title screen has a "English" / "Magyar" button in the top right corner, so a child can switch before even picking a profile. Each profile remembers its own choice, and the computer remembers the last one used.
- Word language (Szavak nyelve / Word language): what the child types. Hungarian or English word lists, chosen when the profile is made and changeable in Settings.

Any mix works: English menus with Hungarian words is the usual set-up for an international student learning Hungarian typing; Hungarian menus with English words suits a Hungarian child practising English. The teacher screen stays in English.

The keyboard setting (Settings → Billentyűzet / Keyboard) is a third, separate choice: see Keyboards below.

## Fonts

All text is drawn in a real font, sharp at any screen size (the art stays pixel art). Settings → Betűtípus / Font cycles through three, all with every Hungarian letter:

- Andika (default): made by SIL for children learning to read. Single-storey a and g like handwriting taught in school, I, l and 1 easy to tell apart.
- Atkinson Hyperlegible: made by the Braille Institute for low-vision readers; every letter shaped to be unmistakable.
- Lexend: wide, airy letters designed for reading fluency; some children with reading difficulties find it easier.

The choice is saved per child. The font files are embedded in `assets/fonts/fonts.js` (so they work offline); the licences (SIL Open Font License) are in the same folder. Adding another font: put its regular and bold files in `fonts.js` under a new key and add a line to `BK.FONTS` in `src/config.js`. It needs the letters ő and ű, which many fonts lack.

## Saving

Everything saves automatically to the browser after every level. Profiles live in that browser on that computer only.

To continue on another computer, the child opens "Mentés" on the map: a save code (about 30 to 60 characters, depending on progress; no letters that look alike; a checksum catches typos) or "Mentés fájlba" for a file. On the other computer: "Mentőkód" on the player screen. The code carries progress, stars, crowns, story stars, coins, outfits, pets, treasures, the endless-road record and the keyboard, language and font settings; the file carries everything (also the full history and the per-key data). Loading a child's code on a computer that already has the same child (same nickname and grade) merges the two and keeps the best of both, so nothing is lost. Codes made by older versions still load.

If school computers wipe browser data at logout, ask students to save a code at the end of every lesson (a line in their exercise book is enough).

## The 4.B figures

Class 4.B suggested seven new animals. They were drawn with ChatGPT image generation (the prompts are in `new_animals/CHATGPT_PROMPTS.md`) and turned into game sprites by `tools/clean_ai_sprites.py`: it removes the magenta background, cuts the frames, shrinks them to the game's pixel size with one shared palette, adds an outline and lines the frames up. The cleaned strips live in `art/animals/`; `tools/build_assets.py` packs them like the library sprites, outfit colours included. The raw ChatGPT pictures stay in `new_animals/` and are not part of the game or git. To redo one animal from new pictures: save them in `new_animals/`, fix the file names at the top of the tool, run `python3 tools/clean_ai_sprites.py tiger`, then `python3 tools/build_assets.py --local` (no asset library needed) and `python3 tools/build_pack.py`. Since v0.8 the cleanup takes colours only from inside the figure and draws one even outline, so the edges are crisp. The Credits screen thanks 4.B.

## Halloween Night (switch in the Teacher screen)

The "Halloween: ki/be" button in the top left of the title screen (or "Halloween Night: off/on" in the Teacher screen) puts a Halloween button on every child's map on this computer, and "Boldog Halloweent!" on the title screen. It opens a small friendly spooky story in four stages: Tökös ösvény, Ködös erdő, Denevérhíd (with a clumsy mummy) and A Tökkirály kertje, where the Pumpkin King is grumpy because nobody came to his party. Typing his sentences makes him laugh and hand out candy, and the child gets a new pet. The stages open one after the other and give stars like levels.

The typing uses only the keys of the child's newest region, with Halloween words and sentences mixed in where they fit those keys (`data/halloween.js`), so a child in region 1 and one in region 6 both get the right material. Normal progress, stars and crowns are not touched. The Halloween stars stay on this computer and are not in the save code; the pet is. Switch it off again after Halloween; the pet stays.

The characters (ghost, pumpkin head, witch cat, bat, mummy, Pumpkin King) and 25 roadside decorations (pumpkins, lanterns, the BÚ tombstone, a scarecrow, a well, crooked trees...) were drawn with ChatGPT (prompts in `halloween/HALLOWEEN_PROMPTS.md`) and cut out by `tools/clean_ai_sprites.py` into `art/halloween/`; the file names it reads are at the top of the tool, and `HW_DECOR` picks the props (characters, the skull and the coffin are left out). After changing a picture: `python3 tools/clean_ai_sprites.py`, then `python3 tools/build_assets.py --local` and `python3 tools/build_pack.py`. With Halloween on, the title screen shows the pumpkin head and the bat. The pet for the Pumpkin King is the bat.

## Teacher screen

"Tanári" on the title screen. The first time it asks you to choose a PIN (4 to 8 digits). The PIN keeps curious students out; it is not real security. Forgot it? Add `?resetpin` to the end of the address once; the PIN is cleared and every profile stays.

The table shows for every profile on this computer: grade, current region, total stars, crowns, current streak, levels played, average accuracy and WPM over the last 10 levels, best WPM, the five weakest keys, and the date last played. "Export CSV" downloads a file that opens directly in Hungarian Excel (semicolons, decimal commas, UTF-8). "Import save files" pulls in students' save files, so you can collect a class onto your own computer. Each row also shows a student's save code and has a delete button.

## Keyboards

Each child chooses the keyboard in Settings:

- Magyar (default): the standard Hungarian QWERTZ. 0 left of the 1, í left of the y, é á ű at the end of the home row.
- English (US): QWERTY, for a computer set to the US layout (or a student who uses one at home). The on-screen keyboard, the finger colours and the Shift tips follow it. Accented letters cannot be typed on it, so they are left out everywhere: words and sentences with á é í ó ö ő ú ü ű are skipped (Hungarian word lists still work, with fewer words: Region 1 has 17 instead of 26), Region 1 teaches a s d f j k l, Region 5 becomes a review of every letter so far, the placement test skips the accent stage, and stories that need accents are hidden.

The game reads the character a key produces, not its position, so typing works whatever the computer is set to; the setting decides what the game teaches and shows.

The game notices two common problems and tells the child gently: Caps Lock left on, and a computer whose layout does not match the game's (y and z swapped). The tip now points to Settings → Keyboard. On Mac keyboards without the extra key next to the left Shift (US-shape keyboards), í sits elsewhere; check one machine before Region 5 arrives.

## The bosses

The library has only two boss-size characters in the Sunny Land style (Berie's big bird and the Sunny dragon). I searched the rest of the Legacy Collection and found usable extras: the Tiny RPG Frog Knight (Region 1 boss), the Gothicvania mutant toad (mini-boss), a small red dragon (Regions 4 and 6, recoloured for 6) and a slime (Region 6 mini-boss). Big bird and the toad appear recoloured in later regions; the big Sunny dragon is saved for the final boss. Ogres, demons, ghosts and the fire creature were left out as too scary for 8-year-olds. `docs/previews/boss_candidates.png` shows them all side by side.

If you want more, the full Sunny Land collection by Ansimuz (itch.io) has more creatures in exactly this style.

## Safety of the generated drills

Words, sentences and stories come from curated lists. The drills the game makes up itself (letter groups, syllables, number phrases, the tricky-letter rows) are checked against a block list of rude Hungarian and English letter combinations, as parts of words, before a child ever sees them (`BLOCK` in `src/wordbank.js`). A test generating several hundred thousand drills across every region, both word languages and both keyboards found none left. If you ever spot one, add it to that list.

## Changing things

Word lists: `data/words_hu.js` and `data/words_en.js`. Add words separated by spaces; the game filters them per region automatically. `python3 tools/check_words.py` reports how many words each region gets.

Child-facing text: `src/strings_hu.js` and `src/strings_en.js` (same keys); English names of regions, bosses, outfits and treasures: `src/i18n.js`. Numbers (star thresholds, speed targets, level length, prices): `src/config.js`.

Assets: `tools/build_assets.py` copies what the game uses from the Game Assets library (it never changes the library), packs sprite strips and converts sounds to MP3. The fonts are not from the library; they live in `assets/fonts/`. Then `tools/build_pack.py` rebuilds the offline bundle.

## Known limits of this version

Music was picked by title, not by listening: swap tracks in `tools/build_assets.py` (MUSIC table). The voice praise clips are English words ("Great!", "Wow!"); on-screen praise follows the interface language.

## Testing everything quickly

Test mode: add `?debug` to the end of the address (for example `index.html?debug` or `https://<you>.github.io/<repo>/?debug`). Every region and level opens for every profile. Inside a level, Tab finishes the current word (press it again for the next one) and Ctrl+Enter (Cmd+Enter on a Mac) finishes the whole level, so you can jump straight to bosses and results. The title screen says "TESZT MÓD" so you know it is on. Students never see it unless the address has `?debug`.

Ready-made test profiles: on the player screen press "Mentőkód" and paste a code.

- Everything unlocked (nickname Teszt, grade 5-6, 9999 coins, every star and crown, all outfits, pets, treasures and story stars): `8BND-G893-4KKG-ZZZZ-ZZZZ-ZZZZ-7W3G-7ZZZ-ZZZZ-ZG00-ZZZZ-ZW33-ZZZZ-ZZZZ-ZW7Y`
- Fresh start with all regions open but no stars (nickname Kezdo, grade 3-4, 500 coins): `83NB-88CG-CE0Z-8000-0000-0000-04ZJ`

Delete test profiles afterwards on the teacher screen, so they do not show up in the class CSV.
