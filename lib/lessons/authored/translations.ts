import type { AuthoredLesson } from "../../lesson-contract";

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATED LESSONS.
//
// A translation is a WHOLE lesson, not a heading. Every learner-visible field is
// translated — objectives, introduction, explanation, representations, worked
// examples with their reasoning, misconceptions, guided practice, assessment
// prompts, transfer, retrieval and summary — because the failure the translation
// rule exists to prevent is a translated heading followed by pages of English.
//
// WHAT THE STATUS MEANS. `machine` is exactly what it says: produced
// automatically and not checked by a native-speaking teacher. It is NOT
// `human-reviewed`, and nothing in this repository can make it so — a record can
// only be written by a person who read the lesson. The page prints the status
// beside the lesson, so a pupil is never told an unreviewed translation was
// approved.
//
// The answer keys and numeric answers are language-free where the subject allows
// it (3040 is 3040), but the accepted spellings do include the local thousands
// separator, because a Spanish pupil types 3.040 and is right.
// ─────────────────────────────────────────────────────────────────────────────

const ES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "place-value",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, número: valor posicional y sistema de numeración",
    level: "Key Stage 2 a Key Stage 3",
    note: "Objetivo redactado a partir del contenido oficial de la asignatura; no se reproduce texto de la especificación.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Leer el valor de una cifra según su posición y comparar dos números por su columna más alta, no por su longitud.",
      evidence:
        "Ante 3.040 y 3.400, el alumno dice que 3.400 es mayor porque la cifra de las centenas es 4 y no 0, y no compara las cifras de izquierda a derecha como si fueran independientes.",
    },
    {
      statement: "Escribir un número en forma desarrollada y reconstruirlo a partir de sus partes.",
      evidence:
        "El alumno escribe 3.040 como 3.000 + 40 y explica que el cero de las centenas mantiene esa columna vacía en lugar de no aportar nada.",
    },
    {
      statement: "Explicar por qué mover una cifra un lugar a la izquierda multiplica su valor por diez.",
      evidence:
        "El alumno dice que cada columna vale diez veces la columna de su derecha, así que la misma cifra en la columna siguiente vale diez veces más.",
    },
  ],

  priorKnowledge: {
    conceptIds: [],
    check: [
      {
        id: "d1",
        question: "Cuenta desde el 8 de uno en uno. ¿Qué viene después del 9?",
        answer: "Diez: diez unidades se escriben como un 1 en la columna siguiente.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "¿Qué es mayor, 7 o 2?",
        answer: "Siete. Importa porque la misma pregunta sobre cifras dentro de un número tiene otra respuesta.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "Una dependienta lee una etiqueta en voz alta como «cuarenta y cinco», no como «cuatro y cinco». Las dos cifras son las mismas manchas en el papel; lo único que las convirtió en un precio fue el lugar donde están.",
    why:
      "Un número escrito no es una lista de cifras. Cada posición es una columna con un valor fijo, y la cifra que la ocupa dice cuántas hay de esa columna. Esa sola regla explica por qué diez símbolos pueden escribir cualquier número.",
  },

  explanation: [
    {
      heading: "Cada columna tiene su propio valor",
      paragraphs: [
        "En cuatrocientos cincuenta y dos, la cifra cuatro no vale cuatro. Ocupa la columna de las centenas, así que vale cuatro centenas. El cinco está en la columna de las decenas y vale cincuenta. El dos está en la de las unidades y vale dos. El número es la suma de esas tres cantidades, y por eso es mayor que cuatro o que cincuenta y dos por separado.",
        "Las columnas están fijadas de antemano; no las decide la cifra. Eso permite que el mismo símbolo haga trabajos distintos en números distintos: un siete en las decenas vale setenta, y ese mismo siete en las unidades de millar vale siete mil. La cifra cuenta; la columna dice qué se está contando.",
      ],
    },
    {
      heading: "Cada columna vale diez de la que tiene a su derecha",
      paragraphs: [
        "Diez unidades forman una decena; diez decenas forman una centena; diez centenas forman una unidad de millar. Como cada columna vale diez veces la de su derecha, mover una cifra un lugar a la izquierda multiplica su valor por diez. Ahí está todo el sistema escrito, y por eso nos llevamos una cuando una columna llega a diez.",
        "El patrón continúa a la derecha de la coma decimal, donde cada columna vale una décima parte de la que tiene a su izquierda. Un número no se divide en una parte entera y una fracción que se ignoran: es una sola fila de columnas, y la coma solo marca dónde acaban las unidades.",
      ],
    },
    {
      heading: "El cero mantiene una columna abierta",
      paragraphs: [
        "En tres mil cuarenta, el cero de las centenas dice que esa columna está vacía. No es nada: sin él, las cifras se desplazarían a la derecha y el número se leería como trescientos cuatro. El cero es un marcador de posición, y un número escrito sin él es otro número, no una versión abreviada del mismo.",
        "Esto también explica por qué un número más largo no siempre es mayor, ni uno más corto siempre menor. Novecientos noventa y nueve tiene más cifras que mil y es menor. Lo que decide el tamaño es la columna más alta que no está vacía, porque vale más que todas las columnas de su derecha juntas.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "Un número, escrito como las tres cantidades que guardan sus columnas.",
      notation: "452 = 400 + 50 + 2",
      caption:
        "La cifra cuatro vale cuatro centenas, el cinco vale cincuenta y el dos vale dos. Sumar las tres cantidades devuelve el número.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "Bloques de base diez para 452: cuatro placas de cien, cinco barras de diez y dos cubos de uno. El dibujo es la misma suma que dice la notación.",
      notation: "4 centenas + 5 decenas + 2 unidades",
      caption:
        "Diez cubos forman una barra y diez barras forman una placa. Por eso una columna vale diez de la siguiente, y por eso funciona llevarse una.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body: "Las mismas cifras en dos posiciones, muy separadas en la recta.",
      notation: "3.040 — 3.400",
      caption:
        "En 3.040 la cifra de las centenas es 0; en 3.400 es 4. La columna más alta que cambia decide qué número es mayor, y aquí es la de las centenas.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "¿Cuál es mayor, 452 o 425? Explica tu respuesta.",
      steps: [
        {
          move: "Alinea los dos números por columnas, no por el orden en que aparecen sus cifras.",
          why:
            "Comparar de izquierda a derecha solo funciona si las columnas están alineadas. Escritos uno debajo del otro, con las unidades bajo las unidades, cada cifra se enfrenta a la de su misma columna.",
        },
        {
          move: "Compara primero la columna más alta: los dos tienen 4 centenas, así que las centenas no deciden.",
          why:
            "La columna más alta que cambia resuelve la comparación, porque vale más que todas las de abajo juntas. Si las centenas son iguales, la decisión pasa una columna a la derecha.",
        },
        {
          move: "Compara las decenas: 5 decenas frente a 2 decenas, así que 452 es mayor.",
          why:
            "Cincuenta es más que veinte, y las unidades no pueden compensar una diferencia de treinta. Por eso 452 gana a 425 aunque las últimas cifras sugieran lo contrario.",
        },
      ],
      answer: "452 es mayor, porque 5 decenas es más que 2 decenas",
    },
    {
      id: "w2",
      prompt: "Escribe 3.040 en forma desarrollada y di qué hace el cero.",
      steps: [
        {
          move: "Lee cada columna: 3 unidades de millar, 0 centenas, 4 decenas, 0 unidades.",
          why:
            "La forma desarrollada avanza columna a columna desde la izquierda. Leer las cifras en orden evita que las columnas se desplacen, que es el error que este paso previene.",
        },
        {
          move: "Escribe las cantidades que no son cero: 3.000 + 40.",
          why:
            "Cero centenas no aporta nada a la suma, así que se omiten en la suma. Omitirlas del número ESCRITO sería un error completamente distinto.",
        },
        {
          move: "Mantén el cero en el número original: 3.040, donde sostiene la columna de las centenas entre el 3 y el 4.",
          why:
            "Sin ese cero las cifras se desplazarían a la derecha y el número se leería como trescientos cuatro. El cero cumple una función estructural, no representa una cantidad.",
        },
      ],
      answer: "3.040 = 3.000 + 40, y el cero mantiene abierta la columna de las centenas",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "El número más largo siempre es el mayor.",
      whyItFails:
        "La longitud cuenta columnas, y una columna puede estar vacía o tener poco. Novecientos noventa y nueve tiene tres cifras y mil tiene cuatro, pero mil es mayor. Decidir por la longitud ignora cuánto vale cada columna.",
      correction:
        "Compara la columna más alta que no esté vacía. Esa columna pesa más que todas las de su derecha, así que decide la comparación antes de leer cualquier otra cifra.",
      contrast: {
        wrong: "999 es mayor que 1.000 porque tiene más cifras ocupadas",
        right: "1.000 es mayor porque su columna más alta es la de las unidades de millar",
      },
    },
    {
      id: "m2",
      belief: "Un cero no aporta nada, así que se puede quitar de un número.",
      whyItFails:
        "El cero no tiene valor propio, pero mantiene abierta una columna. Quitarlo desplaza una columna a la izquierda todas las cifras de su derecha, lo que cambia lo que valen. Tres mil cuarenta se convierte en trescientos cuatro.",
      correction:
        "Lee el cero como una instrucción sobre la columna, no como una cantidad. Dice que esta columna está vacía; no dice que se pueda borrar.",
      contrast: {
        wrong: "3.040 = 340",
        right: "3.040 = 3.000 + 40, con la columna de las centenas vacía",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "¿Cuánto vale la cifra 7 en 5.720?",
      hint: "Nombra la columna en la que está el 7 antes de decir su valor.",
      answer: "Setecientas, porque ocupa la columna de las centenas",
      feedback: {
        correct: "Has nombrado primero la columna, y de ahí sale el valor.",
        incorrect: "El 7 no vale siete. Cuenta las columnas desde la derecha: unidades, decenas, centenas.",
      },
    },
    {
      id: "p2",
      prompt: "Escribe 6.005 en forma desarrollada.",
      hint: "Hay dos columnas vacías. Nombra cada columna antes de sumar.",
      answer: "6.000 + 5",
      feedback: {
        correct: "Seis unidades de millar y cinco unidades, con las centenas y las decenas vacías.",
        incorrect: "Revisa las columnas: 6 en unidades de millar, 0 centenas, 0 decenas, 5 unidades.",
      },
    },
    {
      id: "p3",
      prompt: "¿Cuál es mayor, 4.099 o 4.100? Di qué columna lo decide.",
      hint: "Las unidades de millar son iguales. Pasa una columna a la derecha y compara otra vez.",
      answer: "4.100 es mayor; lo decide la columna de las centenas",
      feedback: {
        correct: "Novecientos noventa y nueve frente a cien se decide en las centenas.",
        incorrect: "Compara columna a columna desde la izquierda, no cifra a cifra dentro del número.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Escribe 3.040 como número, sin puntos y sin espacios.",
      modelAnswer: "3040",
      marking: ["Coloca las cifras en las mismas columnas y mantiene el cero entre el 3 y el 4."],
      // Both the local separator (3.040) and the English one (3,040) mark the
      // same answer right — a pupil who reads English material should not be
      // marked wrong for typing the only form they have seen.
      check: { accepted: ["3040", "3.040", "3,040"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "Un alumno dice que 999 es mayor que 1.000 porque tiene tres cifras ocupadas y 1.000 solo una. Explica qué falla en ese razonamiento.",
      modelAnswer:
        "Contar cifras ocupadas compara columnas como si todas valieran lo mismo. No es así: el 1 de 1.000 vale mil, que es más que las nueve centenas, las nueve decenas y las nueve unidades de 999 juntas. La columna más alta no vacía decide la comparación.",
      marking: [
        "Afirma que las columnas tienen valores distintos y no cuentan igual.",
        "Identifica la columna de las unidades de millar como superior a las centenas, decenas y unidades juntas.",
        "Concluye que 1.000 es mayor, de forma coherente con el razonamiento.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Una caja registradora muestra 1.050 y un recibo imprime 1.500. Un cliente dice que el recibo debe estar mal porque los dos números tienen cuatro cifras y empiezan igual. Usa el valor posicional para explicar cuál es mayor y por qué las cifras no lo deciden.",
      whyItTransfers:
        "El contexto es un recibo y no una ficha, y los dos números difieren en una columna fácil de saltarse. El alumno tiene que aplicar la regla de las columnas a una comparación real en lugar de un ejercicio escrito.",
      answer:
        "1.500 es mayor, porque la cifra de las centenas es 5 y no 0. Los dos tienen 1 unidad de millar, así que la decisión pasa a las centenas.",
      marking: [
        "Alinea los números por columnas.",
        "Identifica la columna de las centenas como la que cambia.",
        "Concluye que 1.500 es mayor refiriéndose a la columna y no al número de cifras.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "¿Cuánto vale la cifra 8 en 2.806?",
      answer: "Ochocientas, porque ocupa la columna de las centenas.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Escribe cuatro mil seis con cifras.",
      answer: "4.006, con las columnas de las centenas y las decenas vacías.",
      when: "week-later",
    },
  ],

  summary: [
    "El valor de una cifra viene de su columna: centenas, decenas, unidades, y así a ambos lados.",
    "Cada columna vale diez de la que tiene a su derecha, y por eso una cifra que se mueve a la izquierda vale diez veces más.",
    "Un cero mantiene una columna abierta; quitarlo desplaza las cifras y cambia el número.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Los encabezados de columna se anuncian antes que las cifras, de modo que la cifra y su columna se oyen juntas y no como una ristra de símbolos.",
    },
    {
      need: "dyslexia",
      alternative:
        "Los números largos se agrupan por columnas con espacio visible, y la forma desarrollada se escribe una columna por línea.",
    },
    {
      need: "colour-vision",
      alternative:
        "Los bloques de base diez se distinguen por su forma y por un número impreso, nunca solo por el color.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Escrito para OpenMind.",
      reproduction: "none",
      note: "Todas las explicaciones, ejemplos, prácticas y evaluaciones de esta lección son originales de OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution: "Alcance citado según el contenido oficial de matemáticas de GCSE para número.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-04",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [
    {
      language: "es",
      status: "machine",
      translator: "OpenMind translation pipeline",
      lessonVersion: "1.0.0",
    },
  ],
};

const FR: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "place-value",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, nombre : valeur de position et système de numération",
    level: "Key Stage 2 à Key Stage 3",
    note: "Objectif rédigé à partir du contenu officiel de la discipline ; aucun texte du programme n'est reproduit.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Lire la valeur d'un chiffre d'après sa position et comparer deux nombres par leur colonne la plus haute, non par leur longueur.",
      evidence:
        "Devant 3 040 et 3 400, l'élève dit que 3 400 est plus grand parce que le chiffre des centaines est 4 et non 0, et ne compare pas les chiffres de gauche à droite comme s'ils étaient indépendants.",
    },
    {
      statement: "Écrire un nombre en forme développée et le reconstruire à partir de ses parties.",
      evidence:
        "L'élève écrit 3 040 = 3 000 + 40 et explique que le zéro des centaines maintient cette colonne vide au lieu de n'apporter rien.",
    },
    {
      statement: "Expliquer pourquoi déplacer un chiffre d'un rang vers la gauche multiplie sa valeur par dix.",
      evidence:
        "L'élève dit que chaque colonne vaut dix fois celle de droite, donc le même chiffre au rang suivant vaut dix fois plus.",
    },
  ],

  priorKnowledge: {
    conceptIds: [],
    check: [
      {
        id: "d1",
        question: "Compte à partir de 8, de un en un. Qu'y a-t-il après 9 ?",
        answer: "Dix : dix unités s'écrivent 1 dans la colonne suivante.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "Quel est le plus grand, 7 ou 2 ?",
        answer: "Sept. Cela compte parce que la même question posée sur des chiffres dans un nombre a une autre réponse.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "Une vendeuse lit une étiquette à voix haute « quarante-cinq », et non « quatre et cinq ». Les deux chiffres sont les mêmes taches sur le papier ; seul leur emplacement en a fait un prix.",
    why:
      "Un nombre écrit n'est pas une liste de chiffres. Chaque position est une colonne de valeur fixe, et le chiffre qui l'occupe dit combien il y en a. Cette seule règle explique pourquoi dix symboles suffisent à écrire n'importe quel nombre.",
  },

  explanation: [
    {
      heading: "Chaque colonne a sa propre valeur",
      paragraphs: [
        "Dans quatre cent cinquante-deux, le chiffre quatre ne vaut pas quatre. Il occupe la colonne des centaines, donc il vaut quatre centaines. Le cinq est dans la colonne des dizaines et vaut cinquante. Le deux est dans celle des unités et vaut deux. Le nombre est la somme de ces trois quantités, et c'est pourquoi il dépasse quatre ou cinquante-deux pris séparément.",
        "Les colonnes sont fixées d'avance ; ce n'est pas le chiffre qui les choisit. C'est ce qui permet au même symbole de jouer des rôles différents : un sept dans les dizaines vaut soixante-dix, et ce même sept dans les unités de mille vaut sept mille. Le chiffre compte ; la colonne dit ce qui est compté.",
      ],
    },
    {
      heading: "Chaque colonne vaut dix fois celle de droite",
      paragraphs: [
        "Dix unités font une dizaine ; dix dizaines font une centaine ; dix centaines font une unité de mille. Comme chaque colonne vaut dix fois celle de droite, déplacer un chiffre d'un rang vers la gauche multiplie sa valeur par dix. Voilà tout le système écrit, et c'est pourquoi on retient une quand une colonne atteint dix.",
        "Le motif continue à droite de la virgule, où chaque colonne vaut un dixième de celle de gauche. Un nombre ne se coupe donc pas en une partie entière et une fraction qui s'ignorent : c'est une seule rangée de colonnes, et la virgule marque seulement la fin des unités.",
      ],
    },
    {
      heading: "Le zéro maintient une colonne ouverte",
      paragraphs: [
        "Dans trois mille quarante, le zéro des centaines dit que cette colonne est vide. Ce n'est pas rien : sans lui, les chiffres glisseraient vers la droite et le nombre se lirait trois cent quatre. Le zéro est un jeton de position, et un nombre écrit sans lui est un autre nombre, pas une version abrégée du même.",
        "Cela explique aussi pourquoi un nombre plus long n'est pas toujours plus grand, ni un plus court toujours plus petit. Neuf cent quatre-vingt-dix-neuf a plus de chiffres que mille et pourtant il est plus petit. Ce qui décide de la taille, c'est la colonne la plus haute qui n'est pas vide, car elle vaut plus que toutes celles de droite réunies.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "Un nombre, écrit comme les trois quantités que gardent ses colonnes.",
      notation: "452 = 400 + 50 + 2",
      caption:
        "Le chiffre quatre vaut quatre centaines, le cinq vaut cinquante et le deux vaut deux. Additionner les trois quantités redonne le nombre.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "Blocs en base dix pour 452 : quatre plaques de cent, cinq barres de dix et deux cubes de un. Le dessin est la même somme que dit la notation.",
      notation: "4 centaines + 5 dizaines + 2 unités",
      caption:
        "Dix cubes font une barre et dix barres font une plaque. C'est pourquoi une colonne vaut dix fois la suivante, et pourquoi la retenue fonctionne.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body: "Les mêmes chiffres à deux positions, très éloignées sur la droite.",
      notation: "3 040 — 3 400",
      caption:
        "Dans 3 040 le chiffre des centaines est 0 ; dans 3 400 c'est 4. La colonne la plus haute qui change décide lequel est le plus grand, et ici c'est celle des centaines.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Quel est le plus grand, 452 ou 425 ? Explique ta réponse.",
      steps: [
        {
          move: "Aligne les deux nombres par colonnes, pas dans l'ordre où leurs chiffres sont écrits.",
          why:
            "Comparer de gauche à droite ne marche que si les colonnes sont alignées. Écrits l'un sous l'autre, unités sous unités, chaque chiffre fait face à celui de sa colonne.",
        },
        {
          move: "Compare d'abord la colonne la plus haute : les deux ont 4 centaines, donc les centaines ne tranchent pas.",
          why:
            "La colonne la plus haute qui diffère règle la comparaison, car elle vaut plus que toutes celles du dessous réunies. À centaines égales, la décision passe une colonne à droite.",
        },
        {
          move: "Compare les dizaines : 5 dizaines contre 2 dizaines, donc 452 est plus grand.",
          why:
            "Cinquante dépasse vingt, et les unités ne peuvent pas combler un écart de trente. C'est pourquoi 452 l'emporte sur 425 alors que les derniers chiffres suggèrent le contraire.",
        },
      ],
      answer: "452 est plus grand, parce que 5 dizaines dépassent 2 dizaines",
    },
    {
      id: "w2",
      prompt: "Écris 3 040 en forme développée et dis ce que fait le zéro.",
      steps: [
        {
          move: "Lis chaque colonne : 3 unités de mille, 0 centaine, 4 dizaines, 0 unité.",
          why:
            "La forme développée avance colonne par colonne depuis la gauche. Lire les chiffres dans l'ordre évite que les colonnes glissent, l'erreur que cette étape prévient.",
        },
        {
          move: "Écris les quantités qui ne sont pas nulles : 3 000 + 40.",
          why:
            "Zéro centaine n'ajoute rien à la somme, donc on l'omet de l'addition. L'omettre du nombre ÉCRIT serait une erreur tout à fait différente.",
        },
        {
          move: "Garde le zéro dans le nombre d'origine : 3 040, où il tient ouverte la colonne des centaines entre le 3 et le 4.",
          why:
            "Sans ce zéro, les chiffres glisseraient vers la droite et le nombre se lirait trois cent quatre. Le zéro fait un travail de structure, il ne représente pas une quantité.",
        },
      ],
      answer: "3 040 = 3 000 + 40, et le zéro tient ouverte la colonne des centaines",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Le nombre le plus long est toujours le plus grand.",
      whyItFails:
        "La longueur compte des colonnes, et une colonne peut être vide ou faible. Neuf cent quatre-vingt-dix-neuf a trois chiffres et mille en a quatre, pourtant mille est plus grand. Décider par la longueur ignore la valeur de chaque colonne.",
      correction:
        "Compare la colonne la plus haute qui n'est pas vide. Elle pèse plus que toutes celles de droite, donc elle tranche avant qu'on lise un autre chiffre.",
      contrast: {
        wrong: "999 est plus grand que 1 000 parce qu'il a plus de chiffres remplis",
        right: "1 000 est plus grand parce que sa colonne la plus haute est celle des unités de mille",
      },
    },
    {
      id: "m2",
      belief: "Un zéro n'apporte rien, on peut donc le retirer d'un nombre.",
      whyItFails:
        "Le zéro n'a pas de valeur propre, mais il tient une colonne ouverte. Le retirer décale d'une colonne vers la gauche tous les chiffres de sa droite, ce qui change leur valeur : trois mille quarante devient trois cent quatre.",
      correction:
        "Lis le zéro comme une consigne sur la colonne, non comme une quantité. Il dit que cette colonne est vide ; il ne dit pas qu'on peut l'effacer.",
      contrast: {
        wrong: "3 040 = 340",
        right: "3 040 = 3 000 + 40, avec la colonne des centaines vide",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Que vaut le chiffre 7 dans 5 720 ?",
      hint: "Nomme la colonne du 7 avant de dire sa valeur.",
      answer: "Sept cents, parce qu'il occupe la colonne des centaines",
      feedback: {
        correct: "Tu as nommé la colonne d'abord, et la valeur en découle.",
        incorrect: "Le 7 ne vaut pas sept. Compte les colonnes depuis la droite : unités, dizaines, centaines.",
      },
    },
    {
      id: "p2",
      prompt: "Écris 6 005 en forme développée.",
      hint: "Il y a deux colonnes vides. Nomme chaque colonne avant d'additionner.",
      answer: "6 000 + 5",
      feedback: {
        correct: "Six unités de mille et cinq unités, avec les centaines et les dizaines vides.",
        incorrect: "Vérifie les colonnes : 6 en unités de mille, 0 centaine, 0 dizaine, 5 unités.",
      },
    },
    {
      id: "p3",
      prompt: "Quel est le plus grand, 4 099 ou 4 100 ? Dis quelle colonne le décide.",
      hint: "Les unités de mille sont égales. Passe une colonne à droite et compare encore.",
      answer: "4 100 est plus grand ; la colonne des centaines le décide",
      feedback: {
        correct: "Neuf cent quatre-vingt-dix-neuf contre cent se décide aux centaines.",
        incorrect: "Compare colonne par colonne depuis la gauche, pas chiffre par chiffre à l'intérieur du nombre.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Écris 3 040 en chiffres, sans espace et sans séparateur de milliers.",
      modelAnswer: "3040",
      marking: ["Place les chiffres dans les mêmes colonnes et garde le zéro entre le 3 et le 4."],
      check: { accepted: ["3040", "3 040", "3.040", "3,040"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "Un élève affirme que 999 est plus grand que 1 000 parce qu'il a trois chiffres remplis et 1 000 un seul. Explique ce qui cloche dans ce raisonnement.",
      modelAnswer:
        "Compter les chiffres remplis compare des colonnes comme si elles valaient toutes pareil. Ce n'est pas le cas : le 1 de 1 000 vaut mille, soit plus que les neuf centaines, les neuf dizaines et les neuf unités de 999 réunies. La colonne la plus haute non vide tranche la comparaison.",
      marking: [
        "Affirme que les colonnes ont des valeurs différentes et ne comptent pas pareil.",
        "Identifie la colonne des unités de mille comme supérieure aux centaines, dizaines et unités réunies.",
        "Conclut que 1 000 est plus grand, de façon cohérente avec le raisonnement.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Une caisse affiche 1 050 et un ticket imprime 1 500. Un client dit que le ticket doit être faux parce que les deux nombres ont quatre chiffres et commencent pareil. Utilise la valeur de position pour expliquer lequel est le plus grand et pourquoi les chiffres ne tranchent pas.",
      whyItTransfers:
        "Le cadre est un ticket et non une fiche, et les deux nombres diffèrent dans une colonne facile à sauter. L'élève doit appliquer la règle des colonnes à une comparaison réelle plutôt qu'à un exercice écrit.",
      answer:
        "1 500 est plus grand, parce que le chiffre des centaines est 5 et non 0. Les deux ont 1 unité de mille, donc la décision passe aux centaines.",
      marking: [
        "Aligne les nombres par colonnes.",
        "Identifie la colonne des centaines comme celle qui diffère.",
        "Conclut que 1 500 est plus grand en parlant de la colonne et non du nombre de chiffres.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Que vaut le chiffre 8 dans 2 806 ?",
      answer: "Huit cents, parce qu'il occupe la colonne des centaines.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Écris quatre mille six en chiffres.",
      answer: "4 006, avec les colonnes des centaines et des dizaines vides.",
      when: "week-later",
    },
  ],

  summary: [
    "La valeur d'un chiffre vient de sa colonne : centaines, dizaines, unités, et ainsi de suite des deux côtés.",
    "Chaque colonne vaut dix fois celle de droite, c'est pourquoi un chiffre déplacé à gauche vaut dix fois plus.",
    "Un zéro tient une colonne ouverte ; le retirer décale les chiffres et change le nombre.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Les en-têtes de colonne sont annoncés avant les chiffres, de sorte que le chiffre et sa colonne s'entendent ensemble plutôt que comme une suite de symboles.",
    },
    {
      need: "dyslexia",
      alternative:
        "Les nombres longs sont groupés par colonnes avec un espacement visible, et la forme développée s'écrit une colonne par ligne.",
    },
    {
      need: "colour-vision",
      alternative:
        "Les blocs en base dix se distinguent par leur forme et par un nombre imprimé, jamais par la couleur seule.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Écrit pour OpenMind.",
      reproduction: "none",
      note: "Toutes les explications, exemples, exercices et évaluations de cette leçon sont originaux et appartiennent à OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution: "Périmètre cité d'après le contenu officiel de mathématiques du GCSE pour le nombre.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-04",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [
    {
      language: "fr",
      status: "machine",
      translator: "OpenMind translation pipeline",
      lessonVersion: "1.0.0",
    },
  ],
};

/** Whole translated lessons, keyed by language then concept. */
export const LESSON_TRANSLATIONS: Readonly<
  Record<string, Readonly<Record<string, AuthoredLesson>>>
> = {
  es: { "place-value": ES },
  fr: { "place-value": FR },
};

export const TRANSLATED_LANGUAGES: readonly string[] = Object.keys(LESSON_TRANSLATIONS);
