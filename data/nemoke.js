/*
 * NEM OKÉ: a five-chapter story about bullying in the Forest School, for the school's part in the
 * NEM OKÉ anti-bullying programme (switched on in the Teacher screen, like Halloween Night).
 * Told by Karou; the typing in between uses kind words and sentences (only those that fit the
 * child's keys, the rest comes from the normal word bank).
 * Content follows current guidance for 8-12 year olds: what bullying is (on purpose, again and
 * again, against someone who cannot easily defend themselves), the audience matters, four ways
 * to stand up (say something, distract, get help, check in afterwards; safety first; asking for
 * help is not telling tales), online steps (do not forward, screenshot, block, report, tell an
 * adult), and repair: the behaviour can change, nobody is labelled. Name-calling, leaving out,
 * a rumour and an online picture; no physical violence.
 * Sources and notes for teachers: TEACHER_NOTES.md (NEM OKÉ).
 */
BK.NEMOKE_WORDS = {
  hu: ['kedves', 'barát', 'barátság', 'segít', 'segítség', 'figyel', 'köszönöm', 'bocsánat', 'együtt', 'szia', 'mosoly',
    'csapat', 'társ', 'bátor', 'bátorság', 'kiáll', 'meghallgat', 'megvéd', 'odafigyel', 'közösség', 'rajz', 'játék',
    'béke', 'jóság', 'tisztelet', 'elfogad', 'megért', 'szívesen', 'igaz', 'szólok', 'velünk', 'mellém', 'gyere',
    'kérdez', 'érzés', 'szív', 'kéz', 'hang', 'osztály', 'iskola', 'erdő', 'süni', 'szarka', 'labda', 'pad', 'kréta',
    'ebéd', 'szünet', 'udvar', 'kép', 'fal', 'szabály', 'jó', 'jól', 'nem', 'oké', 'stop', 'elég', 'jaj', 'hé'],
  en: ['kind', 'friend', 'friendship', 'help', 'listen', 'thanks', 'sorry', 'together', 'hello', 'smile', 'team', 'brave',
    'courage', 'stand', 'protect', 'notice', 'care', 'class', 'school', 'forest', 'drawing', 'game', 'peace', 'respect',
    'welcome', 'true', 'join', 'share', 'feel', 'heart', 'hand', 'voice', 'ball', 'bench', 'chalk', 'lunch', 'break',
    'yard', 'picture', 'wall', 'rule', 'good', 'fine', 'not', 'okay', 'stop', 'enough', 'hey', 'hedgehog', 'magpie'],
};

// typed in the levels: lower-case and only . , - so they fit as early as possible
BK.NEMOKE_SENTENCES = {
  hu: ['jó vagy úgy, ahogy vagy.', 'nem nevetünk másokon.', 'szólok, ha baj van.', 'a segítségkérés nem árulkodás.',
    'együtt erősebbek vagyunk.', 'mindenki játszhat velünk.', 'kérdezd meg, hogy jól van-e.', 'a kedvesség ragadós.',
    'nem küldöm tovább.', 'figyelek a többiekre.', 'itt mindenki számít.', 'bocsánatot kérek.', 'ülj ide mellém.',
    'rajzoljunk együtt.', 'elmondom egy felnőttnek.', 'ez nem oké.', 'gyere, játssz velünk.', 'nem vagy egyedül.',
    'a csúfolás nem vicces.', 'mindenkinek van helye.', 'kiállok a társamért.', 'megkérdezem, mi a baj.'],
  en: ['you are fine just as you are.', 'we do not laugh at others.', 'i will speak up if something is wrong.',
    'asking for help is not telling tales.', 'we are stronger together.', 'everyone can play with us.',
    'ask if they are okay.', 'kindness is catching.', 'i will not send it on.', 'i look out for the others.',
    'everyone matters here.', 'i am sorry.', 'come and sit with me.', 'let us draw together.', 'i will tell an adult.',
    'this is not okay.', 'come and play with us.', 'you are not alone.', 'teasing is not funny.', 'there is room for everyone.',
    'i stand up for my classmate.', 'i ask what is wrong.'],
};

BK.NEMOKE_STORY = {
  hu: {
    title: 'NEM OKÉ: Kiállók az Erdei Iskolában',
    intro: 'Az Erdei Iskolába új diák érkezett: Süni. Öt fejezetben kiderül, mi történik vele, és mit tehetünk mi. Minden fejezet végén kapsz egy Fontos! kártyát.',
    narrator: 'Karou',
    chapters: [
      { name: 'Új a suliban', card: 'Vita vagy bántás?',
        intro: 'Az Erdei Iskolába új diák érkezett: Süni. Csendes, és gyönyörűen rajzol. Az első napon Szarka rászólt: "Tüskés, ide ne ülj!" Másnap megint. Harmadnap is. Süni egyre kisebbre gömbölyödik. Gépeljünk, és figyeljük, mi történik!',
        beats: [
          { who: 'magpie', say: '"Tüskés, ide ne ülj! Ez a hely foglalt!"', type: ['ez nem oké.', 'nem nevetünk másokon.'] },
          { who: 'hedgy', say: '"Senki sem akar mellém ülni..."', type: ['ülj ide mellém.', 'nem vagy egyedül.', 'gyere, játssz velünk.'] },
        ],
        choice: { q: 'Mit érezhet most Süni? (Többet is választhatsz.)',
          options: [
            { key: 'magányos', label: 'Magányos, mert egyedül ül.', reply: 'Igen. Ha mindig egyedül marad, egyre magányosabb lesz.' },
            { key: 'szomorú', label: 'Szomorú, mert bántó, amit hall.', reply: 'Igen. A szavak is tudnak fájni, akkor is, ha nem látszik.' },
            { key: 'fél', label: 'Fél, hogy holnap is így lesz.', reply: 'Igen. Aki újra és újra ezt kapja, attól fél, hogy sosem lesz vége.' },
            { key: 'jól', label: 'Jól van, ez csak vicc.', reply: 'Biztos? Nézd, hogy összegömbölyödik. Ha csak az egyik fél nevet, az nem vicc. Mit érezhet még?', again: true },
          ] },
        after: 'Brekus és Szarka egyszer összevesztek a labdán, aztán kibékültek: az vita volt. Ami Sünivel történik, az más. Szarka újra és újra, szándékosan bántja, és Süni egyedül nem tud mit kezdeni vele.',
        lesson: 'Bántás az, ha valaki újra és újra, szándékosan rosszat tesz valakinek, aki nem tud jól védekezni. Lehet szóval, kirekesztéssel, pletykával vagy online is. Egy egyszeri vita még nem bántás, de ha rosszul esett, arról is beszélhetsz.' },
      { name: 'A közönség', card: 'A nevetés is számít',
        intro: 'Az ebédlőben Szarka megint csúfolja Sünit: "Nézzétek, a tüskés megint egyedül eszik!" Páran nevetnek. Szarka minden nevetésnél hangosabb lesz. Te mit csinálsz, amikor ezt látod?',
        beats: [
          { who: 'magpie', say: '"Nézzétek, megint egyedül eszik! Haha!"', type: ['a csúfolás nem vicces.', 'nem nevetünk másokon.', 'ez nem oké.'] },
          { who: 'hedgy', say: '"Ti nem nevettek?"', type: ['nem nevetünk másokon.', 'nem vagy egyedül.'] },
        ],
        choice: { q: 'Páran nevetnek az ebédlőben. Mit teszel? (Többet is választhatsz.)',
          options: [
            { key: 'komoly', label: 'Komoly arcot vágok, nem nevetek vele.', reply: 'Szarka rád nézett, de nem kapott tőled nevetést. Eggyel kevesebb a közönség.' },
            { key: 'odaülök', label: 'Odaülök Süni mellé ebédelni.', reply: 'Süni arrébb tolta a tálcáját, hogy elférj. Már ketten vagytok.' },
            { key: 'szólok', label: 'Szólok az ebédlőben ügyelő tanárnak.', reply: 'A tanár odafigyelt, és Szarka abbahagyta. Ez nem árulkodás, hanem segítségkérés.' },
            { key: 'nevetek', label: 'Én is nevetek, mindenki nevet.', reply: 'Olyan könnyű együtt nevetni. De Süni minden nevetést hall, és Szarka attól lesz hangosabb. Mit tennél inkább?', again: true },
          ] },
        after: 'Te nem nevettél. Brekus sem. Szarka körülnézett, de senki sem nevetett vele. Elhallgatott. Süni felnézett, és egy pillanatra rád mosolygott.',
        lesson: 'Aki nevet vagy csak nézi, az is a közönség része. A bántó viselkedés a közönségtől erősödik. Ha nem nevetünk vele, elfogy a közönsége, és a bántott gyerek látja, hogy nincs egyedül.' },
      { name: 'Négy út', card: 'Négy út a kiálláshoz',
        intro: 'A szünetben Szarka elterjesztette, hogy Süni a tüskéivel kiszúrta a labdát. Ez nem igaz. "Süni nem játszhat velünk!" mondja Szarka. Süni egyedül ül a padon. Gépelj, aztán döntsd el, mit tennél!',
        choice: {
          q: 'Süni egyedül ül a padon. Mit teszel? (Többet is választhatsz.)',
          options: [
            { key: 'szólok', label: 'Szólok: "Ez nem igaz, és Süni is játszhat."', reply: 'Nyugodt hangon kimondtad. Brekus melléd állt, és Szarka nem tudott mit mondani. Ezt akkor érdemes, ha biztonságosnak érzed.' },
            { key: 'elhívom', label: 'Elhívom Sünit, hogy rajzoljunk együtt.', reply: 'Süni szeme felcsillant. Rajzoltatok egy hatalmas sárkányt a krétával, és lassan mások is odajöttek megnézni.' },
            { key: 'segítség', label: 'Segítséget kérek Bagoly tanító nénitől.', reply: 'Bagoly tanító néni megköszönte, hogy szóltál. Ez nem árulkodás: segítségkérés, hogy valaki biztonságban legyen.' },
            { key: 'utána', label: 'Utána megkérdezem Sünit, hogy jól van-e.', reply: 'Süni elmondta, hogy rosszul esett, és hogy jólesett, hogy megkérdezted. Egy kérdés is sokat számít.' },
            { key: 'semmi', label: 'Nem csinálok semmit.', reply: 'Ez érthető, néha mi is félünk. De a csend Szarkának segít, nem Süninek. Melyik kis lépés menne mégis?', again: true },
          ] },
        beats: [
          { who: 'magpie', say: '"Süni kiszúrta a labdát! Nem játszhat velünk!"', type: ['ez nem oké.', 'mindenkinek van helye.'] },
          { who: 'hedgy', say: '"Pedig nem is én voltam..."', type: ['mindenki játszhat velünk.', 'gyere, játssz velünk.', 'megkérdezem, mi a baj.'] },
          { who: 'owl', say: '"Ha baj van, nálam mindig szólhattok."', type: ['a segítségkérés nem árulkodás.', 'szólok, ha baj van.', 'elmondom egy felnőttnek.'] },
        ],
        after: 'Bármelyik utat választod, Süni már nincs egyedül. És nem kell mindent egyedül megoldanod: a felnőttek is segítenek.',
        lesson: '1. Szólj, ha biztonságos: "Ez nem oké."\n2. Tereld el: hívd el a bántott gyereket játszani.\n3. Kérj segítséget egy felnőttől: ez nem árulkodás.\n4. Utána is légy ott: kérdezd meg, jól van-e.\nA saját biztonságod az első. Ha egy felnőtt nem segít, szólj egy másiknak.' },
      { name: 'Az osztálycsoport', card: 'Online is számít',
        intro: 'Este az osztály csetcsoportjában megjelent egy kép Süniről, gúnyos felirattal. Szarka küldte. Már hárman tettek rá nevető fejet. Süni is benne van a csoportban, és látja.',
        choice: {
          q: 'Megjelent a gúnyos kép a csoportban. Mit teszel? (Többet is választhatsz.)',
          options: [
            { key: 'nem', label: 'Nem küldöm tovább, és nem nevetek rá.', reply: 'A kép nálad megállt. Ha senki nem küldi tovább, nem jut messzebbre.' },
            { key: 'kép', label: 'Képernyőképet csinálok, és megmutatom anyának.', reply: 'Anya komolyan vette. Megmutatta az osztályfőnöknek, és a kép még aznap este lekerült.' },
            { key: 'írok', label: 'Írok Süninek valami kedveset.', reply: '"Szerintem nagyon szuper a rajzod" írtad. Süni válaszolt egy mosolygó sünivel.' },
            { key: 'nevetek', label: 'Én is teszek rá egy nevető fejet.', reply: 'Egy nevető fej kicsinek tűnik, de Süninek fáj, és Szarkát bátorítja. Online is a közönség része vagyunk. Mit tennél inkább?', again: true },
          ] },
        beats: [
          { who: 'magpie', say: '"Csak vicc! Küldjétek tovább!"', type: ['nem küldöm tovább.', 'ez nem oké.'] },
          { who: 'hedgy', say: '"Mindenki látta a képet..."', type: ['nem vagy egyedül.', 'figyelek a többiekre.'] },
        ],
        after: 'Másnap a kép eltűnt a csoportból. Süni bejött az iskolába, és látta, hogy többen is mellette állnak.',
        lesson: 'Online is ugyanaz a szabály. Ne küldd tovább, és ne nevess rá. Készíts képernyőképet, tiltsd le, jelentsd, és mutasd meg egy felnőttnek. A bántott társadnak írj valami kedveset.' },
      { name: 'Helyrehozás', card: 'Jó vagy úgy, ahogy vagy',
        intro: 'Másnap Bagoly tanító néni leült beszélgetni az osztállyal. Nem kiabált, és nem kiáltott ki senkit rossznak. Azt kérdezte: mi történt, és ki hogyan érezte magát. Szarka sokáig hallgatott.',
        beats: [
          { who: 'owl', say: '"Mi történt, és ki hogyan érezte magát?"', type: ['itt mindenki számít.', 'figyelek a többiekre.'] },
          { who: 'magpie', say: '"Nem gondoltam, hogy ennyire fáj neki..."', type: ['bocsánatot kérek.', 'a kedvesség ragadós.'] },
          { who: 'hedgy', say: '"Kitesszük együtt a rajzaimat?"', type: ['rajzoljunk együtt.', 'együtt erősebbek vagyunk.'] },
        ],
        choice: { q: 'Mit tehet Szarka, hogy helyrehozza? (Többet is választhatsz.)',
          options: [
            { key: 'bocsánat', label: 'Bocsánatot kér, és komolyan gondolja.', reply: 'Egy igazi bocsánatkérés kimondja, mi történt, és hogy sajnálja.' },
            { key: 'segít', label: 'Segít Süninek kitenni a rajzait.', reply: 'A tettek is számítanak: így Süni látja, hogy Szarka tényleg változni akar.' },
            { key: 'figyel', label: 'Legközelebb figyel, és kedves.', reply: 'A változás a következő napokban látszik meg igazán. Mi is segíthetünk neki ebben.' },
            { key: 'mindegy', label: 'Nem kell semmit tennie, már mindegy.', reply: 'Süninek nem mindegy. A helyrehozás része, hogy Szarka tegyen is valamit. Mit tehetne?', again: true },
          ] },
        after: 'Szarka végül megszólalt: "Azt akartam, hogy figyeljenek rám. Nem gondoltam, hogy Süninek ennyire rossz." Bocsánatot kért, és segített Süninek kiállítani a rajzait a folyosón. Az osztály közösen írt egy szabályt a falra: Itt mindenki jó úgy, ahogy van.',
        lesson: 'A bántó viselkedés megváltozhat. Nem a gyerek rossz, hanem amit csinált: ezért a bocsánatkérés és a jóvátétel is a megoldás része. A közösség együtt dönti el, hogy nálunk ez nem oké.' },
    ],
    end: 'Süni már nem gömbölyödik össze. Szarka új barátokat talált, és most ő mondja a legelsőnek, ha valami nem oké. Köszönjük, hogy kiálltál!',
    help: 'Ha téged bántanak, vagy látod, hogy valakit bántanak: nem vagy egyedül, van kiút. Szólj az osztályfőnöködnek, az iskolapszichológusnak vagy a szüleidnek. Ingyen, éjjel-nappal hívhatod a Kék Vonalat is: 116 111.',
    choiceHint: 'Gépeld be a szürke szót, és Enter!',
    moreHint: 'Választhatsz még egyet, vagy Enter: tovább.',
    cardGot: 'Fontos! kártya',
  },
  en: {
    title: 'NOT OKAY: Standing Up in the Forest School',
    intro: 'Hedgy the hedgehog is new at the Forest School. What happens to her, and what can we do? Five chapters, five Important! cards.',
    narrator: 'Karou',
    chapters: [
      { name: 'The new one', card: 'An argument or bullying?',
        intro: 'A new pupil has come to the Forest School: Hedgy the hedgehog. She is quiet and draws beautifully. On the first day Magpie snapped at her: "Prickly, don\'t sit here!" The next day again. And the day after. Hedgy curls up smaller and smaller. Let\'s type and see what happens!',
        beats: [
          { who: 'magpie', say: '"Prickly, don\'t sit here! This seat is taken!"', type: ['this is not okay.', 'we do not laugh at others.'] },
          { who: 'hedgy', say: '"Nobody wants to sit with me..."', type: ['come and sit with me.', 'you are not alone.', 'come and play with us.'] },
        ],
        choice: { q: 'How might Hedgy feel now? (You can pick more than one.)',
          options: [
            { key: 'lonely', label: 'Lonely, because she sits alone.', reply: 'Yes. If she is always left alone, she gets lonelier and lonelier.' },
            { key: 'sad', label: 'Sad, because the words hurt.', reply: 'Yes. Words can hurt too, even when you cannot see it.' },
            { key: 'scared', label: 'Scared it will happen again tomorrow.', reply: 'Yes. When it happens again and again, you start to fear it will never stop.' },
            { key: 'fine', label: 'Fine, it is only a joke.', reply: 'Are you sure? Look how she curls up. If only one side is laughing, it is not a joke. How else might she feel?', again: true },
          ] },
        after: 'Froggy and Magpie once had a fight over the ball, then made up: that was an argument. What happens to Hedgy is different. Magpie hurts her again and again, on purpose, and Hedgy cannot deal with it alone.',
        lesson: 'Bullying is when someone hurts another person again and again, on purpose, and the other one cannot easily defend themselves. It can be words, leaving someone out, rumours, or online. A one-off argument is not bullying, but if it hurt, you can talk about that too.' },
      { name: 'The audience', card: 'Laughing counts too',
        intro: 'In the dining hall Magpie teases Hedgy again: "Look, Prickly eats alone again!" Some laugh. With every laugh Magpie gets louder. What do you do when you see this?',
        beats: [
          { who: 'magpie', say: '"Look, she eats alone again! Haha!"', type: ['teasing is not funny.', 'we do not laugh at others.', 'this is not okay.'] },
          { who: 'hedgy', say: '"You are not laughing?"', type: ['we do not laugh at others.', 'you are not alone.'] },
        ],
        choice: { q: 'Some are laughing in the dining hall. What do you do? (You can pick more than one.)',
          options: [
            { key: 'straight', label: 'I keep a straight face and don\'t laugh along.', reply: 'Magpie looked at you, but got no laugh from you. The audience is one smaller.' },
            { key: 'sit', label: 'I go and sit next to Hedgy for lunch.', reply: 'Hedgy moved her tray to make room. Now there are two of you.' },
            { key: 'tell', label: 'I tell the teacher on lunch duty.', reply: 'The teacher came over, and Magpie stopped. That is not telling tales, it is asking for help.' },
            { key: 'laugh', label: 'I laugh too, everybody does.', reply: 'It is so easy to laugh along. But Hedgy hears every laugh, and they make Magpie louder. What would you rather do?', again: true },
          ] },
        after: 'You did not laugh. Froggy did not either. Magpie looked around, but nobody laughed with her. She went quiet. Hedgy looked up and smiled at you for a moment.',
        lesson: 'Whoever laughs, or just watches, is part of the audience. Bullying grows from the audience. If we do not laugh along, the audience is gone, and the one being hurt sees that they are not alone.' },
      { name: 'Four ways', card: 'Four ways to stand up',
        intro: 'At break Magpie spread a rumour that Hedgy popped the ball with her spines. It is not true. "Hedgy can\'t play with us!" says Magpie. Hedgy sits alone on the bench. Type, then decide what you would do!',
        choice: {
          q: 'Hedgy sits alone on the bench. What do you do? (You can pick more than one.)',
          options: [
            { key: 'say', label: 'I say: "That\'s not true, and Hedgy can play."', reply: 'You said it calmly. Froggy stood next to you, and Magpie had nothing to say. This is good when you feel safe.' },
            { key: 'invite', label: 'I ask Hedgy to come and draw with me.', reply: 'Hedgy\'s eyes lit up. You drew a huge dragon in chalk, and slowly others came to look.' },
            { key: 'help', label: 'I ask Mrs Owl, our teacher, for help.', reply: 'Mrs Owl thanked you for telling her. That is not telling tales: it is asking for help so someone is safe.' },
            { key: 'later', label: 'Later I ask Hedgy if she is okay.', reply: 'Hedgy said it hurt, and that she was glad you asked. One question can mean a lot.' },
            { key: 'nothing', label: 'I do nothing.', reply: 'That is understandable, sometimes we are scared too. But silence helps Magpie, not Hedgy. Which small step could you try?', again: true },
          ] },
        beats: [
          { who: 'magpie', say: '"Hedgy popped the ball! She can\'t play with us!"', type: ['this is not okay.', 'there is room for everyone.'] },
          { who: 'hedgy', say: '"But it wasn\'t me..."', type: ['everyone can play with us.', 'come and play with us.', 'i ask what is wrong.'] },
          { who: 'owl', say: '"If something is wrong, you can always tell me."', type: ['asking for help is not telling tales.', 'i will speak up if something is wrong.', 'i will tell an adult.'] },
        ],
        after: 'Whichever way you choose, Hedgy is not alone any more. And you do not have to sort it all out alone: the adults help too.',
        lesson: '1. Say something, if it is safe: "That\'s not okay."\n2. Distract: invite the one being hurt to play.\n3. Get help from an adult: that is not telling tales.\n4. Be there afterwards: ask if they are okay.\nYour own safety comes first. If one adult does not help, tell another one.' },
      { name: 'The class chat', card: 'Online counts too',
        intro: 'In the evening a picture of Hedgy appeared in the class chat, with a mean caption. Magpie sent it. Three have already put a laughing face on it. Hedgy is in the group too, and she can see it.',
        choice: {
          q: 'The mean picture is in the group. What do you do? (You can pick more than one.)',
          options: [
            { key: 'stop', label: 'I don\'t send it on, and I don\'t laugh at it.', reply: 'The picture stopped with you. If nobody sends it on, it goes no further.' },
            { key: 'shot', label: 'I take a screenshot and show it to Mum.', reply: 'Mum took it seriously. She showed the class teacher, and the picture was gone that same evening.' },
            { key: 'write', label: 'I write something kind to Hedgy.', reply: '"I think your drawing is great" you wrote. Hedgy answered with a smiling hedgehog.' },
            { key: 'laugh', label: 'I put a laughing face on it too.', reply: 'One laughing face seems small, but it hurts Hedgy and cheers Magpie on. Online we are part of the audience too. What would you rather do?', again: true },
          ] },
        beats: [
          { who: 'magpie', say: '"It\'s just a joke! Send it on!"', type: ['i will not send it on.', 'this is not okay.'] },
          { who: 'hedgy', say: '"Everybody saw the picture..."', type: ['you are not alone.', 'i look out for the others.'] },
        ],
        after: 'The next day the picture was gone from the group. Hedgy came to school and saw that several classmates were on her side.',
        lesson: 'Online the same rule counts. Do not send it on, and do not laugh at it. Take a screenshot, block, report, and show it to an adult. Write something kind to the classmate who was hurt.' },
      { name: 'Making it right', card: 'You are fine as you are',
        intro: 'The next day Mrs Owl sat down to talk with the class. She did not shout, and she did not call anyone bad. She asked: what happened, and how did everyone feel? Magpie was quiet for a long time.',
        beats: [
          { who: 'owl', say: '"What happened, and how did everyone feel?"', type: ['everyone matters here.', 'i look out for the others.'] },
          { who: 'magpie', say: '"I didn\'t think it hurt her so much..."', type: ['i am sorry.', 'kindness is catching.'] },
          { who: 'hedgy', say: '"Shall we put my drawings up together?"', type: ['let us draw together.', 'we are stronger together.'] },
        ],
        choice: { q: 'What can Magpie do to make it right? (You can pick more than one.)',
          options: [
            { key: 'sorry', label: 'Say sorry, and mean it.', reply: 'A real sorry says what happened, and that you regret it.' },
            { key: 'help', label: 'Help Hedgy put her drawings up.', reply: 'Actions count too: Hedgy sees that Magpie really wants to change.' },
            { key: 'kind', label: 'Be kind next time, and keep watching out.', reply: 'Change shows in the days after. We can help her with that too.' },
            { key: 'whatever', label: 'Nothing, it does not matter now.', reply: 'It matters to Hedgy. Making it right means Magpie does something too. What could she do?', again: true },
          ] },
        after: 'At last Magpie spoke: "I wanted everyone to notice me. I didn\'t think Hedgy felt so bad." She said sorry, and helped Hedgy put her drawings up in the corridor. Together the class wrote a rule on the wall: Here everyone is fine just as they are.',
        lesson: 'Hurtful behaviour can change. It is not the child who is bad but what they did, so saying sorry and putting things right are part of the answer. Together a class decides: here, that is not okay.' },
    ],
    end: 'Hedgy does not curl up any more. Magpie has new friends, and now she is the first to say when something is not okay. Thank you for standing up!',
    help: 'If someone hurts you, or you see someone being hurt: you are not alone, there is a way out. Tell your class teacher, the school psychologist or your parents. In Hungary you can also call Kék Vonal for free, day and night: 116 111.',
    choiceHint: 'Type the grey word and press Enter!',
    moreHint: 'Pick another one, or press Enter to go on.',
    cardGot: 'Important! card',
  },
};
