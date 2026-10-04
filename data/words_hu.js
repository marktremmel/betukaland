// Hungarian word bank (child-friendly, grades 3-6). Correct spelling only:
// never strip accents to make a word "fit" an early region. Words with
// á í ó ö ő ú ü ű simply appear once Region 5 unlocks those keys.
//
// The game keeps only words typeable with the child's unlocked keys
// (src/wordbank.js). Add words freely, separated by spaces or new lines.
// Run "python3 tools/check_words.py" to see how many words each region gets.
window.BK_WORDS_HU = `
kés kék fél dél fék lék séf kél lé sas dal fal falak falka kakas laska dada sakk lakk jaj adj add akad fakad kas alj
kalap lap lepke kert kertek kerti tej tea tigris tigrisek pipa papa ruha haj fej hegy hegyek hegyi este reggel
kifli kiflik liget lift dupla repked fut ugrik ugrat tart juh juhok jut sereg tojik hold toll tolla kis kiskert
ugat pipi tipeg topog totyog fagyi fagy hideg huhog hely helyes jegy keret kerek kettes lila pici picike piros
piroska perec repce retek torta tortaszelet tejes tél ujj ujjak utas utca uszoda eper sapka sajt sajtos szirup
sziget szita erdei pizza keksz liszt leves posta pont park patak palack paprika pingvin pocok polc puszi robot
tanul tanulok tavasz tegnap telefon tenger torok kerek kettő
vacsora vaj vers villamos vonat vonatok vad veder vihar villa vitorla zebra zene zokni zsemle kenyér kecske
kemence kocka labda marha meggy mosoly muzsika orr olvas okos palacsinta macska maci majom malac malacok mama
mese messze meleg nyuszi nyuszik nyak nyit nyolc nyomoz cica cukor cukros cirkusz citrom csiga csillag csoki
csokor bab baba bagoly bambusz barack bicikli bika bokor bors bodza busz bukfenc fecske hal halak harang has
homok dob dobol domb dombok dorombol duda dolgozik gesztenye gyertya gyalog gyerek gyerekek gyors gyorsan gyufa
gyurma gomba gomb gombok medve mozi nap napos narancs pad paradicsom rajz rajzol uborka udvar uzsonna szeder
szilva szem szoba szekrény szép szél ceruza iskola tanterem kutya kutyus szoknya ing pulcsi delfin teve
krokodil panda koala kenguru rakéta napfény csipog brummog zizeg alszik eszik iszik nevet mosolyog fest gurul
siet keres hall kap vesz visz hoz fog tud kér mesél énekel fekete fehér nagy kicsi puha kemény édes finom
tiszta boldog kedves vicces szuper csinos ablak alma almafa citromfa nyuszifül meleg hideg
ágy állat áfonya ásít éjjel éjszaka ének épít érett érme íj ír író ízes óra óriás óvoda ősz őz őzike öt öröm
öltözik öböl ölel úszik út újság ügyes üveg ül üres ünnep űr űrhajó fű tű tűz dió dínó fenyő fészek fiók folyó
forró fúj füzet fül gólya gyöngy gyümölcs hattyú hajó hód holló hópehely hóember hűtő jég játék játszik kakaó
kalács kanál karácsony kastély kéz kígyó kosár kő könyv kör körte láb láda lámpa lány lapát levél ló málna mackó
méh méz mókus nyár olló ország oroszlán pálma pék pillangó pók póni répa rét rigó róka rózsa sál sárga sátor séta
sün sütemény tál tánc táska teknős tó tojás tök tulipán tükör vár vasút vidám virág víz zászló zöld cipő erdő
felhő eső kesztyű szőlő szőnyeg szúnyog szürke banán zsiráf papagáj madár bogár bárány mézes kút sétál táncol
repül talál lát segít nyávog lassú jön kabát nadrág radír papír osztály bolygó szivárvány
`;

// Sentences. Lowercase ones are used before capitals are taught.
// A sentence is used only when every character in it is unlocked.
window.BK_SENTENCES_HU = [
  // region 1 (a s d f j k l é)
  "a kék sas fél", "a kakas fél", "a falka akad", "a sas kél", "kék dal", "a kés kék",
  "jaj a sas", "a lakk kék", "fél a falka", "a kakas dala", "a sas dala", "a séf fél",
  "dada fél", "a kas kék",
  // region 2 (+ g h q w e r t z u i o p)
  "a tigris fut", "a lepke repked", "piros a kert", "ez a kert", "a kis tigris ugrik",
  "a hegy fehér", "itt a kifli", "ott a hegy", "papa sajtot eszik", "a pipi tipeg",
  "a kakas kukorékol", "a juh legel", "este hideg lesz", "a tej fehér", "a kert szép",
  "a sas repked", "a fagyi hideg", "itt a perec", "a tigris okos", "a piros sapka szép",
  // region 3 (+ y x c v b n m , . -)
  "a cica fut.", "a nyuszi ugrik.", "a macska alszik.", "van egy bicikli.", "a vonat megy.",
  "a cica, a kutya, a nyuszi.", "a busz megy.", "a mama kenyeret vesz.", "a bagoly huhog.",
  "a csiga lassan megy.", "a zebra fekete-fehér.", "kicsi a cica.", "a macska tejet iszik.",
  "nem fut, csak megy.", "ma meleg van.", "a kutya ugat.", "kicsi, de gyors.", "a majom vicces.",
  "a medve nagy, a cica kicsi.", "van tej, van kenyér.",
  // region 4 (capitals)
  "A cica fut.", "Peti biciklizik.", "Kati kenyeret vesz.", "Ma szerda van.", "Budapest nagy.",
  "A Duna nagy.", "Bence fut.", "Ez egy piros kifli.", "Anna rajzol.", "Matyi focizik.",
  "Zsuzsi zenét hallgat.",
  // region 5 (accents)
  "A róka okos.", "Ősszel hullik a levél.", "Az őzike gyors.", "Kék az ég.", "A tűz meleg.",
  "Ügyes vagy!", "Szép a virág.", "Ülj le a padra.", "Édes a málna.", "A hóember fehér.",
  "Az óriás nagy.", "A sün szúrós.", "Fúj a szél.", "Az üveg tiszta.", "Hű, de szép!",
  // region 6 (numbers and punctuation)
  "Van 3 almám.", "Hány éves vagy?", "Kilenc éves vagyok!", "Most 2 óra van.", "Hol a labda?",
  "Hurrá, nyertünk!", "Figyelj: itt a kincs!", "A 12 cica (mind kicsi) alszik.",
  "Mennyi 5 meg 4? 9!", "Gyere ide, kérlek!", "\"Szia!\" - mondta a róka.",
  // region 7 (short stories)
  "A kis nyuszi elindult. Az erdőben egy rókát látott.",
  "A róka köszönt: \"Szia!\" A nyuszi visszaköszönt.",
  "Együtt mentek tovább. A patak partján megálltak.",
  "Ittak a tiszta vízből. Aztán egy fa alatt pihentek.",
  "Este hazaértek. A nyuszi boldog volt.",
];

// Nouns only: used in number phrases ("3 cica", "Hány alma? 5!") from Region 6.
window.BK_NOUNS_HU = `
alma cica kutya labda maci baba nyuszi béka gomba madár hal csiga méh pók egér medve majom malac zebra teve
kifli zsemle torta keksz pizza sajt tojás körte szilva banán dió eper meggy uborka répa paprika
ceruza füzet könyv táska radír szék pad asztal ablak ajtó lámpa óra kulcs kanál bögre
fa virág levél bokor kő csillag felhő hajó vonat busz autó bicikli rakéta sapka kesztyű zokni cipő
`;

// Stories: the storybook in Gyakorlás (practice) and Region 7. Each story is
// typed sentence by sentence. A story appears in the storybook once the child
// has every key it needs, so the lowercase ones without á ó ö ő ú ü ű í
// come early (after Region 3) and the rest from Region 5 or 6.
window.BK_STORIES_HU = [
  // after Region 3 (lowercase, é, comma and full stop only)
  { id: 'reggel', title: 'Reggel', lines: ["reggel van, a gyerek felkel.", "kezet mos, fogat mos.", "reggelire kifli van, vaj, sajt.",
    "a mama tejet tesz az asztalra.", "a gyerek eszik, majd elindul.", "a busz itt van, mehet."] },
  { id: 'kert', title: 'A kertben', lines: ["kint meleg van.", "a kertben egy kis kutya fut.", "a kutya kergeti a lepkét.",
    "a lepke fent van a fa tetején.", "a kutya lefekszik a fa mellett.", "este a gyerek megsimogatja."] },
  { id: 'piac', title: 'Piacon', lines: ["szombat reggel van.", "a nagyi elmegy a piacra.", "vesz meggyet, epret, sajtot.",
    "a kosara tele lesz.", "este meggyes lepényt eszik.", "nagyon finom."] },
  { id: 'este', title: 'Este', lines: ["este van.", "a csillagok kint vannak.", "a mama mesét mesél.",
    "a gyerek figyel, majd elalszik.", "a cica is alszik mellette.", "szép mese volt."] },
  // after Region 5 (capitals and accents)
  { id: 'iskola', title: 'Az iskolában', lines: ["Reggel nyolckor kezdődik a tanítás.", "Az első óra matek.",
    "Anna a táblához megy, és megold egy feladatot.", "A szünetben a gyerekek az udvaron játszanak.",
    "Ebédre paradicsomleves van.", "Délután rajzolnak és énekelnek."] },
  { id: 'palacsinta', title: 'Palacsinta', lines: ["Vasárnap palacsintát sütünk.", "Kell hozzá liszt, tojás, tej és egy kis cukor.",
    "Apa kikeveri a tésztát.", "Én kenem meg lekvárral.", "A konyhában finom illat van.", "Mindenki kér még egyet."] },
  { id: 'park', title: 'A parkban', lines: ["Szombat délután kimegyünk a parkba.", "Bence biciklizik, Lili rollerezik.",
    "A tó partján kacsák úsznak.", "Kenyérmorzsát dobunk nekik.", "Hazafelé veszünk egy fagyit.", "Én csokisat kérek, Lili epreset."] },
  { id: 'rend', title: 'Rendrakás', lines: ["A szobám nagyon rendetlen.", "A játékokat visszateszem a dobozba.",
    "A könyveket felrakom a polcra.", "A ruháimat összehajtom.", "Anya benéz, és mosolyog.", "Most már minden a helyén van."] },
  // after Region 6 (numbers, ? ! : and quotes)
  { id: 'szulinap', title: 'Születésnap', lines: ["Ma van Dani születésnapja: 10 éves lett!", "A tortán 10 gyertya ég.",
    "Mindenki énekel: \"Boldog születésnapot!\"", "Dani elfújja a gyertyákat.", "\"Mit kívántál?\" - kérdezi Mia.", "\"Titok!\" - nevet Dani."] },
  { id: 'bolt', title: 'A boltban', lines: ["Anya listát írt: 2 kenyér, 1 tej, 6 tojás.", "A boltban kosarat veszünk.",
    "\"Hol van a tej?\" - kérdezem.", "Az eladó segít: \"A hűtőben, balra!\"", "A pénztárnál 2400 forintot fizetünk.", "Hazafelé én viszem a kenyeret."] },
  { id: 'kirandulas', title: 'Kirándulás', lines: ["Reggel 7:30-kor indul a busz.", "A hátizsákban van víz, szendvics és alma.",
    "Az erdőben 3 őzet látunk!", "\"Csendben!\" - suttogja a tanító néni.", "Délben egy tisztáson pihenünk.", "Este fáradtan, de boldogan érünk haza."] },
  { id: 'horcsog', title: 'Pötty, a hörcsög', lines: ["Van egy hörcsögöm, Pötty a neve.", "Pötty 2 éves, és nagyon kíváncsi.",
    "Reggel friss vizet és magot kap.", "Délután kiveszem a ketrecből.", "Megkérdezem: \"Éhes vagy?\"", "Pötty szimatol, aztán eszik egy darab répát."] },
  { id: 'nyuszi', title: 'Nyuszi és róka', lines: ["A kis nyuszi elindult az erdőbe.", "Az ösvényen egy rókával találkozott.", "\"Szia! Hová mész?\" - kérdezte a róka.",
   "\"A patakhoz, vizet inni.\" - felelte a nyuszi.", "Együtt mentek tovább, és sokat nevettek."] },
  { id: 'eso', title: 'Esős nap', lines: ["Reggel esett az eső.", "Peti felvette a sárga esőkabátját.", "A pocsolyákban vidáman ugrált.",
   "Délre kisütött a nap.", "Az égen szivárvány jelent meg!"] },
  { id: 'rajz', title: 'Anna rajza', lines: ["Anna 9 éves, és nagyon szeret rajzolni.", "Ma egy sárkányt rajzolt a füzetébe.", "A sárkány zöld volt, és mosolygott.",
   "Este megmutatta a rajzot a mamájának.", "\"Gyönyörű!\" - mondta a mama."] },
  { id: 'hajo', title: 'A kis hajó', lines: ["A kikötőben 3 hajó ringatózott.", "A legkisebb hajó piros volt.", "Egy sirály ült az árbocán.",
   "Amikor fújni kezdett a szél, a hajó kifutott.", "A sirály vele repült egészen a szigetig."] },
  { id: 'felhovar', title: 'A Felhővár', lines: ["A Felhővár a felhők fölött áll.", "Itt lakik a Felhősárkány.", "Aki ide feljut, az már ügyesen gépel.",
   "A sárkány minden vendéget megkérdez: \"Ki vagy?\"", "Te pedig büszkén beírod a neved!"] },
];

// Extra short sentences for the sentence practice in the early regions
window.BK_SENTENCES_HU = window.BK_SENTENCES_HU.concat([
  "a sas kék", "dada fél a sastól", "jaj, a kés", "a kakas kél", "kék a kas",
  "a tigris piros", "itt a tej", "ez egy kert", "a kert szép", "a papa fut", "a juh fehér", "a teke gurul", "itt a perec",
  "a kifli friss", "a lepke repked", "ez a sapka piros", "a tigris eszik", "a kert tele lepkével",
  "a busz megy.", "van egy cica.", "a kutya fut.", "a medve nagy.", "a nyuszi kicsi.", "ma meleg van.", "a cica alszik.",
  "a zebra fut.", "kicsi a macska.", "a mama mesél.", "a vonat megy, a busz megy.", "van tej, van kenyér.",
]);
