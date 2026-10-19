// English word bank (used when a profile's word language is English).
// Same rules as words_hu.js: filtered by unlocked keys at runtime.
window.BK_WORDS_EN = `
a as ask asks add adds all fall falls lad lads dad dads sad salad salads flask flasks alas lass glass
kale lake leaf deal seal sale safe self desk
egg eggs frog frogs dog dogs toy toys tree trees fish wish water tiger tigers apple apples pear pears
quiet quick queen quilt tower power tea tree street sweet sweater pie pies pig pigs rope ride ridge
hat hats hit sit fit kit kite kites ship shop shops top tops pot pots hop hope rose roses red green
pet pets the they this that there here where what who wet wire fire tire hot jet jets duck ducks goat
go good food foot hood wood word words world sport sports post teeth tooth thirst three four
yes you your yellow young yard cat cats cow cows box boxes fox foxes six seven nine ten bus buses car cars
van vans bike bikes cake cakes milk moon moons bank bench cheese chicken monkey zebra lemon melon
camera cookie cookies candy blue black brown big small funny happy busy sunny windy rainy snowy
can make bake take jump jumps run runs swim climb climbs read reads write draw draws sing sings
banana bananas pizza puppy puppies kitten kittens bunny bunnies rabbit rabbits button mitten
lasses fad fads ads plum grape grapes peach orange cherry berry kiwi bread toast butter honey pasta soup rice
carrot potato tomato onion pepper corn bean peas juice mouse hamster parrot turtle lizard snake snail bee ant
spider beetle butterfly ladybird worm hedgehog squirrel wolf bear deer owl crow robin pigeon goose hen rooster
horse pony donkey calf lamb sheep piglet lion elephant giraffe hippo gorilla crocodile camel kangaroo koala
panda penguin whale dolphin shark octopus crab jellyfish hand head ear eye nose mouth hair neck knee finger
toe back arm leg mother father mum grandma grandpa sister brother baby family aunt uncle cousin friend teacher
house home room kitchen window door gate garden fence roof stairs bed pillow chair table shelf lamp clock
phone book pencil pen paper ruler eraser glue scissors bag school class train tram scooter boat plane
helicopter rocket tractor truck forest field meadow hill mountain valley river sea island beach sand stone
rock cave sun star cloud rain snow wind storm rainbow fog ice spring summer autumn winter morning noon evening
night today tomorrow yesterday white grey purple pink tall short long fast slow brave kind clever strong weak
warm cold soft hard new old clean loud walk fly dance laugh cry sleep wake eat drink paint build play learn
count help look find give bring cook wash scarf glove coat shoe boot sock trousers skirt dress shirt jumper
umbrella flower tulip bush grass branch root mushroom acorn ball doll robot puzzle game swing slide team goal
`;

window.BK_SENTENCES_EN = [
  "a sad lad", "dad asks", "a lass falls", "all fall", "add a salad", "a flask falls",
  "the frog is quiet", "the tiger eats", "we see a tree", "the kite is up", "the dog sits",
  "the cat can jump.", "a big bus.", "my bike is blue.", "the monkey is funny.", "come in, cat.",
  "The cat can jump.", "Tom has a bike.", "Anna can swim.", "We like pizza.",
  "Is it sunny?", "I am 9!", "We have 3 cats.", "Look: a rainbow!", "\"Hi!\" said the fox.",
  "The little rabbit went out. In the forest it saw a fox.",
  "The fox said hello. They walked on together.",
];

window.BK_NOUNS_EN = `
apple cat dog ball bear baby bunny frog fish bird bee duck pig cow goat fox
cake pizza egg pear lemon melon cookie banana pencil book bag chair desk door lamp clock key cup
tree flower leaf star cloud boat train bus car bike kite hat sock shoe
`;

window.BK_STORIES_EN = [
  { id: 'morning', title: 'Morning', lines: ["it is morning and the sun is up.", "the boy gets up and washes his face.",
    "he eats bread and drinks milk.", "then he puts on his shoes.", "the bus comes to the corner.", "he runs to the bus, just in time."] },
  { id: 'park', title: 'The park', lines: ["we go to the park after school.", "my dog runs after a ball.", "a little bird sits in a tree.",
    "we sit on a bench and eat apples.", "the sun goes down, so we go home."] },
  { id: 'pancakes', title: 'Pancakes', lines: ["On Sunday we make pancakes.", "We need flour, eggs, milk and a little sugar.",
    "Dad mixes everything in a big bowl.", "I put jam on my pancake.", "The kitchen smells so good.", "Everyone wants one more."] },
  { id: 'birthday', title: 'Birthday', lines: ["Today Dan is 10 years old!", "There are 10 candles on the cake.",
    "Everyone sings: \"Happy birthday!\"", "Dan blows out the candles.", "\"What did you wish for?\" asks Mia.", "\"It is a secret!\" laughs Dan."] },
  { id: 'rabbit', title: 'Rabbit and fox', lines: ["The little rabbit went into the forest.", "On the path it met a fox.", "\"Hi! Where are you going?\" asked the fox.",
   "\"To the river, to drink,\" said the rabbit.", "They walked on together and laughed a lot."] },
  { id: 'rain', title: 'A rainy day', lines: ["It was raining in the morning.", "Peter put on his yellow raincoat.", "He jumped in all the puddles.",
   "At noon the sun came out.", "A rainbow appeared in the sky!"] },
  { id: 'drawing', title: 'Anna draws', lines: ["Anna is 9 and she loves to draw.", "Today she drew a dragon in her book.", "The dragon was green and it smiled.",
   "In the evening she showed it to her mum.", "\"Beautiful!\" said her mum."] },
  // translations of the Hungarian stories (v0.12.1); new ones always go at the end (save codes count them in order)
  { id: 'garden', title: 'In the garden', lines: ["it is warm outside.", "a little dog runs in the garden.", "the dog runs after a butterfly.",
   "the butterfly is up on the top of the tree.", "the dog lies down next to the tree.", "in the evening the child pets it."] },
  { id: 'market', title: 'At the market', lines: ["it is saturday morning.", "granny goes to the market.", "she buys cherries, strawberries and cheese.",
   "her basket gets full.", "in the evening she eats cherry pie.", "it is very good."] },
  { id: 'evening', title: 'Evening', lines: ["it is evening.", "the stars are out.", "mum tells a story.",
   "the child listens, then falls asleep.", "the cat is asleep next to him too.", "it was a nice story."] },
  { id: 'school', title: 'At school', lines: ["School starts at eight in the morning.", "The first lesson is maths.", "Anna goes to the board and solves a problem.",
   "At break the children play in the yard.", "There is tomato soup for lunch.", "In the afternoon they draw and sing."] },
  { id: 'tidy', title: 'Tidying up', lines: ["My room is very messy.", "I put the toys back in the box.", "I put the books on the shelf.",
   "I fold my clothes.", "Mum looks in and smiles.", "Now everything is in its place."] },
  { id: 'shop', title: 'At the shop', lines: ["Mum wrote a list: 2 loaves of bread, 1 milk, 6 eggs.", "At the shop we take a basket.", "\"Where is the milk?\" I ask.",
   "The shop assistant helps: \"In the fridge, on the left!\"", "At the till we pay 2400 forints.", "On the way home I carry the bread."] },
  { id: 'trip', title: 'A trip', lines: ["The bus leaves at 7:30 in the morning.", "In the backpack there is water, a sandwich and an apple.", "In the forest we see 3 deer!",
   "\"Quiet!\" whispers our teacher.", "At noon we rest in a clearing.", "In the evening we get home tired but happy."] },
  { id: 'hamster', title: 'Dot the hamster', lines: ["I have a hamster, his name is Dot.", "Dot is 2 years old and very curious.", "In the morning he gets fresh water and seeds.",
   "In the afternoon I take him out of his cage.", "I ask him: \"Are you hungry?\"", "Dot sniffs, then eats a piece of carrot."] },
  { id: 'boat', title: 'The little boat', lines: ["In the harbour 3 boats were rocking.", "The smallest boat was red.", "A seagull sat on its mast.",
   "When the wind started to blow, the boat sailed out.", "The seagull flew with it all the way to the island."] },
  { id: 'cloudcastle', title: 'The Cloud Castle', lines: ["The Cloud Castle stands above the clouds.", "The Cloud Dragon lives here.", "Whoever gets up here can already type well.",
   "The dragon asks every guest: \"Who are you?\"", "And you proudly type your name!"] },
];
