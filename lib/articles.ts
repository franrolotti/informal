export type Category = "Economía" | "Cultura" | "Sociedad";

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[] };

export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  author: string;
  date: string; // ISO
  readingMinutes: number;
  gradient: string; // CSS gradient para la portada
  featured?: boolean;
  body: Block[];
}

export const articles: Article[] = [
  {
    slug: "argentina-racismo-mundial-2026",
    title: "¿Es Argentina un país racista?",
    subtitle:
      "Un análisis en frío de lo que pasó en el Mundial 2026 y por qué la respuesta honesta es más incómoda —y más interesante— que un titular.",
    category: "Sociedad",
    author: "Redacción Informal",
    date: "2026-07-22",
    readingMinutes: 11,
    gradient:
      "linear-gradient(135deg, #7cc4ff 0%, #a5d8ff 45%, #ffe8a3 100%)",
    featured: true,
    body: [
      {
        type: "p",
        text: "Cada Mundial, además de campeones, produce acusaciones. La de 2026 volvió a colocar a la Argentina en el banquillo de la opinión pública internacional: cánticos de la Selección resucitados, virales sacados de contexto y una condena que llegó antes que cualquier dato. La pregunta que quedó flotando fue simple y explosiva: ¿es Argentina un país particularmente racista?",
      },
      {
        type: "p",
        text: "En Informal creemos que la pregunta merece algo más que indignación. Merece evidencia. Y cuando uno se toma el trabajo de mirar los números, las comparaciones internacionales y el contexto, la conclusión es incómoda para todos los bandos: Argentina no es un país libre de racismo —ningún país lo es—, pero tampoco hay razones para ubicarla como un caso extremo frente al resto del mundo. Es, en el mejor de los sentidos, un país promedio en un planeta que tiene un problema.",
      },
      { type: "h2", text: "Qué pasó realmente en 2026" },
      {
        type: "p",
        text: "Conviene separar tres cosas que la discusión mezcla permanentemente: los cánticos de una parte de la hinchada, las declaraciones puntuales de algunos jugadores en la euforia, y la conducta de un país de cuarenta y seis millones de personas. Tratar a los tres como sinónimos es cómodo para el titular, pero es un error de razonamiento básico: la parte no es el todo.",
      },
      {
        type: "p",
        text: "Un cántico de tribuna, por reprochable que sea, no es una política de Estado ni una encuesta representativa de valores. Es exactamente lo que es: el comportamiento de un subconjunto en un contexto de rivalidad extrema. La evidencia de xenofobia en el fútbol existe en Inglaterra, Italia, España, Francia y prácticamente en cada liga con hinchadas masivas. Señalar solo a una y silenciar al resto no es antirracismo: es selección de datos.",
      },
      { type: "h2", text: "El argumento comparativo" },
      {
        type: "p",
        text: "La afirmación 'Argentina es racista' solo tiene sentido si es comparativa: racista ¿respecto de qué? La ciencia social tiene formas imperfectas pero útiles de medir esto. Una de las más citadas es la World Values Survey, que durante décadas preguntó a la gente de decenas de países a quién no querría tener como vecino. La respuesta 'personas de otra raza' funciona como un termómetro tosco de prejuicio abierto.",
      },
      {
        type: "p",
        text: "En esas mediciones, los países de América Latina —Argentina incluida— suelen ubicarse en niveles bajos a intermedios de rechazo declarado, muy por debajo de varios países de Asia y de algunas naciones europeas y de Medio Oriente. No es un pergamino de inocencia: las encuestas de actitudes tienen sesgos y el prejuicio también se esconde. Pero sí desmiente la idea de que Argentina sea un caso singular o extremo. No lo es.",
      },
      {
        type: "quote",
        text: "El prejuicio humano es universal; lo que varía es su forma, su blanco y su grado de tolerancia social. Convertir a un país en la excepción moral del planeta suele decir más de quien acusa que del acusado.",
      },
      { type: "h2", text: "Por qué se malinterpreta el caso argentino" },
      {
        type: "list",
        items: [
          "Idioma y visibilidad: los cánticos en español se viralizan con subtítulos y sin contexto cultural, lo que amplifica la lectura literal por sobre la irónica o rivalística.",
          "El sesgo del ganador: los equipos exitosos concentran atención y resentimiento. La Argentina campeona es un blanco más grande que un seleccionado eliminado en fase de grupos.",
          "Homogeneidad aparente: la inmigración europea de fines del siglo XIX y XX moldeó una imagen de país 'blanco' que invisibiliza su enorme mestizaje y sus comunidades indígenas, afro y migrantes latinoamericanas.",
          "Doble vara mediática: conductas idénticas en hinchadas europeas se archivan como 'incidentes aislados' y en las sudamericanas como 'rasgos culturales'.",
        ],
      },
      { type: "h2", text: "Lo que sí es cierto" },
      {
        type: "p",
        text: "Nada de esto es una absolución. En Argentina existen el racismo estructural hacia pueblos originarios, la discriminación a migrantes de países limítrofes y un clasismo que muchas veces usa la palabra 'negro' como insulto social más que racial. Reconocerlo es parte de tomarse el problema en serio. Pero reconocer un problema real es distinto de aceptar una caricatura. La caricatura —'el país más racista'— es falsa y, encima, contraproducente: convierte una conversación necesaria en una pelea de identidades nacionales.",
      },
      { type: "h2", text: "La conclusión de Informal" },
      {
        type: "p",
        text: "Argentina no es un paraíso pos-racial ni un infierno de odio. Es un país con los prejuicios de su época y su historia, ni más ni menos que sus pares. Lo honesto no es preguntarse si Argentina es racista —todo país lo es en algún grado— sino si es más racista que los demás. Y a esa pregunta, con los datos disponibles, la respuesta es no. El resto es marketing moral de temporada mundialista.",
      },
    ],
  },
  {
    slug: "editorial-por-que-informal",
    title: "Por qué existe Informal",
    subtitle:
      "Análisis económico riguroso y opinión sin corrección de temporada. Nuestra declaración de principios.",
    category: "Cultura",
    author: "Redacción Informal",
    date: "2026-07-20",
    readingMinutes: 4,
    gradient:
      "linear-gradient(135deg, #ffd6a5 0%, #ffc3a0 50%, #ff9a9e 100%)",
    body: [
      {
        type: "p",
        text: "Informal nace de una molestia productiva: la sensación de que buena parte del debate público confunde volumen con argumento. Queremos hacer lo contrario. Economía con datos, cultura con criterio y sociedad sin miedo a la incomodidad.",
      },
      { type: "h2", text: "Tres reglas" },
      {
        type: "list",
        items: [
          "El dato manda. Si una afirmación no resiste una fuente, no la publicamos como hecho.",
          "La opinión se firma y se defiende, no se disfraza de neutralidad.",
          "Nada es demasiado incómodo para pensarlo en voz alta, si se piensa bien.",
        ],
      },
      {
        type: "p",
        text: "Si buscás confirmación de lo que ya creés, hay lugares más cómodos. Si buscás argumentos, bienvenido.",
      },
    ],
  },
  {
    slug: "inflacion-y-expectativas",
    title: "Inflación: la guerra por las expectativas",
    subtitle:
      "Por qué lo que la gente cree que va a pasar con los precios importa tanto como lo que efectivamente pasa.",
    category: "Economía",
    author: "Redacción Informal",
    date: "2026-07-18",
    readingMinutes: 8,
    gradient:
      "linear-gradient(135deg, #b5ead7 0%, #c7f0e0 50%, #a5d8ff 100%)",
    body: [
      {
        type: "p",
        text: "En macroeconomía hay pocas variables tan escurridizas y tan decisivas como las expectativas. Un plan de estabilización puede tener los números fiscales correctos y aun así fracasar si nadie cree que va a sostenerse. Y puede tener números frágiles y funcionar un tiempo si la gente decide creer.",
      },
      { type: "h2", text: "El componente de credibilidad" },
      {
        type: "p",
        text: "La inflación no es solo un fenómeno monetario en el sentido estrecho: es también una convención social sobre cuánto van a valer las cosas mañana. Romper una inercia inflacionaria requiere tanto disciplina fiscal como un relato creíble sobre el futuro. Los programas que ignoran la segunda pata suelen pagar el costo.",
      },
      {
        type: "quote",
        text: "Estabilizar precios es, en el fondo, coordinar creencias. La política monetaria es la herramienta; la confianza es el resultado.",
      },
      {
        type: "p",
        text: "En próximas entregas vamos a desarmar, con datos, los distintos intentos argentinos de anclar expectativas y por qué unos duraron y otros no.",
      },
    ],
  },
  {
    slug: "cultura-del-scroll",
    title: "La cultura del scroll infinito",
    subtitle:
      "Cómo el diseño de las plataformas reescribió nuestra atención —y qué podemos recuperar.",
    category: "Cultura",
    author: "Redacción Informal",
    date: "2026-07-15",
    readingMinutes: 6,
    gradient:
      "linear-gradient(135deg, #cdb4f6 0%, #d8c5ff 50%, #a5d8ff 100%)",
    body: [
      {
        type: "p",
        text: "El scroll infinito no es una casualidad tecnológica: es una decisión de diseño con incentivos económicos detrás. Entender esos incentivos es el primer paso para no ser gobernado por ellos.",
      },
      { type: "h2", text: "El precio de la atención gratis" },
      {
        type: "p",
        text: "Cuando el producto es gratis, la atención es la mercancía. Nada de esto es nuevo, pero la escala sí lo es. Lo interesante no es demonizar la herramienta sino preguntarse qué hábitos queremos recuperar deliberadamente.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getFeatured(): Article {
  return articles.find((a) => a.featured) ?? articles[0];
}

export function byCategory(category: Category): Article[] {
  return articles.filter((a) => a.category === category);
}

export const categories: Category[] = ["Economía", "Cultura", "Sociedad"];
