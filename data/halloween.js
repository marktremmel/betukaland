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

// The Pumpkin King's lines in story order: grumpy at first, then he softens.
// The game keeps the ones that fit the child's keys (lower-case ones for
// beginners) and uses them in this order for the boss fight.
BK.HALLOWEEN_KING = {
  hu: ['ki van itt a kertben', 'Ki jár a kertemben?', 'ez az én kertem', 'Ez az én kertem, menjetek haza!',
    'senki sem szeret', 'Senki sem jön el a bulimra.', 'hol van a kosaram', 'Hol van a cukorkás kosaram?',
    'mi ez a fény', 'Mi ez a fény a ködben?', 'ti mind ide jöttetek?', 'Ti mind miattam jöttetek?',
    'lehet hogy mégis van buli', 'Lehet, hogy mégis lesz buli?', 'Nem is vagytok ijesztők.',
    'kell egy kis zene', 'hozzatok cukrot', 'Hozzatok cukrot és zenét!', 'legyen buli', 'Jó, legyen buli!'],
  en: ['who is in my garden', 'Who is in my garden?', 'this is my garden', 'This is my garden, go home!',
    'nobody likes me', 'Nobody comes to my party.', 'where is my basket', 'Where is my candy basket?',
    'what is that light', 'What is that light in the fog?', 'you all came here', 'Did you all come for me?',
    'maybe there is a party', 'Maybe there will be a party?', 'You are not scary at all.',
    'we need some music', 'bring candy', 'Bring candy and music!', 'let us party', 'Fine, let us party!'],
};

// The story: the page text, a text before each stage, one after each of the
// first three, and the ending when the King smiles.
BK.HALLOWEEN_STORY = {
  hu: {
    title: 'Halloween éjszaka',
    intro: 'Kialudtak a lámpások, és a Tökkirály azt hiszi, senki sem jön el a bulijára. Gyűjtsd össze útközben a vendégeket, és vidd el őket hozzá!',
    stages: [
      'A Tökös ösvényen félénk szellemek bújnak a tökök mögött. Senki sem hívta meg őket a bulira. Írd be a szavaikat, és velünk tartanak!',
      'A Ködös erdőben elveszett a boszicica kalapja, és a denevérek sem találják az utat. Gépeld be a szavaikat, és a lámpások fénye utat mutat nekik.',
      'A Denevérhídon egy ügyetlen múmia áll: összegabalyodtak a mondatai (és a pólyája is). Segíts neki kibogozni őket, hogy átjuthassatok!',
      'Itt a Tökkirály kertje. A király morcos, és furcsa jeleket dobál! Kapd el őket: írd be a jelet, mielőtt odaér. Aztán írd be a mondatait is!',
    ],
    after: [
      'A szellemek előbújtak, és kíváncsian jönnek utánad. Két lámpás újra világít!',
      'Megvan a kalap! A boszicica dorombol, a denevérek pedig vidáman repülnek előre.',
      'A múmia kibogozta magát, és most ő is jön a bulira. Már látszik a Tökkirály kertje!',
    ],
    end: 'A Tökkirály meglátja a sok vendéget: szellemeket, denevéreket, a boszicicát és a múmiát. Elneveti magát, és minden lámpás egyszerre kigyullad. Kiderül, hogy nem volt ő gonosz, csak magányos. Előkerül a cukorkás kosár, és kezdődik a legjobb buli, amit a kert valaha látott. Köszönjük, hogy segítettél!',
  },
  en: {
    title: 'Halloween Night',
    intro: 'The lanterns went out, and the Pumpkin King thinks nobody will come to his party. Gather the guests on your way and bring them to him!',
    stages: [
      'Shy ghosts hide behind the pumpkins on the Pumpkin Path. Nobody invited them to the party. Type their words and they will come along!',
      'In the Misty Woods the witch cat has lost her hat, and the bats cannot find the way. Type their words and the lanterns will light their path.',
      'A clumsy mummy stands on the Bat Bridge: his sentences got tangled (and so did his bandages). Help him untangle them so you can cross!',
      'This is the Pumpkin King\'s garden. He is grumpy and throws strange marks! Catch them: type the mark before it reaches you. Then type his sentences too!',
    ],
    after: [
      'The ghosts came out and follow you curiously. Two lanterns glow again!',
      'The hat is found! The witch cat purrs, and the bats fly happily ahead.',
      'The mummy is untangled and comes to the party too. You can already see the Pumpkin King\'s garden!',
    ],
    end: 'The Pumpkin King sees all the guests: ghosts, bats, the witch cat and the mummy. He bursts out laughing, and every lantern lights up at once. He was never mean, only lonely. Out comes the candy basket, and the best party the garden has ever seen begins. Thank you for helping!',
  },
};
