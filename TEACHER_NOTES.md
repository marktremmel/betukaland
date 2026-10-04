# Betűkaland (Typing Adventure): teacher notes

Version 0.4: all seven regions are playable, each with three levels and a boss, plus a practice corner with free sentence practice and a storybook. Title screen, player profiles with a choice of six figures, placement test, world map, shop, rest spots, results with stars and a chart, saving with a code and a file, the teacher screen with CSV export, and credits.

## Running it

Online: put the folder in a GitHub repository and turn on GitHub Pages (see README.md). Students open the link in Chrome, Edge or Safari. Nothing to install.

Offline: double-click `index.html`. It works from a USB stick or a shared drive, on Mac, Windows and Chromebook, because every image and sound is also packed into `assets/pack.js` (browsers refuse to load loose files for a page opened from disk).

The canvas is 384×216 pixels, scaled by a whole number to stay sharp: 3× on a 1366×768 screen, 4× on 1080p, more on an iMac. If the game looks small, make the browser window full screen (Ctrl+Cmd+F on a Mac, F11 on Windows).

## What a child does

1. "Ki játszik?": picks their profile or makes a new one: a nickname (not their real name), a figure to play as (Nyuszi, Berie, Béka, Gomba, Rák or Sirály), their grade band (3-4 or 5-6) and the word language (Hungarian or English). The figure is the hero that walks through the levels; creatures of the same kind are left out of that child's levels, so a frog never meets a frog. Shop outfits recolour whichever figure was chosen.
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

The first button on the map. Nothing here unlocks anything or can be lost; it is extra typing for children who want more, for early finishers, or for a quiet ten minutes at the start of a lesson. Three tabs (keys 1, 2, 3):

- Kihívás: the daily challenge, as before (same level for the whole class that day, in the highest region the child has open).
- Mondatok: short, simple sentences from any region the child has opened, chosen with the arrow keys. 8 sentences for grades 3-4, 10 for grades 5-6, one per creature, last one opens a chest. Only keys the child already knows, so a Region 1 child gets "a kék sas fél" and a Region 7 child gets "Szép a virág." A sample sentence shows before starting.
- Történetek: the storybook. Short everyday stories (getting up in the morning, the garden, the market, school, pancakes, the park, a birthday, the shop, a trip, a hamster, the rain, drawing...) typed sentence by sentence. When the last sentence is typed, the whole story appears on one page to read back. Each story keeps its best stars. A story opens as soon as the child has every key it needs: the first four (Regions 3, no capitals yet) are written in lower case, Region 5 adds accented ones, Region 6 opens the rest. 17 Hungarian stories, 7 English ones.

Practice and story results go into the child's history and the teacher table like any level, and earn a few coins, but give no map stars.

Adding a story: in `data/words_hu.js`, add an object to `BK_STORIES_HU` with an `id`, a `title` and `lines` (one sentence per line, 4 to 6 lines). The game works out by itself which region opens it.

## Rewards

Coins from every creature, chest and boss; treasures (fruit and sweets icons) in the Hátizsák; outfits (five colours of the child's figure) and pets (Rákocska, Homokbogár, Sirály) in Karou's shop, which walks behind the bunny. The map lights up as regions are cleared.

## Settings (per child)

On-screen keyboard on or off, finger colours on or off, music, sounds, speed-run mode (a visible timer and best times, off by default; for older students), word language.

## Saving

Everything saves automatically to the browser after every level. Profiles live in that browser on that computer only.

To continue on another computer, the child opens "Mentés" on the map: a save code (about 60 characters, no letters that look alike, with a checksum) or "Mentés fájlba" for a file. On the other computer: "Mentőkód" on the player screen. The code carries progress, stars, coins, outfits, pets, treasures and a summary of the weaker keys; the file carries everything.

If school computers wipe browser data at logout, ask students to save a code at the end of every lesson (a line in their exercise book is enough).

## Teacher screen

"Tanári" on the title screen. The first time it asks you to choose a PIN (4 to 8 digits). The PIN keeps curious students out; it is not real security. Forgot it? Add `?resetpin` to the end of the address once; the PIN is cleared and every profile stays.

The table shows for every profile on this computer: grade, current region, total stars, levels played, average accuracy and WPM over the last 10 levels, best WPM, the five weakest keys, and the date last played. "Export CSV" downloads a file that opens directly in Hungarian Excel (semicolons, decimal commas, UTF-8). "Import save files" pulls in students' save files, so you can collect a class onto your own computer. Each row also shows a student's save code and has a delete button.

## Keyboards

The on-screen keyboard is the standard magyar QWERTZ: 0 left of the 1, í left of the y, é á ű at the end of the home row. The game reads the character a key produces, not its position, so it works on any computer set to the Hungarian layout, Mac or PC.

The game notices two common problems and tells the child gently: Caps Lock left on, and a computer set to an English layout (y and z swapped, no é). On Mac keyboards without the extra key next to the left Shift (US-shape keyboards), í sits elsewhere; check one machine before Region 5 arrives.

## The bosses

The library has only two boss-size characters in the Sunny Land style (Berie's big bird and the Sunny dragon). I searched the rest of the Legacy Collection and found usable extras: the Tiny RPG Frog Knight (Region 1 boss), the Gothicvania mutant toad (mini-boss), a small red dragon (Regions 4 and 6, recoloured for 6) and a slime (Region 6 mini-boss). Big bird and the toad appear recoloured in later regions; the big Sunny dragon is saved for the final boss. Ogres, demons, ghosts and the fire creature were left out as too scary for 8-year-olds. `docs/previews/boss_candidates.png` shows them all side by side.

If you want more, the full Sunny Land collection by Ansimuz (itch.io) has more creatures in exactly this style.

## Changing things

Word lists: `data/words_hu.js` and `data/words_en.js`. Add words separated by spaces; the game filters them per region automatically. `python3 tools/check_words.py` reports how many words each region gets.

Child-facing text: `src/strings_hu.js`. Numbers (star thresholds, speed targets, level length, prices): `src/config.js`.

Assets: `tools/build_assets.py` copies what the game uses from the Game Assets library (it never changes the library), packs sprite strips, converts sounds to MP3 and bakes the font. Then `tools/build_pack.py` rebuilds the offline bundle.

## Known limits of this version

Music was picked by title, not by listening: swap tracks in `tools/build_assets.py` (MUSIC table). The voice praise clips are English words ("Great!", "Wow!"); all on-screen praise is Hungarian.

## Testing everything quickly

Test mode: add `?debug` to the end of the address (for example `index.html?debug` or `https://<you>.github.io/<repo>/?debug`). Every region and level opens for every profile. Inside a level, Tab finishes the current word (press it again for the next one) and Ctrl+Enter (Cmd+Enter on a Mac) finishes the whole level, so you can jump straight to bosses and results. The title screen says "TESZT MÓD" so you know it is on. Students never see it unless the address has `?debug`.

Ready-made test profiles: on the player screen press "Mentőkód" and paste a code.

- Everything unlocked (nickname Teszt, grade 5-6, 9999 coins, every star, all outfits, pets and treasures): `4BND-G893-4KKG-ZZZZ-ZZZZ-ZZZZ-7W3G-7ZZZ-ZZZZ-ZG00-0000-0000-0000-0000-0000-N8`
- Fresh start with all regions open but no stars (nickname Kezdo, grade 3-4, 500 coins): `43NB-88CG-CE0Z-8000-0000-0000-0400-0000-0000-0000-0000-0000-0000-0000-0000-FP`

Delete test profiles afterwards on the teacher screen, so they do not show up in the class CSV.
