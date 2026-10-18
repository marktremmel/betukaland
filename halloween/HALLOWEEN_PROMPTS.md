# Halloween Night: ChatGPT prompts

Same method as the 4.B animals: one new chat per character, attach `style_reference.png` (in the `new_animals` folder) to the first message, get the design right first, then ask for the animation sheet in the same chat. Save the pictures into this folder (`halloween/`) and tell me; I clean them up the same way.

Everything faces RIGHT in the pictures; the game turns the creatures around.

## For a clean cut-out

The 4.B animals came out with slightly fuzzy edges because the picture's outline was soft and blended into the magenta. The cleanup in the game is better now, and these lines in the prompts help most:

- A crisp outline: one solid dark colour, the same thickness all round, hard pixel edges, no glow, no soft shadow, no blur.
- Big clear pixels: the character about 48 pixels tall, every pixel a sharp square.
- A background the character does not use. Magenta (#FF00FF) for the ghost, the pumpkin head and the mummy. Pure green (#00FF00) for the purple ones: the bat, the witch cat and the Pumpkin King (his cape is purple). The cleanup tool reads the background colour by itself.
- Or ask for a transparent background. If the picture then shows a grey and white checkerboard, that is a drawn fake: ask again for a flat colour.
- Plenty of empty space between the frames, so they never touch.

## Step A: design (paste, then swap in the character line and its background colour)

```
I'm making a 2D pixel art typing game for children aged 8-12. The attached image shows the style of an existing character (a bunny).

Design a new character in exactly this style for a friendly Halloween level: [CHARACTER LINE]

Style rules:
- 16-bit pixel art, side view, facing RIGHT, full body
- cute and funny, a little spooky but never scary: no blood, no sharp teeth, no angry red eyes
- about 48 pixels tall on a clear pixel grid, every pixel a sharp square
- a crisp, solid 1-pixel dark brown outline all round, the same thickness everywhere; hard edges, no anti-aliasing, no glow, no blur, no soft shadow
- about 12-16 colours, simple shading, no gradients
- plain flat solid [BACKGROUND] background, nothing else: no ground, no shadow, no text

Show one single character, large and centred.
```

## Step B: animation sheet (same chat, same background colour)

```
Great, keep this exact character. Now make its [ANIMATION]:
- [N] frames in ONE horizontal row, evenly spaced with wide empty gaps, the same size
- facing right, side view, same colours, same crisp outline and same size in every frame
- the bottom of every frame on the same line
- plain flat solid [BACKGROUND] background, no ground, no shadow, no numbers, no text
```

## The characters

Ghost (walks the road, about bunny size). Background: magenta (#FF00FF). Animation: "FLOAT loop", 6 frames: "it floats forward, bobbing up and down, the wavy bottom of the sheet flutters".
```
a small shy ghost made of a white sheet, round body with a wavy bottom, two big black oval eyes, pink cheeks, a tiny smile, little arms. Soft light-blue shading (solid, not see-through).
```

Bat (flies, also becomes a pet). Background: pure green (#00FF00). Animation: "FLY loop", 4 frames: "wings up, half, down, half".
```
a chubby little purple bat with big ears, big friendly eyes, two tiny fangs that look cute, round belly, small wings. It looks like it is smiling.
```

Witch cat (walks). Background: pure green (#00FF00). Animation: "WALK cycle", 6 frames, "like the bunny's run in the reference but calmer".
```
a black cat standing on two legs, wearing a purple witch hat with a yellow star and a tiny orange scarf, yellow eyes, a curly tail. Mischievous but sweet.
```

Pumpkin head (walks). Background: magenta (#FF00FF). Animation: "WALK cycle", 6 frames, "a waddling walk, the pumpkin head bobs".
```
a little creature with a carved jack-o'-lantern as its head (a happy carved face with a big grin, glowing yellow inside), a small green-brown vine body, leaf hands and two little feet.
```

Mummy (mini-boss, a bit taller than the bunny). Background: magenta (#FF00FF). Animation: "WALK cycle", 6 frames, "a clumsy stiff waddle, arms forward, one loose bandage end flapping".
```
a small clumsy mummy wrapped in cream bandages, one bandage end trailing behind, two big round eyes peeking out, a shy smile. Funny, like it is wrapped in toilet paper.
```

Pumpkin King (the boss, about twice the bunny's height). Background: pure green (#00FF00). Animation: "IDLE loop", 6 frames: "it bobs and sways, the cape moves, it grins and wiggles its crown".
```
a huge round orange pumpkin king with a carved happy face glowing yellow inside, a small golden crown, a purple cape with an orange lining, short stubby arms and legs, holding an empty candy basket. Grumpy-cute, like a big friendly toddler.
```

Decorations (one picture, no animation needed). Use this as Step A, then only ask for fixes:
```
Make a row of 5 separate Halloween decoration props in this exact pixel art style, each with a crisp 1-pixel dark outline, side view, standing on the same bottom line, evenly spaced with empty magenta between them: 1) a small jack-o'-lantern with a happy face, 2) a big jack-o'-lantern with a silly face, 3) two stacked pumpkins, 4) a little paper lantern hanging from a wooden post, 5) a cartoon tombstone with "BÚ" written on it. Friendly, warm glowing light, no scary faces. Plain flat solid pure green background (#00FF00), no ground, no text other than "BÚ".
```

If something comes out too scary, in the same chat: "Make it cuter and less scary: rounder, bigger eyes, a smile, softer colours."

## What to bring back

For each character the animation sheet (the design picture too if you like), named exactly `ghost_float.png`, `bat_fly.png`, `cat_walk.png`, `pumpkin_walk.png`, `mummy_walk.png`, `king_idle.png`, `decor.png` (the tool looks for these names). Even if only some of them work, bring those: until then the game uses stand-ins from your asset library.
