# Betűkaland on itch.io

Everything for the page is in this folder:

- `betukaland-itch-0.6.3.zip`: the game (upload this)
- `cover_hu_630x500.png` / `cover_en_630x500.png`: cover image (pick one)
- `screenshots/`: 8 screenshots at 1152×648

## 1. Create the project

itch.io → Dashboard → Create new project, then fill in:

| Field | Value |
|---|---|
| Title | Betűkaland: Typing Adventure |
| Project URL | betukaland |
| Short description | A friendly typing adventure for kids. Hungarian and English. |
| Classification | Games |
| Kind of project | HTML |
| Release status | Released (or In development, if you still want to change things) |
| Pricing | No payments |
| Uploads | `betukaland-itch-0.6.3.zip`, tick "This file will be played in the browser" |

## 2. Embed options

| Option | Value |
|---|---|
| Embed in page | Manually set size |
| Viewport dimensions | 1152 × 648 |
| Mobile friendly | off (it needs a real keyboard) |
| Automatically start on page load | off (the "Run game" button gives the click that lets the music play) |
| Fullscreen button | on |
| Enable scrollbars | off |
| SharedArrayBuffer support | off |

## 3. Details

- Genre: Educational
- Tags: typing, educational, kids, hungarian, keyboard, pixel-art, touch-typing, school
- Language: Hungarian, English
- Inputs: Keyboard
- Accessibility: tick "Readable fonts" (Andika, Atkinson Hyperlegible, Lexend)
- Average session: About a half-hour
- Community: off, or Comments if you want feedback
- Visibility: Draft first, check it, then Public (or Restricted if only your classes should find it)

## 4. Page look (Edit theme)

These match the game's colours:

- Background: #6ec6f0 (sky blue)
- Text: #2b1a14 (dark brown)
- Links: #e0742c (orange)
- Buttons: #2e9e52 (green)
- Font: a clean sans; the title in the cover image already carries the logo

## 5. Description (paste into the Description box)

---

### Betűkaland

Gépelős kaland 3–6. osztályosoknak. A nyúl (vagy béka, vagy rák) végigsétál hat vidéken, és minden lény, kapu meg kincsesláda egy szót vagy mondatot kér. Aki begépeli, mehet tovább.

- Tízujjas gépírás lépésről lépésre: alapsor, felső sor, alsó sor, nagybetűk, ékezetek, számok
- Az ujjak színesek a képernyő-billentyűzeten, így látszik, melyik ujj mit üt
- Bemelegítő teszt az elején, ami megmondja, honnan érdemes kezdeni
- Főellenfelek, csillagok, korona, bolt ruhákkal és kisállatokkal
- Gyakorlósarok: napi kihívás, mondatok, rövid történetek, a nehéz betűk gyakorlása és a végtelen út
- Napi célok és sorozat, hogy legyen mit csinálni a pályák után is
- Magyar vagy angol szavak, magyar vagy angol felület
- Magyar QWERTZ és amerikai QWERTY billentyűzet
- Három jól olvasható betűtípus közül lehet választani

Tanároknak: a Tanári sarokban (PIN-kóddal) látszik minden gyerek haladása, letölthető CSV-ben, és mentőkóddal másik gépre is átvihető a játék. A játék nem gyűjt adatot, nincs fiók, nincs reklám. Minden a böngészőben marad.

Tipp: kattints a játékba, mielőtt gépelni kezdesz.

### Typing Adventure

A typing adventure for ages 8–12. A bunny (or frog, or crab) walks across six regions, and every creature, gate and treasure chest asks for a word or a sentence. Type it and you move on.

- Touch typing step by step: home row, top row, bottom row, capitals, accents, numbers
- Finger colours on the on-screen keyboard show which finger presses which key
- A short warm-up at the start finds the right place to begin
- Bosses, stars, crowns and a shop with outfits and pets
- Practice corner: daily challenge, sentences, short stories, tricky-letter drills and an endless road
- Daily goals and a streak, so there is something to do after the last level
- Hungarian or English words, Hungarian or English interface
- Hungarian QWERTZ or US QWERTY keyboard
- Three easy-to-read fonts to choose from

For teachers: the Teacher corner (PIN protected) shows every child's progress, exports a CSV, and save codes move a child's game to another computer. The game collects no data. No accounts, no ads. Everything stays in the browser.

Tip: click the game before you start typing.

### Credits

Art: Ansimuz (Sunny Land, Tiny RPG Battle Sprites, Gothicvania), Crabby Beach Assets Pack, Berie's Adventure: Seaside, Complete UI Essential Pack by Crusenho (CC BY 4.0), Addin's RPG Icon Packs, Effect and FX Pixel, Free Sky with Clouds Background by CraftPix.net.
Fonts: Andika (SIL), Atkinson Hyperlegible (Braille Institute), Lexend, all SIL Open Font License 1.1.
Music: Clement Panchout. Sound: Pixel Combat SFX by Helton Yan, Super Dialogue Audio Pack by Dillon Becker (CC BY 4.0), voices by Karen Cenon and Alex Brodie.
Engine: Phaser 3 (MIT).
The full list is on the Credits screen in the game.

---

## 6. Screenshots

Upload in this order: 01_title, 02_map, 04_story, 05_boss, 06_practice, 07_shop, 08_title_en, 09_warmup_en.

## 7. Notes for running it from itch

- Saves live in the browser's storage for itch's game server. Uploading a new version keeps them, but a different browser, a private window or clearing site data starts fresh. For school computers, the save codes are the safe way to carry progress.
- The children's Teacher corner PIN is per browser too, so set it once on each classroom computer.
- To update: build a new zip, then on the Edit page upload it and delete the old one (keep "played in the browser" ticked on the new file).
- itch shows the game in a frame. If keys do nothing, the game has lost focus; the game shows "Kattints a játékra! · Click the game to play" until it is clicked.
- Before you publish, check the asset licences once more for public sharing. The CC BY packs only need the credit (it is above and in the game). For the packs without a named licence, the store page where you got them says whether they may be used in a free published game.
