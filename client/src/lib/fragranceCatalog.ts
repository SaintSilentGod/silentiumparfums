// Autocomplete catalogue for the layering wardrobe: brand + name only (facts, compiled in-house).
// Anything missing can be added by pasting a Fragrantica link or typing it in.
// Format: "Brand|Name; Name; ..."

const RAW = `
Dior|Sauvage; Sauvage Elixir; Sauvage Parfum; Dior Homme; Dior Homme Intense; Dior Homme Parfum; Fahrenheit; Eau Sauvage; Miss Dior; Miss Dior Blooming Bouquet; J'adore; J'adore L'Or; Hypnotic Poison; Poison; Pure Poison; Addict; Joy; Ambre Nuit; Oud Ispahan; Grey Vetiver; Bois d'Argent; Feve Delicieuse; Gris Dior; Tobacolor; Vanilla Diorama; Rouge Trafalgar; Lucky; Sakura; Jasmin des Anges; Patchouli Imperial; Spice Blend; Ambre Nuit; Leather Oud; Eden-Roc; Bois Talisman
Chanel|Bleu de Chanel; Bleu de Chanel Parfum; Allure Homme Sport; Allure Homme Sport Extreme; Allure Homme; Egoiste; Platinum Egoiste; Antaeus; Pour Monsieur; Coco Mademoiselle; Coco; Coco Noir; Chance; Chance Eau Tendre; Chance Eau Fraiche; Chance Eau Splendide; No 5; No 5 L'Eau; No 19; Gabrielle; Allure; Cristalle; Bois des Iles; Coromandel; Sycomore; Cuir de Russie; 31 Rue Cambon; Beige; Jersey; Le Lion; Misia; Paris-Riviera; Paris-Deauville; Paris-Biarritz; Paris-Venise; Paris-Edimbourg; Boy; 1957
Yves Saint Laurent|Y; Y Eau de Parfum; Y Le Parfum; La Nuit de L'Homme; L'Homme; Kouros; M7 Oud Absolu; Opium; Black Opium; Black Opium Intense; Libre; Libre Intense; Mon Paris; Paris; Rive Gauche; Cinema; Tuxedo; Babycat; Lavallière; Caban; Saharienne; Le Smoking; Blouse; Myslf; Libre Le Parfum
Giorgio Armani|Acqua di Gio; Acqua di Gio Profumo; Acqua di Gio Profondo; Acqua di Gio Absolu; Armani Code; Armani Code Profumo; Armani Code Absolu; Stronger With You; Stronger With You Intensely; Stronger With You Absolutely; Si; Si Passione; Si Intense; My Way; Because It's You; Emporio Armani Diamonds; Prive Rose d'Arabie; Prive Bois d'Encens; Prive Oud Royal; Prive Vetiver Babylone; Prive Cuir Noir; Prive Ambre Soie; Prive Pivoine Suzhou; Prive Bleu Lazuli; Prive Rouge Malachite; Prive Iris Celadon; Prive The Yulong; Acqua di Gioia
Tom Ford|Tobacco Vanille; Oud Wood; Tuscan Leather; Black Orchid; Velvet Orchid; Noir; Noir Extreme; Ombre Leather; Ombre Leather Parfum; Neroli Portofino; Fucking Fabulous; Lost Cherry; Bitter Peach; Rose Prick; Soleil Blanc; Soleil Brulant; Costa Azzurra; Mandarino di Amalfi; Fougere d'Argent; Grey Vetiver; Beau de Jour; Tobacco Oud; Oud Minerale; Ebene Fume; Myrrhe Mystere; Vanille Fatale; Cafe Rose; Jasmin Rouge; Santal Blush; Champaca Absolute; White Suede; Rose de Chine; Electric Cherry; Cherry Smoke; Vanilla Sex; Tobacco Vanille Parfum; Oud Wood Parfum; Metallique; Lavender Extreme; Ebene Fume; Rose Prick; Bois Marocain; Patchouli Absolu; Oud Fleur; Arabian Wood; Plum Japonais; Shanghai Lily; Amber Absolute; Black Lacquer; Fleur de Portofino; Sole di Positano; Tubereuse Nue; Ombre Leather Parfum; Tom Ford for Men; Grey Vetiver Parfum
Creed|Aventus; Green Irish Tweed; Silver Mountain Water; Viking; Royal Oud; Original Santal; Millesime Imperial; Virgin Island Water; Himalaya; Love in White; Aventus for Her; Wind Flowers; Royal Water; Bois du Portugal; Royal Mayfair; Erolfa; Spice and Wood; Oud Zarian; Absolu Aventus; Queen of Silk; Carmina; Delphinus; Original Vetiver; Tabarome
Maison Francis Kurkdjian|Baccarat Rouge 540; Baccarat Rouge 540 Extrait; Grand Soir; Oud Satin Mood; Gentle Fluidity Gold; Gentle Fluidity Silver; Aqua Universalis; Aqua Celestia; Aqua Media; Amyris Homme; Amyris Femme; L'Homme A la Rose; A la Rose; 724; Oud Silk Mood; Petit Matin; Lumiere Noire; Pluriel; Apom; Absolue Pour Le Soir; Grand Soir Extrait; Feminin Pluriel; Masculin Pluriel; Kurky; Oud; Aqua Vitae; Aqua Vitae Cologne Forte
Le Labo|Santal 33; Another 13; Rose 31; The Noir 29; Bergamote 22; Lys 41; Thé Matcha 26; Patchouli 24; Vetiver 46; Oud 27; Ylang 49; Fleur d'Oranger 27; Tonka 25; Labdanum 18; Iris 39; Jasmin 17; Neroli 36; Gaiac 10; Baie 19; Lavande 31; Ambrette 9; Cedrat 37
Byredo|Gypsy Water; Bal d'Afrique; Mojave Ghost; Blanche; Rose of No Man's Land; Super Cedar; Bibliotheque; Black Saffron; Slow Dance; Mixed Emotions; Eleventh Hour; Young Rose; Inflorescence; Pulp; Sundazed; Velvet Haze; Lil Fleur; Oud Immortel; Tobacco Mandarin; Accord Oud; Night Veils Casablanca Lily; Rouge Chaotique; Unnamable; Bal d'Afrique Absolu Chabaud
Jo Malone London|Wood Sage & Sea Salt; English Pear & Freesia; Peony & Blush Suede; Lime Basil & Mandarin; Blackberry & Bay; Myrrh & Tonka; Oud & Bergamot; Velvet Rose & Oud; Pomegranate Noir; Nectarine Blossom & Honey; Red Roses; Jasmine Sambac & Marigold; Orange Blossom; Basil & Neroli; Mimosa & Cardamom; English Oak & Hazelnut; English Oak & Redcurrant; Tuberose Angelica; Dark Amber & Ginger Lily; Vetiver & Golden Vanilla; Scarlet Poppy; Poppy & Barley; Earl Grey & Cucumber; Silk Blossom; Cypress & Grapevine; Wild Bluebell; Sea Daffodil; Honeysuckle & Davana; Fig & Lotus Flower; Midnight Musk & Amber
Maison Margiela|Replica Jazz Club; Replica By the Fireplace; Replica Lazy Sunday Morning; Replica Beach Walk; Replica Coffee Break; Replica Autumn Vibes; Replica Bubble Bath; Replica Sailing Day; Replica When the Rain Stops; Replica Under the Lemon Trees; Replica Whispers in the Library; Replica Matcha Meditation; Replica Flower Market; Replica Across Sands; Replica Music Festival; Replica On a Date; Replica Afternoon Delight; Replica From the Garden; Replica Springtime in a Park; Replica Soul of the Forest; Replica Under the Stars; Replica Never Ending Summer
Kilian|Love Don't Be Shy; Angels' Share; Good Girl Gone Bad; Black Phantom; Straight to Heaven; Rolling in Love; Roses on Ice; Apple Brandy on the Rocks; Can't Stop Loving You; Moonlight in Heaven; Intoxicated; Back to Black; Voulez-Vous Coucher Avec Moi; Princess; Old Fashioned; Smoking Hot; Vodka on the Rocks; Love Don't Be Shy Extreme; Playing With the Devil; Sacred Wood; Gold Knight; Light My Fire; Liaisons Dangereuses; Dark Lord; Musk Oud; Beyond Love; Kissing; Bamboo Harmony; Lemon in Zest
Parfums de Marly|Layton; Layton Exclusif; Pegasus; Pegasus Exclusif; Herod; Carlisle; Delina; Delina Exclusif; Delina La Rosee; Sedley; Greenley; Haltane; Percival; Galloway; Oriana; Valaya; Kalan; Althair; Godolphin; Darley; Lippizan; Shagya; Cassili; Safanad; Athalia; Meliora; Akaster; Habdan; Ispazon; Byerley; Kalan; Oajan; Palatine
Initio|Oud for Greatness; Side Effect; Rehab; Atomic Rose; Musk Therapy; Absolute Aphrodisiac; Psychedelic Love; Magnetic Blend 1; Magnetic Blend 7; Paragon; High Frequency; Narcotic Delight; Blessed Baraka; Addictive Vibration; Mystic Experience; Divine Attraction
Amouage|Interlude Man; Interlude Woman; Reflection Man; Reflection Woman; Jubilation XXV; Jubilation 25; Epic Man; Epic Woman; Memoir Man; Memoir Woman; Lyric Man; Lyric Woman; Gold Man; Gold Woman; Dia Man; Dia Woman; Beach Hut Man; Honour Man; Honour Woman; Fate Man; Fate Woman; Journey Man; Journey Woman; Bracken Man; Overture Man; Sunshine Man; Guidance; Love Delight; Search; Enclave; Boundless; Silver Oud; Purpose; Material; Outlands; Opus I; Opus X; Ashore; Crimson Rocks; Lineage; Meander; Portrayal Man; Imitation Man; Myths Man; Rose Incense
Xerjoff|Naxos; Erba Pura; Alexandria II; Torino21; Accento; More Than Words; Lira; Casamorati 1888; Dama Bianca; Mefisto; Bouquet Ideale; Ivory Route; Nio; Uden; Ouverture; Renaissance; Tony Iommi Monkey Special; 40 Knots; Opera; Golden Dallah; Cruz del Sur II; Elle; Erba Gold; Soprano; Join the Club Fatal Charme; Comandante
Nishane|Hacivat; Ani; Wulong Cha; Fan Your Flames; Hundred Silent Ways; Sultan Vetiver; Ege; Nanshe; Afrika-Olifant; Tempfluo; Unutamam; B-612; Papilefiko; Vain & Naive; Pearl Fall; Karagoz; Shem; Zenne; Suede et Safran; Colognise; Wulong Cha X
Mancera|Cedrat Boise; Red Tobacco; Roses Vanille; Instant Crush; Aoud Lemon Mint; Wild Fruits; Hindu Kush; Sicily; Kumkat Wood; Black Gold; Coco Vanille; Lemon Line; Pink Roses; Aoud Blue Notes; Tonka Cola; Wave Dream; French Riviera; Amore Caffe; Jardin Exclusif; Midnight Gold; Holidays; Sand Aoud
Montale|Intense Cafe; Black Aoud; Arabians Tonka; Starry Nights; Wild Pears; Chocolate Greedy; Pretty Fruity; Roses Musk; Vanilla Cake; Mukhallat; Oudmazing; Aoud Musk; Day Dreams; So Iris Intense; Fruits of the Musk; Honey Aoud; Amber Musk; Dark Aoud; Golden Aoud; Red Aoud; Sweet Oriental Dream; Vanille Absolu; Ristretto Intense Cafe
Frederic Malle|Portrait of a Lady; Carnal Flower; Musc Ravageur; Vetiver Extraordinaire; French Lover; Geranium pour Monsieur; Dans tes Bras; Lipstick Rose; The Night; Bigarade Concentree; Promise; Synthetic Jungle; Eau de Magnolia; Cologne Indelebile; Superstitious; Rose Tonnerre; Noir Epices; Une Rose; Une Fleur de Cassie; Dries Van Noten; Angeliques Sous la Pluie; En Passant; Iris Poudre; Monsieur; Music for a While; Heaven Can Wait
Diptyque|Philosykos; Tam Dao; Do Son; Orpheon; Fleur de Peau; Eau Duelle; Eau Rose; L'Ombre dans L'Eau; Volutes; Oyedo; Eau des Sens; Vetyverio; Olene; Eau Capitale; Kimonanthe; Tempo; Ofresia; Eau de Minthe; L'Eau Papier; Do Son Eau de Parfum; Philosykos Eau de Parfum; 34 Boulevard Saint Germain; Eau Moheli; Eau de Lierre; Geranium Odorata; Oud Palao; Feuille de Lavande; Florabellio
Serge Lutens|Ambre Sultan; Chergui; Fille en Aiguilles; Feminite du Bois; La Fille de Berlin; Santal Majuscule; Un Bois Vanille; Daim Blond; Five O'Clock au Gingembre; Borneo 1834; Muscs Koublai Khan; Datura Noir; Tubereuse Criminelle; Bois de Violette; Iris Silver Mist; L'Orpheline; Jeux de Peau; Ambre Sultan; La Myrrhe; Sarrasins; Arabie; Serge Noire; Gris Clair; Cuir Mauresque; De Profundis; Dent de Lait; Fils de Joie; Baptême du Feu; Nuit de Cellophane; Vitriol d'Oeillet; La Couche du Diable; Bapteme du Feu
Guerlain|Shalimar; Mitsouko; L'Heure Bleue; Habit Rouge; Vetiver; L'Homme Ideal; L'Homme Ideal EDP; Mon Guerlain; La Petite Robe Noire; Aqua Allegoria Pera Granita; Aqua Allegoria Mandarine Basilic; Aqua Allegoria Nerolia Vetiver; Samsara; Jicky; Heritage; Insolence; Idylle; Spiritueuse Double Vanille; Tobacco Honey; Bois d'Armenie; Santal Royal; Oud Essentiel; Cuir Beluga; Angelique Noire; Encens Mythique; Rose Cherie; Cherry Blossom; Neroli Plein Sud; Myrrhe & Delires; Patchouli Ardent; Vanille Planifolia; Bois Mystérieux; Guerlain Homme; Les Deserts d'Orient Songe d'un Bois d'Ete
Hermes|Terre d'Hermes; Terre d'Hermes Eau Intense Vetiver; H24; Un Jardin sur le Nil; Un Jardin en Mediterranee; Un Jardin sur la Lagune; Un Jardin apres la Mousson; Un Jardin sur le Toit; Twilly d'Hermes; Twilly Eau Poivree; Twilly Eau Ginger; Eau des Merveilles; Elixir des Merveilles; L'Ambre des Merveilles; Hermessence Vetiver Tonka; Hermessence Ambre Narguile; Hermessence Cuir d'Ange; Hermessence Santal Massoia; Hermessence Osmanthe Yunnan; Hermessence Oud Alezan; Hermessence Poivre Samarcande; Voyage d'Hermes; Eau d'Orange Verte; Eau de Citron Noir; Eau de Neroli Dore; Eau de Rhubarbe Ecarlate; Eau de Pamplemousse Rose; Kelly Caleche; 24 Faubourg; Barenia; Galop d'Hermes; Jour d'Hermes; Equipage; Bel Ami; Rocabar; Caleche; Cuir d'Ange
Prada|L'Homme; Luna Rossa; Luna Rossa Carbon; Luna Rossa Black; Luna Rossa Ocean; Prada Amber Pour Homme; Paradoxe; Paradoxe Intense; Candy; Candy Night; Infusion d'Iris; Infusion de Vetiver; Infusion de Mandarine; Infusion d'Homme; La Femme; Olfactories Marienbad; Olfactories Purple Rain; Olfactories Cargo de Nuit; Les Infusions Iris Cedre; Prada L'Homme Intense; Prada L'Homme L'Eau
Versace|Eros; Eros Flame; Eros Parfum; Eros Energy; Dylan Blue; Dylan Purple; Dylan Turquoise; Pour Homme; Pour Homme Dylan Blue; The Dreamer; Bright Crystal; Crystal Noir; Yellow Diamond; Versense; Blue Jeans; L'Homme; Man Eau Fraiche; Eros pour Femme
Paco Rabanne|1 Million; 1 Million Elixir; 1 Million Parfum; 1 Million Lucky; 1 Million Prive; Invictus; Invictus Intense; Invictus Legend; Invictus Platinum; Invictus Victory; Invictus Victory Elixir; Phantom; Phantom Parfum; Olympea; Lady Million; Fame; Pure XS; Black XS; Paco Rabanne Pour Homme; Ultraviolet; XS; Million Gold
Jean Paul Gaultier|Le Male; Le Male Le Parfum; Le Male Elixir; Le Beau; Le Beau Le Parfum; Le Beau Paradise Garden; Ultra Male; Scandal; Scandal Pour Homme; Scandal Le Parfum; La Belle; La Belle Le Parfum; Classique; Gaultier Divine; Kokorico; Fleur du Male; Le Male Lover; Le Male In Blue; Gaultier 2; Ma Dame
Viktor & Rolf|Spicebomb; Spicebomb Extreme; Spicebomb Infrared; Spicebomb Night Vision; Flowerbomb; Flowerbomb Nectar; Flowerbomb Ruby Orchid; Bonbon; Antidote; Good Fortune; Magic Spicebomb
Valentino|Uomo; Uomo Intense; Uomo Born in Roma; Uomo Born in Roma Intense; Uomo Born in Roma Coral Fantasy; Donna Born in Roma; Donna Born in Roma Intense; Valentina; Voce Viva; Valentino Donna; Uomo Acqua; Born in Roma Yellow Dream
Givenchy|Gentleman; Gentleman Reserve Privee; Gentleman Society; Gentleman Boisee; Pi; Pi Neo; Givenchy pour Homme; Xeryus Rouge; L'Interdit; L'Interdit Rouge; L'Interdit Intense; Irresistible; Ange ou Demon; Very Irresistible; Organza; Amarige; Play; Gentlemen Only; Gentlemen Only Intense; Dahlia Divin; Hot Couture
Hugo Boss|Boss Bottled; Boss Bottled Intense; Boss Bottled Parfum; Boss Bottled Elixir; Boss Bottled Night; Boss Bottled Unlimited; Boss The Scent; Boss The Scent Absolute; Boss The Scent Le Parfum; Hugo Man; Hugo Red; Boss Alive; Boss Ma Vie; Boss Selection; Hugo Just Different; Boss Orange; Boss Number One
Dolce & Gabbana|The One; The One for Men EDP; The One Gentleman; The One Royal Night; Light Blue; Light Blue Pour Homme; Light Blue Eau Intense; Light Blue Intense Pour Homme; K; K Eau de Parfum; Pour Homme; Pour Homme Intenso; Intenso; The Only One; The Only One 2; Velvet Oud; Velvet Desert Oud; Velvet Sublime; Velvet Tender Oud; Velvet Exotic Leather; Velvet Incenso; Devotion; Q; Dolce; Dolce Garden; Light Blue Sun; Imperatrice; Pour Femme
Burberry|Hero; Hero Eau de Parfum; Burberry London for Men; Burberry Brit for Him; Mr. Burberry; Touch for Men; Burberry Her; Her Elixir; Goddess; Weekend; My Burberry; Burberry Classic; Burberry Body; Brit Rhythm
Calvin Klein|CK One; CK Be; Eternity; Eternity for Men; Obsession; Obsession for Men; Euphoria; Euphoria Men; Escape; Contradiction; Defy; Eternity Aqua; Eternity Air; CK One Shock; Truth; Sheer Beauty; Reveal
Lancome|La Vie Est Belle; La Vie Est Belle Intensement; Idole; Tresor; Tresor Midnight Rose; Miracle; Hypnose; Hypnose Homme; La Nuit Tresor; Poeme; Magie Noire; Climat; O de Lancome; Maison Lancome Oud Bouquet; Maison Lancome Iris Dragees; Maison Lancome Rose Peonia; Maison Lancome Jasmins Marzipane; Maison Lancome Santal Kardamon; Maison Lancome Figues & Agrumes
Carolina Herrera|Good Girl; Good Girl Supreme; Very Good Girl; Bad Boy; Bad Boy Cobalt; 212 VIP Men; 212 VIP Black; 212 Men; 212 Sexy Men; 212 VIP Rose; 212 Heroes; CH Men; CH Men Prive; Carolina Herrera; Herrera for Men; 212 NYC; Good Girl Blush
Mugler|Angel; Alien; Alien Goddess; A*Men; A*Men Pure Havane; A*Men Pure Malt; Angel Nova; Angel Elixir; Aura; Womanity; Cologne; Alien Man; Angel Muse; A*Men Fantasm; Les Exceptions Over the Musk; Les Exceptions Fougere Furieuse; Les Exceptions Supra Floral
Azzaro|Wanted; Wanted by Night; The Most Wanted; The Most Wanted Parfum; Chrome; Chrome Intense; Chrome Extreme; Chrome Parfum; Azzaro pour Homme; Azzaro pour Homme Intense; Wanted Girl; Chrome Aqua; Chrome United; Visit
Montblanc|Explorer; Explorer Ultra Blue; Legend; Legend Spirit; Legend Night; Legend Red; Legend Eau de Parfum; Starwalker; Individuel; Emblem; Signature; Lady Emblem; Presence; Explorer Platinum; Legend Blue
Bvlgari|Man in Black; Man Wood Essence; Man Glacial Essence; Man Rain Essence; Man Terrae Essence; Bvlgari Man; Bvlgari Man Extreme; Aqva Pour Homme; Aqva Marine; Aqva Amara; Aqva Atlantiqve; Bvlgari Pour Homme; Bvlgari Pour Homme Soir; BLV; Omnia; Omnia Crystalline; Omnia Coral; Omnia Amethyste; Goldea; Rose Goldea; Splendida Magnolia Sensuel; Splendida Tubereuse Mystique; Splendida Jasmin Noir; Le Gemme Tygar; Le Gemme Orom; Le Gemme Falkar; Le Gemme Gyan; Le Gemme Kobraa; Allegra; Eau Parfumee au The Vert; Eau Parfumee au The Noir; Eau Parfumee au The Bleu; Eau Parfumee au The Blanc; Eau Parfumee au The Rouge
Gucci|Guilty Pour Homme; Guilty Pour Homme Parfum; Guilty Absolute; Guilty Elixir; Guilty Pour Femme; Bloom; Bloom Intense; Bloom Ambrosia di Fiori; Flora Gorgeous Gardenia; Flora Gorgeous Jasmine; Flora Gorgeous Magnolia; Gucci Rush; Envy; Envy Me; Gucci Pour Homme; Gucci Pour Homme II; Memoire d'une Odeur; Oud; Intense Oud; Made to Measure; Premiere; The Alchemist's Garden A Song for the Rose; The Alchemist's Garden The Voice of the Snake; The Alchemist's Garden Winter's Spring; Gucci by Gucci; Gucci Gorgeous Gardenia
Narciso Rodriguez|For Her; For Her Musc Noir; For Her Pure Musc; Narciso; Narciso Poudree; Narciso Rouge; Narciso Ambree; For Him; For Him Bleu Noir; Musc Noir Rose; Narciso Cristal; All of Me
Kenzo|L'Eau par Kenzo; Kenzo Homme; Flower by Kenzo; Flower by Kenzo Poppy Bouquet; Jungle; Kenzo Amour; Kenzo World; Kenzo Pour Homme; Ca Sent Beau; L'Eau Kenzo Pour Femme
Issey Miyake|L'Eau d'Issey; L'Eau d'Issey Pour Homme; L'Eau d'Issey Pour Homme Intense; L'Eau d'Issey Pour Homme Wood & Wood; Nuit d'Issey; Fusion d'Issey; A Drop d'Issey; L'Eau Majeure d'Issey; Le Sel d'Issey; L'Eau Bleue d'Issey
Davidoff|Cool Water; Cool Water Woman; Cool Water Intense; Hot Water; The Game; Champion; Run Wild; Silver Shadow; Davidoff Zino; Adventure; Echo; Horizon
Chloe|Chloe Eau de Parfum; Nomade; Love Story; See by Chloe; Roses de Chloe; Chloe Signature; Atelier des Fleurs Cedrus; Atelier des Fleurs Rosa Damascena; Chloe Naturelle; Fleur de Parfum
Marc Jacobs|Daisy; Daisy Eau So Fresh; Daisy Love; Perfect; Perfect Intense; Decadence; Dot; Lola; Honey; Bang; Marc Jacobs Woman; Daisy Wild
Ariana Grande|Cloud; Cloud Pink; Thank U Next; Sweet Like Candy; R.E.M.; Ari; God Is a Woman; Mod Vanilla; Moonlight
Zara|Red Temptation; Vibrant Leather; Tobacco Collection Rich Warm Addictive; Gardenia; Black Amber; Wonder Rose; Golden Decade; Silver; Ultra Silver; Seoul; Jazz; Femme; Lightly Bloom; Nuit; Applejuice; Twilight Mauve; Rose Gourmand; Amber Fusion; Orchid
Lattafa|Khamrah; Khamrah Qahwa; Asad; Asad Bourbon; Badee Al Oud Oud for Glory; Badee Al Oud Amethyst; Badee Al Oud Sublime; Yara; Yara Moi; Yara Tous; Ana Abiyedh; Ana Abiyedh Rouge; Raghba; Raghba Wood Intense; Ajwad; Fakhar; Fakhar Rose; Nebras; Qaed Al Fursan; Bade'e Al Oud Noble Blush; Mayar; Hayaati; Hayaati Gold Elixir; Sakeena; Ishq Al Shuyukh; Teriaq; Teriaq Intense; Eclaire; Haya; Atheeri; Musamam; Ameer Al Oudh Intense Oud; Shaheen Gold; The Kingdom; Al Noble Wazeer; Nitro Red; Emaan; Ramz Silver; Ramz Gold; Hayaati Al Maleky; Opulent Musk; Oud Mood
Armaf|Club de Nuit Intense Man; Club de Nuit Milestone; Club de Nuit Sillage; Club de Nuit Untold; Club de Nuit Urban Man Elixir; Club de Nuit Women; Club de Nuit Iconic; Club de Nuit Imperiale; Odyssey Mandarin Sky; Odyssey Homme; Odyssey Mega; Odyssey Aqua; Odyssey Tyrant; Hunter Intense; Tres Nuit; Ventana; Le Parfait Pour Homme; Derby Club House; Club de Nuit Precieux
Rasasi|Hawas; Hawas Ice; Hawas for Her; La Yuqawam; La Yuqawam Jungle Blaze; Daarej; Fattan; Shuhrah; Rumz Al Rasasi 9325; Faqat; Al Wisam Day; Egra; Instinct
Afnan|9PM; 9AM Dive; 9PM Rebel; Supremacy Silver; Supremacy Noir; Supremacy Collector's Edition; Turathi Blue; Turathi Brown; Modest Pour Homme Une; Modest Une; Rare Carbon; Historic Olmeda
Maison Alhambra|Jean Lowe Immortal; Jean Lowe Ombre; Philos Pura; Glacier Le Noir; Toscano Leather; Kismet; Kismet Magic; Salvo; Baroque Rouge 540; Delilah; Amber & Leather; Hercules; Victorioso Nero; Tobacco Touch; Leather Prestige
Juliette Has a Gun|Not a Perfume; Mmmm...; Lady Vengeance; Musc Invisible; Vanilla Vibes; Moscow Mule; Sunny Side Up; Pear Inc.; Ego Stratis; Magnolia Bliss; Another Oud; Gentlewoman; Romantina; Miss Charming; Anyway; Citizen Queen
Escentric Molecules|Molecule 01; Escentric 01; Molecule 02; Escentric 02; Molecule 03; Escentric 03; Molecule 04; Escentric 04; Molecule 05; Escentric 05; Molecule 01 + Ginger; Molecule 01 + Mandarin; Molecule 01 + Iris; Molecule 01 + Patchouli
Memo Paris|Inle; African Leather; Irish Leather; French Leather; Italian Leather; Marfa; Lalibela; Sherwood; Tiger's Nest; Russian Leather; Odon; Kedu; Winter Palace; Ocean Leather; Moon Fever; Siwa; Shams Oud; Granada; Madurai
Penhaligon's|Halfeti; Halfeti Leather; The Tragedy of Lord George; The Bewitching Yasmine; The Coveted Duchess Rose; Sartorial; Endymion; Blenheim Bouquet; Juniper Sling; Luna; Babylon; Lothair; Iris Prima; Elisabethan Rose; Quercus; The Dandy; Much Ado About The Duke; Clandestine Clara; Changing Constance; Empressa; Monsieur Beauregard; Lord George Brilliantine; Bayolea; Equinox Bloom; Opus 1870
Atelier Cologne|Orange Sanguine; Clementine California; Vetiver Fatal; Cedrat Enivrant; Bergamote Soleil; Pomelo Paradis; Oolang Infini; Rose Anonyme; Silver Iris; Mimosa Indigo; Cafe Tuberosa; Musc Imperial; Jasmin Angelique; Gaiac Eternel; Santal Carmin; Vanille Insensee; Cuir Velours
Acqua di Parma|Colonia; Colonia Essenza; Colonia Intensa; Colonia Club; Colonia Pura; Colonia Futura; Blu Mediterraneo Arancia di Capri; Blu Mediterraneo Mirto di Panarea; Blu Mediterraneo Fico di Amalfi; Blu Mediterraneo Bergamotto di Calabria; Blu Mediterraneo Cipresso di Toscana; Blu Mediterraneo Chinotto di Liguria; Blu Mediterraneo Mandorlo di Sicilia; Oud; Leather; Quercia; Vaniglia; Ambra; Osmanthus; Sakura; Magnolia Nobile; Rosa Nobile; Peonia Nobile; Iris Nobile; Gelsomino Nobile; Yuzu; Buongiorno; Colonia Ebano; Colonia Sandalo; Colonia Quercia
Ormonde Jayne|Ormonde Man; Ormonde Woman; Tolu; Ta'if; Champaca; Frangipani; Osmanthus; Montabaco; Isfarkand; Tsarina; Nawab of Oudh; Rose Gold; Zizan; Qi; Sampaquita; Black Gold; Montabaco Verano
Etat Libre d'Orange|You or Someone Like You; Like This; Fils de Dieu; Remarkable People; Fat Electrician; Rien; Tom of Finland; Secretions Magnifiques; I Am Trash; Jasmin et Cigarette; Divin'Enfant; Hermann a Mes Cotes Me Paraissait Une Ombre; She Was an Anomaly; La Fin du Monde; Experimentum Crucis; Exceptional Person; Sous le Pont Mirabeau; Spice Must Flow; Fat Electrician; Archives 69; Bijou Romantique; Cologne; Noel au Balcon
Comme des Garcons|Comme des Garcons; Wonderwood; Odeur 53; Odeur 71; Series 3 Incense Avignon; Series 3 Incense Kyoto; Series 3 Incense Ouarzazate; Series 3 Incense Jaisalmer; Series 3 Incense Zagorsk; Hinoki; Black; Blackpepper; Concrete; Amazingreen; Floriental; Comme des Garcons 2; Comme des Garcons 2 Man; Copper; Monocle Hinoki; Daphne
Profumum Roma|Acqua di Sale; Ambra Aurea; Arso; Dulcis in Fundo; Fumidus; Olibanum; Santalum; Vanitas; Ichnusa; Battito d'Ali; Fiore d'Ambra; Acqua Viva; Tagete; Victrix; Rosae Mundi; Confetto; Dulcis in Fundo; Volo AZ 686
Orto Parisi|Megamare; Terroni; Brutus; Seminalis; Stercus; Viride; Boccanera; Bergamask; Cuoium
Zoologist|Bat; Beaver; Camel; Civet; Dragonfly; Elephant; Hummingbird; Hyrax; Moth; Panda; Rhinoceros; Squid; Tyrannosaurus Rex; Bee; Chipmunk; Seahorse; Snowy Owl; Nightingale
Vilhelm Parfumerie|Dear Polly; Room Service; Mango Skin; Morning Chess; Black Bloom; Basilico & Fellini; Smoke Show; Poets of Berlin; Darling Nikki; Harlem Cobra; Moon Carnival; Fleur Burlesque; Stockholm 1978; The Oud Affair; Purple Fig; 125th & Bloom; Chicago High; Do Not Disturb; Modest Mimosa
Ex Nihilo|Fleur Narcotique; Outcast Blue; Gold Immortals; Lust in Paradise; Blue Talisman; Love Shot; Atlas Fever; Viper Green; Vetiver Moloko; Amber Sky; Cologne 352; Oud Vendome; Sweet Morphine; Santal Calling; Devil Tender
Goldfield & Banks|Pacific Rock Moss; Silky Woods; Ingenious Ginger; Desert Rosewood; Velvet Splendour; Bohemian Lime; Blue Cypress; Wood Infusion; Southern Bloom; Sunset Hour; Mystic Bloom; Purple Suede
Kayali|Vanilla 28; Yum Pistachio Gelato 33; Deja Vu White Flower 57; Utopia Vanilla Coco 21; Lovefest Burning Cherry 48; Eden Juicy Apple 01; Musk 12; Oudgasm Smoky Oud 07; Vanilla Royale Sugared Patchouli 64; Sweet Diamond Pink Pepper 25; Yum Boujee Marshmallow 81; Invite Only Amber 23
Sol de Janeiro|Cheirosa 62; Cheirosa 68; Cheirosa 71; Cheirosa 40; Cheirosa 59; Cheirosa 87; Cheirosa 39; Cheirosa 76; Cheirosa 48; Brazilian Crush
Phlur|Missing Person; Vanilla Skin; Father Figure; Tangerine Boy; Hanami; Not Your Baby; Somebody's Son; Apricot Privee; Strawberry Letter
Glossier|You; You Rêve; You Doux
Clean|Warm Cotton; Fresh Laundry; Cool Cotton; Skin; Rain; Clean Shower Fresh; Sueded Oud; Smoked Vetiver
Commodity|Book; Gin; Moss; Milk; Velvet; Paper
Byredo|Gypsy Water Absolu; Bal d'Afrique Absolu
Tiziana Terenzi|Kirke; Andromeda; Orion; Cassiopea; Gumin; Kirke Extrait; Ursa; Draco; Hale Bopp; Spirito Fiorentino; Bianco Puro; Foconero; Porpora; Sirrah
BDK Parfums|Gris Charnel; Gris Charnel Extrait; Rouge Smoking; Pas Ce Soir; Velvet Tonka; Crème de Cuir; Wood Jasmin; Citrus Riviera; Bouquet de Hongrie; Oud Abramad; Tabac Rose; French Bouquet; Nuit de Sable; Villa Neroli; Rose de Saba; 312 Saint Honore; Ambre Safrano
Louis Vuitton|Ombre Nomade; Imagination; L'Immensite; Orage; Nouveau Monde; Meteore; Sur la Route; Symphony; Afternoon Swim; Cactus Garden; On the Beach; California Dream; City of Stars; Pacific Chill; Attrape-Reves; Coeur Battant; Spell on You; Rose des Vents; Apogee; Contre Moi; Matiere Noire; Dans la Peau; Turbulences; Etoile Filante; Les Sables Roses; Lovers; Stellar Times; Fleur du Desert; Rhapsody; Myriad
Roja Parfums|Elysium; Danger; Enigma; Oligarch; Burlington 1819; Vetiver; Isola Blu; Amber Aoud; Apex; Lyst; Scandal; Elixir; Musk Aoud; Fetish; Diaghilev; 51; Harrods Pour Homme; Creation-E; Turandot
Clive Christian|X; 1872; No 1; C; L for Men; E for Men; V Masculine; Blonde Amber; Jump Up and Kiss Me Hedonistic; Town & Country; Matsukita; Crab Apple Blossom; Original Collection
Bond No 9|Lafayette Street; Bleecker Street; New York Nights; Chinatown; Greenwich Village; Wall Street; Bond No 9 Signature; Nomad; The Scent of Peace; I Love New York; Hudson Yards; Dubai Gold; Dubai Emerald; Madison Avenue; Lexington Avenue; Nolita; Bryant Park; Saks Fifth Avenue; West Side; Brooklyn
Floris London|No 89; Santal; Night Scented Jasmine; Leather Oud; Vert Fougere; Cefiro; JF; Elite; Honey Oud
Atkinsons|24 Old Bond Street; Oud Save the King; The Other Side of Oud; His Majesty the Oud; Her Majesty the Oud; Love in Idleness; Amber Empire; English Lavender; Robust Patchouli; Fashion Decree; The British Bouquet; Iris in the Sky
Mizensir|Celebration; Une Belle Journee; Bois de Mysore; Fresh Wood; Eternal Wood; Perfect Oud; Sweet Oud
Maison Crivelli|Hibiscus Mahajad; Oud Maracuja; Bois Datchai; Rose Saltifolia; Lys Slovaque; Neroli Nasimba; Iris Malikhan; Tubereuse Astrale; Santal Volcanique; Absinthe Boreale; Fleur Diamantine; Patchouli Magnetik; Ambre Chromatique; Cuir Infrarouge; Oud Cadenza; Papyrus Moleculaire; Citrus Batikanga
Essential Parfums|Bois Imperial; Nice Bergamote; Orange x Santal; Divine Vanille; Fig Infusion; Mon Vetiver; The Musc; Rose Magnetic; Bois Imperial Extrait
D.S. & Durga|I Don't Know What; Burning Barbershop; Debaser; Bowmakers; Radio Bombay; Cowboy Grass; Rose Atlantic; Pistachio; Big Sur After Rain; Durga; Jazmin Yucatan; Mississippi Medicine; Steamed Rice; Freetrapper; Coriander; Italian Citrus; Spirit Lodge; Siberian Snow; Amber Kiso; Hylnds
Imaginary Authors|A City on Fire; Bull's Blood; Cape Heartache; Every Storm a Serenade; Falling Into the Sea; Memoirs of a Trespasser; Mortal Skin; O, Unknown!; Saint Julep; Slow Explosions; Sundrunk; The Cobra & The Canary; The Soft Lawn; Whispered Myths; Yesterday Haze; Telegrama; Violet Disguise; Bunny; Fox in the Flowerbed; Paper Lanterns
Heretic Parfum|Dirty Coke; Dirty Grass; Dirty Mint; Dirty Lemon; Florida Water; Nosferatu; Smudge; Cedar Smoke
Akro|Smoke; Night; Haze; Dark; Bake; Ink; Awake; Rise; Malt; Infuse
Henry Rose|Jake's House; Torn; Dark Horse; Queens & Monsters; Last Petal; Windows Down; Fog; Flora Carnivora
Ellis Brooklyn|Myth; Fable; Sun Fruit; Vanilla Milk; Sweet; Raven; Bee; Super Amber; Salt
Al Haramain|Amber Oud Gold Edition; Amber Oud Rouge; Amber Oud Tobacco Edition; Amber Oud Aqua Dubai; L'Aventure; L'Aventure Intense; Detour Noir; Laventure Blanche; Junoon; Ombre Rose; Portfolio Imperial Oud; Rafia Gold; Amber Oud Ruby Edition; Excellent; Amber Oud Dubai Night
Ajmal|Evoke Silver Edition; Evoke Gold Edition; Wisal; Aristocrat; Amber Wood; Blu; Kuro; Sacrifice for Her; Sacrifice for Him; Dahn Al Oudh Al Moattaq; Shadow II; Entice; Raindrops
Swiss Arabian|Shaghaf Oud; Shaghaf Oud Abyad; Shaghaf Oud Aswad; Casablanca; Layali; Kashkha; Mukhallat Malaki; Rimmah
Arabian Oud|Kalemat; Madawi; Sultani; Kalemat Black; Royal Oud; Rose Arabia
Ralph Lauren|Polo; Polo Blue; Polo Red; Polo Black; Polo Green; Polo Sport; Polo Supreme Oud; Romance; Ralph; Safari; Polo Blue Parfum; Polo Red Extreme; Polo Earth
Tommy Hilfiger|Tommy; Tommy Girl; Tommy Now; Impact; Tommy Summer
Lacoste|L.12.12 Blanc; L.12.12 Noir; L.12.12 Rouge; Essential; Red; Lacoste Pour Homme; Touch of Pink; L'Homme Lacoste; Booster; Challenge; Eau de Lacoste Blanc
Cartier|Declaration; Declaration d'Un Soir; L'Envol; Pasha de Cartier; Pasha Edition Noire; Santos; La Panthere; Baiser Vole; Carat; L'Heure Diaphane; L'Heure Defendue; L'Heure Mysterieuse; L'Heure Fougueuse; L'Heure Perdue; Oud & Santal; Oud & Musc; Oud & Pink Pepper; Must de Cartier; Panthere; Eau de Cartier
Van Cleef & Arpels|Bois d'Amande; Moonlight Patchouli; Orchid Leather; Ambre Imperial; Patchouli Blanc; California Reverie; Oud Blanc; Neroli Amara; Bois Dore; Santal Blanc; Collection Extraordinaire Gardenia Petale; Rose Rouge; Feerie; First; Pour Homme; Tsar; Muguet Blanc; Precious Oud
Loewe|001 Man; 001 Woman; Esencia; Solo Loewe; Solo Ella; Loewe 7; Agua de Loewe; Aire de Loewe; Quizas; Paula's Ibiza; Earthy; Solo Atlas; Loewe Pour Homme
Celine|Reptile; Black Tie; Nightclubbing; Parade; Dans Paris; La Peau Nue; Bois Dormant; Rimbaud; Eau de Californie; Cologne Francaise; Saint-Germain-des-Pres; Zouzou; Eau de Californie
Miu Miu|Miu Miu; L'Eau Bleue; L'Eau Rosee; Twist; Fleur d'Argent
Moschino|Toy 2; Toy Boy; Toy 2 Bubble Gum; Toy 2 Pearl; Moschino Uomo; Funny; I Love Love; Fresh Couture; Gold Fresh Couture
Prada|Luna Rossa Extreme; Luna Rossa Sport
Ferrari|Scuderia Ferrari Black; Scuderia Ferrari Red; Ferrari Essence Oud; Ferrari Light Essence; Ferrari Uomo
Jimmy Choo|Man; Man Intense; Man Blue; Urban Hero; Jimmy Choo; I Want Choo; Illicit; Fever; Blossom; Man Ice; Floral
Coach|Coach Man; Coach Blue; Coach Platinum; Coach Floral; Coach Dreams; Coach Woman
Michael Kors|Pour Homme; Wonderlust; Sexy Amber; Extreme Blue; Gorgeous; Michael Kors
Estee Lauder|Pleasures; Beautiful; White Linen; Youth Dew; Knowing; Sensuous; Modern Muse; Private Collection; Bronze Goddess; Beautiful Magnolia
Elizabeth Arden|Red Door; Green Tea; 5th Avenue; Sunflowers; Green Tea Honeysuckle
Vera Wang|Princess; Lovestruck; Vera Wang
Victoria's Secret|Bombshell; Tease; Bare Vanilla; Love Spell; Pure Seduction; Very Sexy; Heavenly; Bombshell Intense; Velvet Petals; Coconut Passion
Bath & Body Works|Warm Vanilla Sugar; A Thousand Wishes; Into the Night; Japanese Cherry Blossom; Champagne Toast; Gingham; Sweet Pea; Mahogany Teakwood; Cashmere Glow
Billie Eilish|Eilish; Eilish No 2; Eilish No 3; Your Turn
Ariana Grande|Cloud 2.0
Halloween|Halloween; Halloween Man; Halloween Man Shot
Abercrombie & Fitch|Fierce; Fierce Cologne; First Instinct; First Instinct Blue; Authentic Moment; Naturally Fierce; Authentic Night
Hollister|California; Jake; Wave; Festival Vibes; Free Wave
Diesel|Only the Brave; Fuel for Life; Spirit of the Brave; Bad; Loverdose; Diesel Plus Plus; Sound of the Brave; D by Diesel
Joop!|Homme; Homme Wild; Jump; Joop! Femme; Homme Absolute
Cacharel|Amor Amor; Anais Anais; Noa; Yes I Am; Lou Lou; Eden; Liberte
Nina Ricci|L'Air du Temps; Nina; Luna; Premier Jour; Nina Rouge; Les Belles de Nina; Ricci Ricci
Rochas|Femme; Eau de Rochas; Rochas Moustache; Mademoiselle Rochas; Rochas Man; Byzance; Tocade
Salvatore Ferragamo|F by Ferragamo; Uomo; Uomo Casual Life; Signorina; Signorina Eleganza; Incanto; Acqua Essenziale; Tuscan Creations Ginger Flash
Trussardi|Uomo; Riflesso; Donna; My Land; Trussardi Jeans
Moncler|Moncler pour Homme; Moncler pour Femme; Sunrise
Tiffany & Co.|Tiffany & Co.; Tiffany & Love; Rose Gold; Sheer
Off-White|Paperwork; Solution No. 1; Solution No. 3; Solution No. 10; Nude
Hermes|Terre d'Hermes Parfum; H24 Herbes Vives
Floraiku|Sweet Kyoto; I Am Coming Home; Moonlight Shadow; Ki-Lin; Enigmatic Flower; One Umbrella For Two
Maison Margiela|Untitled; Mutiny
Arquiste|Flor y Canto; Boutonniere No. 7; Anima Dulcis; Fleur de Louis; Infanta en Flor; The Architects Club; Nanban; Ella; Aleksandr; Misa de Gallo
Parfums MDCI|Invasion Barbare; Le Rivage des Syrtes; Ambre Topkapi; Chypre Palatin; Promesse de l'Aube; Rose de Siwa; Vepres Siciliennes; Bois Sacre
Puredistance|M; Black; Antonia; Opardu; White; Sheiduna; No 12; Rubikona; Warszawa; I
Andy Tauer|L'Air du Desert Marocain; Lonestar Memories; Incense Extreme; Orris; Rose Vermeille; Le Maroc pour Elle; Carillon pour un Ange; Une Rose Chypree; Sotto la Luna Tuberose; Cologne du Maghreb
Papillon Artisan Perfumes|Anubis; Salome; Tobacco Rose; Dryad; Angelique; Bengale Rouge; Hera
Masque Milano|Russian Tea; Lost Alice; Romanza; Madeleine; Tango; L'Attesa; Montecristo; Kintsugi; Love Kills; Times Square; Ray-Flection; Mare Nostrum; Petra; Fried Kiss
Nasomatto|Black Afgano; Baraonda; Pardon; China White; Duro; Hindu Grass; Absinth; Narcotic V; Silver Musk; Blamage; Nudiflorum; Fantomas
Unum|Lavs; Ennui Noir; Rosso Fumo; Opus 1144; Kar-Wai; Io Non Ho Mani Che Mi Accarezzino Il Volto
Stephane Humbert Lucas 777|Khol de Bahrein; O Hira; Black Gemstone; Soleil de Jeddah; Oud 777; Soleil de Jeddah Mango Kiss
Electimuss|Mercury; Octavian; Trajan; Celestial; Puritas; Patchouli Vagabond; Aurora Rose
House of Sillage|Benevolent Lux; Passion de l'Amour
Boadicea the Victorious|Complex; Valiant; Victorious; Pioneer; Explorer; Delight; Ardent; Blue Sapphire; Iris Absolute; Pure Narcotic
Alexandre.J|The Collector Black Muscs; Morning Muscs; Silver Ombre; Zafeer Oud Vanille; Golden Oud
Kajal|Dahab; Masa; Lamar; Warde; Almaz; Jihan; Homme; Homme II; Bouquet de Kajal; Fatima
Fragrance du Bois|Oud Jaune Intense; Shaghaf Oud; Oud Bleu Intense; Rose Blanc
Spirit of Kings|Aludra; Alnair; Rigel; Altair
Gissah|Imperial Valley
Ensar Oud|Oud Yusuf; Oud Ahmad; Royal Kinam; Oud Shuyukh
`;

export interface CatalogEntry { brand: string; name: string; key: string }

// De-duplicated, searchable list
export const CATALOG: CatalogEntry[] = (() => {
  const out: CatalogEntry[] = [];
  const seen = new Set<string>();
  for (const line of RAW.trim().split("\n")) {
    const [brand, names] = line.split("|");
    if (!brand || !names) continue;
    for (const raw of names.split(";")) {
      const name = raw.trim();
      if (!name) continue;
      const key = normalize(`${brand} ${name}`);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ brand: brand.trim(), name, key });
    }
  }
  return out;
})();

export function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

// Simple ranked search: every query word must appear; matches at word starts rank higher.
export function searchCatalog(query: string, limit = 8): CatalogEntry[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  const scored: { e: CatalogEntry; s: number }[] = [];
  for (const e of CATALOG) {
    if (!words.every((w) => e.key.includes(w))) continue;
    let s = 0;
    for (const w of words) s += e.key.startsWith(w) || e.key.includes(` ${w}`) ? 2 : 1;
    if (normalize(e.name).startsWith(q)) s += 3;
    s -= e.key.length / 100;
    scored.push({ e, s });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.e);
}

// fragrantica.com/perfume/Brand-Name/Perfume-Name-12345.html (any locale) → brand + name, no network call
export function parseFragranticaUrl(input: string): { brand: string; name: string } | null {
  const m = input.trim().match(/fragrantica\.[a-z.]+\/(?:perfume|perfumy|parfum|duft|perfumes|profumo|parfem)\/([^/]+)\/([^/?#]+?)(?:-\d+)?\.html/i);
  if (!m) return null;
  const pretty = (s: string) => decodeURIComponent(s).replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const brand = pretty(m[1]);
  const name = pretty(m[2]);
  return brand && name ? { brand, name } : null;
}
