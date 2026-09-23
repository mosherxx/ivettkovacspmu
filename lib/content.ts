export const categories=[{id:'hair',hu:'Szálas szemöldök',en:'Hairstroke brows'},{id:'powder',hu:'Púderes szemöldök',en:'Powder brows'},{id:'lips',hu:'Ajaktetoválás',en:'Lip blush'}];
export type Photo={id:string,service:string,caption_hu:string,caption_en:string,published:number};
export type Faq={id:string,question_hu:string,question_en:string,answer_hu:string,answer_en:string,position:number,published:number};
export const defaultFaqs:Faq[]=[
  {
    "id": "pain",
    "question_hu": "Fáj a szemöldöktetoválás?",
    "question_en": "Does eyebrow tattooing hurt?",
    "answer_hu": "A tetoválás során lidokain krémet használok ezáltal a folyamat fájdalommentes.",
    "answer_en": "I use lidocaine cream during the tattooing, making the process painless.",
    "position": 0,
    "published": 1
  },
  {
    "id": "darkness",
    "question_hu": "Mennyire lesz sötét közvetlenül utána?",
    "question_en": "How dark will it be immediately afterwards?",
    "answer_hu": "Frissen a szemöldök intenzívebbnek és sötétebbnek tűnhet, majd a gyógyulás során fokozatosan világosodik és finomodik.",
    "answer_en": "The eyebrows may appear more intense and darker when fresh, but will gradually lighten and refine during healing.",
    "position": 1,
    "published": 1
  },
  {
    "id": "healing",
    "question_hu": "Mennyi idő alatt gyógyul meg?",
    "question_en": "How long will it take to heal?",
    "answer_hu": "A felszíni hámlás hamarabb lezajlik, de a bőr teljes regenerációja általában több hetet vesz igénybe. A végleges eredményt érdemes csak a teljes gyógyulás után megítélni.",
    "answer_en": "Surface peeling occurs sooner, but complete regeneration of the skin usually takes several weeks. The final result should only be judged after complete healing.",
    "position": 2,
    "published": 1
  },
  {
    "id": "correction",
    "question_hu": "Kell korrekció?",
    "question_en": "Do I need correction?",
    "answer_hu": "Sok esetben igen. A bőr nem mindenhol egyformán tartja meg a pigmentet, ezért a korrekció során lehetőség van az esetleges hiányok finomítására.",
    "answer_en": "In many cases, yes. The skin does not retain pigment equally everywhere, so it is possible to refine any deficiencies during correction.",
    "position": 3,
    "published": 1
  },
  {
    "id": "longevity",
    "question_hu": "Meddig tartós a sminktetoválás?",
    "question_en": "How long does a makeup tattoo last?",
    "answer_hu": "Nem végleges tetoválás: idővel fokozatosan halványodik. A tartósság függ többek között a bőrtípustól, életmódtól és az alkalmazott technikától.",
    "answer_en": "Not a permanent tattoo: it gradually fades over time. Durability depends, among other things, on skin type, lifestyle and the technique used.",
    "position": 4,
    "published": 1
  },
  {
    "id": "techniques",
    "question_hu": "Mi a különbség a szálas és a púderes technika között?",
    "question_en": "What is the difference between the fiber and powder technique?",
    "answer_hu": "A szálas technika egyesével imitált szálakkal ad természetesebb, szálazott hatást. A púderes technika lágy, satírozott, sminkhatású eredményt ad.",
    "answer_en": "The fiber technique gives a more natural, fibered effect with individually imitated fibers. The powder technique gives a soft, shaded, makeup-like result.",
    "position": 5,
    "published": 1
  },
  {
    "id": "aftercare",
    "question_hu": "Mit kell kerülni a kezelés után?",
    "question_en": "What should be avoided after the treatment?",
    "answer_hu": "A gyógyulás alatt fontos kerülni a dörzsölést és a terület piszkálását, valamint a tartós áztatást, szaunát, uszodát és napozást.",
    "answer_en": "During the healing period, it is important to avoid rubbing and picking at the area, as well as prolonged soaking, sauna, swimming pool and sunbathing.",
    "position": 6,
    "published": 1
  },
  {
    "id": "existing-tattoo",
    "question_hu": "Készíthető-e tetoválás meglévő szemöldöktetoválásra?",
    "question_en": "Can a tattoo be made over an existing eyebrow tattoo?",
    "answer_hu": "Kopástól, telítettségtől függ, mindenképp előzetes konzultációt igényel.",
    "answer_en": "It depends on wear and saturation, and a prior consultation is definitely required.",
    "position": 7,
    "published": 1
  }
];
