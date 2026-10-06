/*
 * Interface language: Hungarian or English.
 *
 * The interface language (menus, buttons, tips) is separate from the word
 * language (what the child types, chosen per profile). A foreign student can
 * read English menus and still type Hungarian words, or the other way round.
 *
 * BK.T is the active string table (src/strings_hu.js, src/strings_en.js).
 * BK.L('magyar', 'English') picks inline text. Names inside BK.REGIONS,
 * BK.OUTFITS, BK.PETS, BK.ITEMS, BK.HEROES and BK.CREATURE_NAMES switch by
 * themselves: the English versions are below.
 */
BK.STR = {};
BK.uiLang = 'hu';
Object.defineProperty(BK, 'T', { get: function () { return BK.STR[BK.uiLang] || BK.STR.hu; } });

BK.L = function (hu, en) { return BK.uiLang === 'en' ? en : hu; };

BK.setUiLang = function (lang) {
  BK.uiLang = lang === 'en' ? 'en' : 'hu';
  if (typeof document !== 'undefined') document.documentElement.lang = BK.uiLang;
};

// obj[field] reads the Hungarian or the English value, whichever is active
BK.i18nField = function (obj, field, en) {
  if (en === undefined) return;
  var hu = obj[field];
  Object.defineProperty(obj, field, { get: function () { return BK.uiLang === 'en' ? en : hu; }, enumerable: true, configurable: true });
};

(function () {
  var REG = {
    1: ['Sunny Meadow', 'Frog Knight', 'Here comes the Frog Knight! Type his sentences!', 'You tamed the Frog Knight!'],
    2: ['Sandy Beach', 'Scruffy Gull', 'The Scruffy Gull has landed!', 'The Scruffy Gull flew off to its friends!'],
    3: ['Shell Bay', 'Storm Bird', 'The Storm Bird is here!', 'The storm is over!'],
    4: ['Mountain Path', 'Little Dragon', 'A Little Dragon on the mountain top!', 'The Little Dragon flew home!'],
    5: ['Red Canyon', 'Sun Bird', 'The Sun Bird appears!', 'The Sun Bird has calmed down!'],
    6: ['Twilight Wood', 'Night Dragon', 'The Night Dragon comes out!', 'The Night Dragon fell asleep!'],
    7: ['Cloud Castle', 'Cloud Dragon', 'The guard of the Cloud Castle: the Cloud Dragon!', 'You are the hero of the Cloud Castle!'],
  };
  BK.REGIONS.forEach(function (r) {
    var e = REG[r.id]; if (!e) return;
    BK.i18nField(r, 'name', e[0]); BK.i18nField(r, 'bossName', e[1]);
    BK.i18nField(r, 'bossIntro', e[2]); BK.i18nField(r, 'bossOutro', e[3]);
  });
  var names = function (list, map) { list.forEach(function (o) { BK.i18nField(o, 'name', map[o.id]); }); };
  names(BK.OUTFITS, { base: 'Classic', blue: 'Sky blue', mint: 'Mint', pink: 'Pink', night: 'Night', gold: 'Gold' });
  names(BK.PETS, { crabkid: 'Little Crab', sandbug: 'Sand Bug', gull: 'Seagull' });
  names(BK.HEROES, { bunny: 'Bunny', berie: 'Berie', frog: 'Frog', mush: 'Mushroom', crab: 'Crab', gull: 'Seagull' });
  names(BK.ITEMS, {
    apple: 'apple', cherry: 'cherry', strawberry: 'strawberry', banana: 'banana', watermelon: 'watermelon',
    grapes: 'grapes', pear: 'pear', carrot: 'carrot', orange: 'orange', mushroom: 'mushroom', cheese: 'cheese',
    egg: 'egg', croissant: 'croissant', cookie: 'cookie', donut: 'donut', cupcake: 'cupcake', lollipop: 'lollipop',
    icecream: 'ice cream', cake: 'cake', macaron: 'macaron', candycane: 'candy cane', pizza: 'pizza',
  });
  var CR = { toad: 'Toad', shell: 'Shell King', slime: 'Slime', bigbird: 'Giant Bird', octopus: 'Octopus' };
  Object.keys(CR).forEach(function (k) { BK.i18nField(BK.CREATURE_NAMES, k, CR[k]); });
  var FN_HU = BK.FINGER_NAMES;
  var FN_EN = ['left little finger', 'left ring finger', 'left middle finger', 'left index finger',
    'right index finger', 'right middle finger', 'right ring finger', 'right little finger', 'thumb'];
  Object.defineProperty(BK, 'FINGER_NAMES', { get: function () { return BK.uiLang === 'en' ? FN_EN : FN_HU; } });
})();
