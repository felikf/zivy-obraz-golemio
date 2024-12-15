const proverbs = [
  {
    proverb: 'Představte si to ticho, kdyby lidé říkali jen to, co vědí.',
    author: 'Karel Čapek'
  },
  {
    proverb: 'Čtenář prožije tisíc životů, než zemře. Člověk, jenž nikdy nečte, prožije jen jeden.',
    author: 'George R. R. Martin'
  },
  {
    proverb:
      'Mějte dobrou náladu. Dobrá nálada vaše problémy sice nevyřeší, ale naštve tolik lidí kolem, že stojí za to si ji užít.',
    author: 'Jan Werich'
  },
  {
    proverb: 'Správně vidíme jen srdcem. Co je důležité je očím neviditelné.',
    author: 'Antoine de Saint-Exupéry'
  },
  {
    proverb: 'Žít, to je nejvzácnější věc na světě, neboť většina lidí jenom existuje.',
    author: 'Oscar Wilde'
  },
  {
    proverb: 'Pouze dvě věci jsou nekonečné. Vesmír a lidská hloupost. U té první si tím však nejsem tak jist.',
    author: 'Albert Einstein'
  },
  {
    proverb: 'Svět patří těm, co se neposerou.',
    author: 'Charles Bukowski'
  },
  {
    proverb: 'Mnozí z těch, co žijí, by zasluhovali smrt. A mnozí z těch, co zemřeli, by si zasloužili žít.',
    author: 'J. R. R. Tolkien'
  },
  {
    proverb: 'Všichni vědí naprosto přesně, jak mají žít druzí. Zato nikdy nevědí, jak mají žít oni sami. (Alchymista)',
    author: 'Paulo Coelho'
  },
  {
    proverb: 'Na světě nejsou nejkrásnější věci, ale okamžiky.',
    author: 'Karel Čapek'
  },
  {
    proverb: 'Peklo je prázdné, ďáblové jsou mezi námi.',
    author: 'William Shakespeare'
  },
  {
    proverb: 'Ne všichni, kdo bloudí, jsou ztraceni.',
    author: 'J. R. R. Tolkien'
  },
  {
    proverb:
      'Kdo víno má a nepije, kdo hrozny má a nejí je, kdo ženu má a nelíbá, kdo zábavě se vyhýbá, na toho vemte bič a hůl, to není člověk, to je vůl.',
    author: 'Jan Werich'
  },
  {
    proverb: 'Dobré knihy neprozradí všechna svá tajemství najednou.',
    author: 'Stephen King'
  },
  {
    proverb: 'Člověk je sám i mezi lidmi.',
    author: 'Antoine de Saint-Exupéry'
  },
  {
    proverb: 'Rána bičem působí modřinu, ale rána jazykem drtí kosti.',
    author: 'Edgar Allan Poe'
  },
  {
    proverb: 'Když něco opravdu chceš, celý vesmír se spojí, abys to mohl uskutečnit.',
    author: 'Paulo Coelho'
  },
  {
    proverb: 'Každá revoluce končí tím, když se nová prasata dostanou ke korytům.',
    author: 'Eric Arthur Blair'
  },
  {
    proverb: 'Nikdy neodkládám na zítřek, co lze udělat pozítří.',
    author: 'John Lennon'
  },
  {
    proverb: 'Až ti bude v životě nejhůř, otoč se ke slunci a všechny stíny padnou za tebe.',
    author: 'John Lennon'
  },
  {
    proverb: 'Usmívej se na toho, kdo ti nejvíc ublížil, aby neviděl, jak moc tě to bolí.',
    author: 'Božena Němcová'
  },
  {
    proverb: 'Kde blb, tam nebezpečno.',
    author: 'Jan Werich'
  },
  {
    proverb: 'Monstra jsou skutečná a duchové také. Žijí uvnitř nás a někdy vyhrávají.',
    author: 'Stephen King'
  },
  {
    proverb: 'Člověk miluje, protože miluje. Není k tomu žádný důvod.',
    author: 'Paulo Coelho'
  },
  {
    proverb: 'Stáváš se navždy zodpovědným za to, cos k sobě připoutal.',
    author: 'Antoine de Saint-Exupéry'
  },
  {
    proverb: 'Jediný sen je silnější, než tisíce skutečností.',
    author: 'J. R. R. Tolkien'
  },
  {
    proverb: 'Jak je smutné utěšovat se myšlenkou, že jiní jsou na tom hůř.',
    author: 'Oscar Wilde'
  },
  {
    proverb: 'Nic tak neodhaluje charakter lidí jako to, čemu se vysmívají.',
    author: 'Johann Wolfgang Goethe'
  },
  {
    proverb: 'Smutné je, že hlupáci jsou tak sebejistí a lidé moudří tak plni pochybností.',
    author: 'Bertrand Russell'
  },
  {
    proverb: 'Je mnohem snažší odpustit tomu, kdo se mýlil, než tomu, kdo měl pravdu.',
    author: 'Joanne Rowling'
  },
  {
    proverb: 'Svět není továrna na splněná přání.',
    author: 'John Green'
  },
  {
    proverb: 'Vyslyš každého, ale ponech si svůj úsudek.',
    author: 'William Shakespeare'
  },
  {
    proverb: 'Kdo chce, hledá způsob. Kdo nechce, hledá důvod.',
    author: 'Jan Werich'
  },
  {
    proverb: 'Falešný přítel je horší než nepřítel, protože nepříteli se vyhýbáš, kdežto příteli věříš.',
    author: 'Lev Nikolajevič Tolstoj'
  },
  {
    proverb:
      'Vždycky se nám zdá lepší to, co nemůžeme dostat, než to, co už máme. V tom spočívá romantika a idiotství lidského života.',
    author: 'Erich Paul Remark'
  },
  {
    proverb: 'Vím, že nic nevím!',
    author: 'Sókratés'
  },
  {
    proverb: 'Nejhorší okamžiky jsou vždy předtím, než začneš.',
    author: 'Neznámý'
  },
  {
    proverb:
      'Někteří lidé říkají, že musím být hrozný člověk, ale to není pravda. Mám srdce mladého chlapce - ve sklenici na mém stole.',
    author: 'Stephen King'
  },
  {
    proverb: 'Kniha bez příběhu je jako člověk bez duše.',
    author: 'Stephen King'
  },
  {
    proverb:
      'Říkáš: miluji déšť, když však prší, jdeš se schovat, abys nezmokl. Říkáš: miluji slunce, když však svítí, jdeš se schovat do stínu. Mám strach, že mi jednoho dne řekneš: miluji tě.',
    author: 'John Lennon'
  },
  {
    proverb: 'Krása tkví v oku pozorovatele.',
    author: 'William Shakespeare'
  },
  {
    proverb:
      'Když mi bylo pět, maminka mi řekla, že klíčem k životu je štěstí. Když jsem přišel do školy, zeptali se mě, co chci být, až vyrostu. Napsal jsem "šťastný". Řekli mi, že nerozumím zadání. Já jim řekl, že oni nerozumí životu.',
    author: 'John Lennon'
  },
  {
    proverb: 'Šťasten být neumíš, protože po tom, co nemáš, se ženeš, a co máš, na to zapomínáš.',
    author: 'William Shakespeare'
  },
  {
    proverb: 'Lež oběhne svět dřív, než si pravda stačí obout boty.',
    author: 'Terry Pratchett'
  },
  {
    proverb: 'Všechna zvířata jsou si rovna, ale některá jsou si rovnější. (Farma zvířat)',
    author: 'Eric Arthur Blair'
  },
  {
    proverb: 'Žena potřebuje muže stejně jako ryba kolo.',
    author: 'Stephen King'
  },
  {
    proverb: 'Člověk se nikdy nezbaví toho, o čem mlčí.',
    author: 'Jaroslava Kolářová'
  },
  {
    proverb:
      '...život je jako páteční díl televizního seriálu. Dá vám iluzi, že všechno spěje ke konci, a potom v pondělí začnou stejné sračky.',
    author: 'Stephen King'
  },
  {
    proverb: 'Když člověk ponižuje, pak jen proto, že je sám nízký.',
    author: 'Antoine de Saint-Exupéry'
  },
  {
    proverb: 'Dokážu velmi dobře přežívat o samotě - když mám něco dobrého ke čtení.',
    author: 'Sarah J. Maas'
  },
  {
    proverb: 'Můj vkus je velmi prostý. Spokojím se vždycky s tím nejlepším.',
    author: 'Oscar Wilde'
  },
  {
    proverb: '...čas se nezpomalí, když před vámi stojí něco nepříjemného...',
    author: 'Joanne Rowling'
  },
  {
    proverb: 'I zastavené hodiny mají dvakrát denně pravdu. (Zelená míle)',
    author: 'Stephen King'
  },
  {
    proverb: 'Jen nepřátelé mluví pravdu. Přátelé a milenci lžou neustále, neboť jsou polapeni v síti závazků.',
    author: 'Stephen King'
  },
  {
    proverb: 'Láska znamená, že je pro vás něčí štěstí důležitější než vaše, i kdyby to pro vás bylo sebevíc bolestné.',
    author: 'Nicholas Sparks'
  },
  {
    proverb: 'Když se konečně něčemu doopravdy naučíme, jsme už moc staří, aby nám to k něčemu bylo.',
    author: 'Erich Paul Remark'
  },
  {
    proverb:
      'Existuje teorie, která tvrdí, že kdyby jednou někdo přišel na to, k čemu vesmír je a proč tu je, vesmír by okamžitě zmizel a jeho místo by zaujalo něco ještě mnohem bizarnějšího a nevysvětlitelnějšího. Existuje jiná teorie, která tvrdí, že už se to stalo.',
    author: 'Neznámý'
  }
];

function wrap(proverb, wrapLength = 30) {
  const regex = new RegExp(`.{1,${wrapLength}}`, 'g');
  return proverb.match(regex).join('\n');
}

export function getRandomProverb(wrapLength) {
  try {
    let proverb = proverbs[Math.floor(Math.random() * proverbs.length)];
    return {
      ...proverb,
      proverb: wrapLength ? wrap(proverb.proverb, wrapLength) : proverb.proverb
    };
  } catch (error) {
    return 'Chyba při získávání přísloví.';
  }
}
