# New animals for Betűkaland: ChatGPT prompts

Ideas from 4.B: cheetah, panda, fire fox, cockroach, tiger, seahorse, polar bear.

## How it works

Every playable figure needs two animations, both facing right:

- idle: 4 frames, standing and breathing
- run: 6 frames, a running loop

The image models are good at keeping one character the same within one chat, but they still drift a little between frames (spots move, a stripe disappears, the size changes). So the plan is:

1. One new chat per animal. Attach `style_reference.png` to the first message (it is our bunny, enlarged).
2. Step A: get the character design right first. Ask for changes until you like it.
3. Step B and C: in the same chat, ask for the run and the idle sheets.
4. Save the images and bring them back here. I cut the frames, shrink them to real pixel size (about 45 px tall like the bunny), reduce the colours, fix small differences between frames and line up the feet. The coloured outfits (blue, gold, mint, night, pink) are made from the base colours automatically.

So don't worry if the pixels aren't perfectly square or one frame is a bit off. A clean design and a clear pose for each frame matter more.

Write the prompts in English: the image model follows English more closely.

## Step A: character design

Attach `style_reference.png`, then paste this and swap in the animal line from the list below:

```
I'm making a 2D pixel art typing game for children aged 8-12. The attached image shows the style of an existing character (a bunny), with an idle and a run animation.

Design a new playable character in exactly this style: [ANIMAL LINE]

Style rules:
- 16-bit pixel art, side view, facing RIGHT, full body
- same proportions as the bunny: big head, small body, about 45 pixels tall at real size
- warm, friendly, cute, not scary
- dark brown outline, about 12-15 colours, simple shading, no gradients, no anti-aliasing
- stands upright on two legs like the bunny (unless I say otherwise)
- plain flat solid magenta background (#FF00FF), nothing else in the picture: no ground, no shadow, no text

Show one single character, large and centred.
```

If something is off, answer in the same chat, for example:

- "Make the head bigger and the body smaller, like the bunny."
- "Simpler: fewer colours and thicker pixels."
- "Turn it to face right."
- "Remove the shadow and keep the background pure magenta."

## Step B: run animation

When the design is right, in the same chat:

```
Great, keep this exact character. Now make a sprite sheet of its RUN cycle:
- 6 frames in ONE horizontal row, evenly spaced, the same size
- facing right, side view, same colours, same outline, same size in every frame
- like the bunny's run in the reference: legs stretching forward and back, arms swinging, body bouncing slightly
- the feet of every frame on the same line
- plain flat solid magenta background (#FF00FF), no ground, no shadow, no numbers, no text
```

## Step C: idle animation

```
Same character again. Now its IDLE animation:
- 4 frames in ONE horizontal row, evenly spaced, the same size
- facing right, standing still, only small movement: breathing, a blink, the tail or ears moving a little
- same colours, outline and size as before, feet on the same line
- plain flat solid magenta background (#FF00FF), no ground, no shadow, no text
```

If a sheet comes out with the wrong number of frames or different sizes: "Exactly 6 frames in one row, all the same size, nothing else in the image."

## The animal lines

Paste one of these in place of `[ANIMAL LINE]`.

Cheetah:
```
a young cheetah. Golden yellow fur with small black spots, a cream belly, the black "tear lines" from the eyes down to the mouth, a long spotted tail with a black-and-white tip. Slim and sporty, looks fast.
```

Panda:
```
a small panda. White body, black ears, black eye patches, black arms and legs, round and chubby, a happy calm face. A tiny green bamboo leaf tucked behind one ear.
```

Fire fox:
```
a fox made of friendly fire magic. Orange and red fur, a big fluffy tail whose tip glows yellow like a flame, a cream chest and muzzle, bright eyes. It is an original fantasy fox, not based on any logo.
```

Cockroach:
```
a cute cartoon cockroach, standing upright on two of its legs, with four small arms. Shiny warm brown shell, two long curly antennae, big friendly eyes, a big smile. Funny and lovable, not disgusting.
```

Tiger:
```
a young tiger. Orange fur with bold black stripes, a white muzzle, chest and belly, white spots above the eyes, a striped tail. Strong and brave but friendly.
```

Seahorse (this one floats, so ask for a "swim" loop instead of a run, and change the run prompt: "a SWIM cycle: the body bobbing up and down, the back fin fluttering, the tail curling and uncurling"):
```
a cheerful seahorse that floats upright in the air. Teal and turquoise body with a yellow belly, a curled tail, a small back fin, a long snout, big eyes. No legs: it floats.
```

Polar bear:
```
a polar bear cub. Creamy white fur with light blue-grey shading (not pure white, so it shows on snow), a black nose, small round ears, chubby and soft. A red scarf around the neck.
```

## What to bring back

For each animal: the design picture, the run sheet and the idle sheet (3 images). Name them like `tiger_design.png`, `tiger_run.png`, `tiger_idle.png` and put them in this folder. Even if only some of the seven come out well, bring those: they can go into the game one by one.
