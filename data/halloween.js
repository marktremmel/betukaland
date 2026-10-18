/*
 * Halloween Night: themed words, sentences and the little story shown before
 * each stage. Only what fits the keys the child already has is used; the
 * rest of the typing comes from the normal word bank, so the learning stays
 * the same. Friendly spooky only: nobody is hurt, nobody is scared away.
 */
BK.HALLOWEEN_WORDS = {
  hu: ['tök', 'tökfej', 'szellem', 'denevér', 'boszi', 'seprű', 'cukor', 'cukorka', 'cica', 'macska', 'pók', 'háló', 'hold',
    'éjjel', 'éjfél', 'lámpás', 'kalap', 'varázs', 'köd', 'bagoly', 'kastély', 'múmia', 'gyertya', 'buli', 'jelmez', 'maszk',
    'bú', 'huhu', 'jaj', 'titok', 'kincs', 'kert', 'csillag', 'levél', 'dió', 'alma', 'sál', 'palást', 'korona', 'kosár',
    'tánc', 'mese', 'sötét', 'fény', 'avar', 'gesztenye', 'üst', 'sapka', 'nevet', 'mosoly'],
  en: ['pumpkin', 'ghost', 'bat', 'witch', 'broom', 'candy', 'cat', 'spider', 'web', 'moon', 'night', 'dark', 'lantern',
    'hat', 'magic', 'fog', 'owl', 'castle', 'mummy', 'candle', 'party', 'mask', 'boo', 'treat', 'trick', 'secret', 'star',
    'leaf', 'apple', 'scarf', 'cape', 'crown', 'sweet', 'basket', 'dance', 'smile', 'glow', 'flask', 'salad', 'jam', 'sock'],
};

// Sentences for the mini-boss and the Pumpkin King. Lower-case versions let
// children who have not learnt Shift yet type them too.
BK.HALLOWEEN_SENTENCES = {
  hu: ['A tök mosolyog.', 'Szól a bagoly: huhu!', 'A szellem csak bújócskázik.', 'A denevér fejjel lefelé alszik.',
    'A cica kalapja lila.', 'Ma éjjel jelmezes buli van.', 'A Tökkirály kosara üres.', 'Adj egy cukrot, és táncolunk!',
    'A hold kerek és fényes.', 'A köd mögött lámpás világít.', 'Bú! Csak vicceltem!', 'A múmia elvesztette a papírját.',
    'a tök mosolyog', 'szól a bagoly', 'a szellem bújócskázik', 'a cica kalapja lila', 'ma éjjel buli van',
    'a kosár üres', 'a hold kerek', 'a köd mögött lámpás ég', 'adj egy cukrot', 'a tökök világítanak',
    'a pók hálót sző', 'a seprű repül', 'a boszi nevet', 'ég a gyertya', 'jön a jelmezes buli'],
  en: ['The pumpkin is smiling.', 'The owl says hoo hoo.', 'The ghost only wants to play.', 'A bat sleeps upside down.',
    'The cat has a purple hat.', 'We have a costume party tonight.', 'The Pumpkin King has an empty basket.',
    'Give me a sweet and we can dance!', 'The moon is big and round.', 'Boo! Just kidding!', 'The mummy lost its paper.',
    'the pumpkin is smiling', 'the owl says hoo', 'the ghost wants to play', 'the cat has a hat', 'we have a party tonight',
    'the basket is empty', 'the moon is round', 'a lantern glows in the fog', 'give me a sweet', 'the pumpkins glow',
    'the spider makes a web', 'the broom can fly', 'the witch is laughing', 'the candle is lit'],
};

// The story: one short text before each stage, and one when the King smiles.
BK.HALLOWEEN_STORY = {
  hu: {
    title: 'Halloween éjszaka',
    intro: 'Halloween éjjelén kialudtak a tökök a Tökkirály kertjében, és senki sem ment el a bulijára. Most szomorú és morcos.',
    stages: [
      'A Tökös ösvényen félénk szellemek bújnak. Írd be a szavaikat, és barátok lesztek!',
      'A Ködös erdőben denevérek röpködnek, és egy boszicica keresi a kalapját.',
      'A Denevérhídon egy ügyetlen múmia áll. Segíts neki kibogozni a mondatát!',
      'Itt a Tökkirály kertje. Üres a kosara, és senki sem jött el. Írd be a mondatait, hátha mosolyt csalsz az arcára!',
    ],
    end: 'A Tökkirály nevet, a tökök újra világítanak, és mindenki kap cukrot. Ez lett a legjobb buli!',
  },
  en: {
    title: 'Halloween Night',
    intro: 'On Halloween night the pumpkins in the Pumpkin King\'s garden went out, and nobody came to his party. Now he is sad and grumpy.',
    stages: [
      'Shy ghosts hide on the Pumpkin Path. Type their words and you will be friends!',
      'Bats flutter in the Misty Woods, and a witch cat is looking for her hat.',
      'A clumsy mummy stands on the Bat Bridge. Help him untangle his sentence!',
      'This is the Pumpkin King\'s garden. His basket is empty and nobody came. Type his sentences and maybe he will smile!',
    ],
    end: 'The Pumpkin King laughs, the pumpkins glow again, and everyone gets candy. Best party ever!',
  },
};
