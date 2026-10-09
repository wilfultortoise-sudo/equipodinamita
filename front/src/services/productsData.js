export const INITIAL_CATEGORIAS = [
  { id: "1", nombre: "Ciencia Ficcion", slug: "ciencia-ficcion", icono: "", descripcion: "Historias de futuros tecnológicos y mundos alternos." },
  { id: "2", nombre: "Terror/Thriller", slug: "terror-thriller", icono: "", descripcion: "Novelas de suspenso, misterio y terror." },
  { id: "3", nombre: "Romance", slug: "romance", icono: "", descripcion: "Narrativas de amor, pasión y drama." },
  { id: "4", nombre: "Negocios", slug: "negocios", icono: "", descripcion: "Finanzas, liderazgo, emprendimiento y estrategia." },
  { id: "5", nombre: "Psicologia", slug: "psicologia", icono: "", descripcion: "Comportamiento humano, toma de decisiones y bienestar." }
];

export const INITIAL_PRODUCTOS = [
  {
    id: "1",
    titulo: "Dune",
    autor: "Frank Herbert",
    isbn: "978-0441172719",
    editorial: "Ace Books",
    precio: 499.0,
    precioAnterior: 599.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
    categoriaId: "1",
    stock: 20,
    descripcion: "La gran epopeya de Arrakis, el planeta desierto, la especia melange y el destino de Paul Atreides frente al Imperio.",
    paginas: 688,
    rating: 4.9,
    resenasCount: 310,
    destacado: true
  },
  {
    id: "2",
    titulo: "Fundacion",
    autor: "Isaac Asimov",
    isbn: "978-0553293357",
    editorial: "Bantam Spectra",
    precio: 450.0,
    precioAnterior: 520.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg",
    categoriaId: "1",
    stock: 14,
    descripcion: "La psicohistoria de Hari Seldon para preservar el conocimiento durante la inminente caída del Imperio Galáctico.",
    paginas: 296,
    rating: 4.8,
    resenasCount: 180,
    destacado: false
  },
  {
    id: "3",
    titulo: "Neuromante",
    autor: "William Gibson",
    isbn: "978-0441569595",
    editorial: "Ace Books",
    precio: 420.0,
    precioAnterior: 480.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780441569595-L.jpg",
    categoriaId: "1",
    stock: 10,
    descripcion: "La novela ciberpunk fundamental que definió el concepto de ciberespacio, la matrix e inteligencias artificiales rebeldes.",
    paginas: 320,
    rating: 4.7,
    resenasCount: 145,
    destacado: false
  },
  {
    id: "4",
    titulo: "El Resplandor",
    autor: "Stephen King",
    isbn: "978-0307743657",
    editorial: "Anchor",
    precio: 480.0,
    precioAnterior: 550.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780307743657-L.jpg",
    categoriaId: "2",
    stock: 12,
    descripcion: "Jack Torrance acepta cuidar el solitario Hotel Overlook durante el crudo invierno junto a su familia, con aterradoras consecuencias.",
    paginas: 464,
    rating: 4.9,
    resenasCount: 290,
    destacado: true
  },
  {
    id: "5",
    titulo: "Dracula",
    autor: "Bram Stoker",
    isbn: "978-0486411095",
    editorial: "Dover Publications",
    precio: 350.0,
    precioAnterior: 399.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780141439846-L.jpg",
    categoriaId: "2",
    stock: 18,
    descripcion: "La obra cumbre de la literatura gótica sobre el Conde Drácula y su oscuro viaje desde los Cárpatos de Transilvania a Londres.",
    paginas: 416,
    rating: 4.8,
    resenasCount: 220,
    destacado: false
  },
  {
    id: "6",
    titulo: "El Silencio de los Inocentes",
    autor: "Thomas Harris",
    isbn: "978-0312924584",
    editorial: "St. Martins Press",
    precio: 430.0,
    precioAnterior: 490.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780312924584-L.jpg",
    categoriaId: "2",
    stock: 8,
    descripcion: "Clarice Starling y su perturbadora colaboración con el brillante psiquiatra y caníbal Dr. Hannibal Lecter para atrapar a Buffalo Bill.",
    paginas: 368,
    rating: 4.8,
    resenasCount: 175,
    destacado: false
  },
  {
    id: "7",
    titulo: "Orgullo y Prejuicio",
    autor: "Jane Austen",
    isbn: "978-0141439518",
    editorial: "Penguin Classics",
    precio: 380.0,
    precioAnterior: 440.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
    categoriaId: "3",
    stock: 25,
    descripcion: "La historia inolvidable de amor, estatus y choque de voluntades entre Elizabeth Bennet y el orgulloso señor Darcy en la campiña inglesa.",
    paginas: 432,
    rating: 5.0,
    resenasCount: 410,
    destacado: true
  },
  {
    id: "8",
    titulo: "Bajo la Misma Estrella",
    autor: "John Green",
    isbn: "978-0525478812",
    editorial: "Dutton Books",
    precio: 320.0,
    precioAnterior: 380.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780525478812-L.jpg",
    categoriaId: "3",
    stock: 16,
    descripcion: "Una novela emotiva y luminosa sobre dos jóvenes que descubren el amor, la amistad y el sentido de la vida frente a la adversidad.",
    paginas: 336,
    rating: 4.7,
    resenasCount: 195,
    destacado: false
  },
  {
    id: "9",
    titulo: "Yo Antes de Ti",
    autor: "Jojo Moyes",
    isbn: "978-0143124541",
    editorial: "Pamela Dorman Books",
    precio: 360.0,
    precioAnterior: 420.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780670026609-L.jpg",
    categoriaId: "3",
    stock: 15,
    descripcion: "Louisa Clark entra como cuidadora en la vida de Will Traynor, forjando un lazo que transformará para siempre la perspectiva de ambos.",
    paginas: 384,
    rating: 4.8,
    resenasCount: 230,
    destacado: false
  },
  {
    id: "10",
    titulo: "Habitos Atomicos",
    autor: "James Clear",
    isbn: "978-0735211292",
    editorial: "Paidós",
    precio: 399.0,
    precioAnterior: 460.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    categoriaId: "4",
    stock: 30,
    descripcion: "Un método comprobado basado en la ciencia del comportamiento para consolidar pequeños cambios diarios que producen resultados extraordinarios.",
    paginas: 336,
    rating: 4.9,
    resenasCount: 520,
    destacado: true
  },
  {
    id: "11",
    titulo: "El Metodo Lean Startup",
    autor: "Eric Ries",
    isbn: "978-0307887894",
    editorial: "Deusto",
    precio: 450.0,
    precioAnterior: 520.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg",
    categoriaId: "4",
    stock: 18,
    descripcion: "Cómo construir empresas viables e innovadoras mediante experimentación continua, productos mínimos viables y retroalimentación ágil.",
    paginas: 320,
    rating: 4.7,
    resenasCount: 140,
    destacado: false
  },
  {
    id: "12",
    titulo: "De Cero a Uno",
    autor: "Peter Thiel",
    isbn: "978-0804139298",
    editorial: "Crown Business",
    precio: 410.0,
    precioAnterior: 470.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780804139298-L.jpg",
    categoriaId: "4",
    stock: 12,
    descripcion: "Notas y reflexiones sobre cómo crear empresas pioneras capaces de inventar cosas nuevas en vez de competir en mercados saturados.",
    paginas: 224,
    rating: 4.8,
    resenasCount: 160,
    destacado: false
  },
  {
    id: "13",
    titulo: "Pensar Rapido, Pensar Despacio",
    autor: "Daniel Kahneman",
    isbn: "978-0374533557",
    editorial: "Farrar Straus Giroux",
    precio: 520.0,
    precioAnterior: 600.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg",
    categoriaId: "5",
    stock: 14,
    descripcion: "El premio Nobel Daniel Kahneman revela los dos sistemas cognitivos que rigen las decisiones humanas: la intuición rápida y la razón analítica.",
    paginas: 512,
    rating: 4.9,
    resenasCount: 280,
    destacado: true
  },
  {
    id: "14",
    titulo: "El Hombre en Busca de Sentido",
    autor: "Viktor Frankl",
    isbn: "978-0807014271",
    editorial: "Beacon Press",
    precio: 299.0,
    precioAnterior: 350.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780807014295-L.jpg",
    categoriaId: "5",
    stock: 22,
    descripcion: "El testimonio conmovedor del psiquiatra Viktor Frankl en campos de concentración y los fundamentos de la logoterapia sobre la resiliencia.",
    paginas: 184,
    rating: 5.0,
    resenasCount: 490,
    destacado: false
  },
  {
    id: "15",
    titulo: "Inteligencia Emocional",
    autor: "Daniel Goleman",
    isbn: "978-0553383713",
    editorial: "Bantam Books",
    precio: 460.0,
    precioAnterior: 530.0,
    imagen: "https://covers.openlibrary.org/b/isbn/9780553383713-L.jpg",
    categoriaId: "5",
    stock: 16,
    descripcion: "Por qué la autoconciencia, la empatía y la gestión de impulsos son factores más determinantes para el éxito y bienestar que el coeficiente intelectual.",
    paginas: 384,
    rating: 4.8,
    resenasCount: 210,
    destacado: false
  }
];

export async function fetchCatalogData() {
  const query = `
    query ObtenerCatalogo {
      categorias {
        id
        nombre
        descripcion
        icono
        slug
      }
      productos {
        id
        titulo
        autor
        isbn
        editorial
        precio
        precioAnterior
        imagen
        categoriaId
        stock
        descripcion
        paginas
        rating
        resenasCount
        destacado
      }
    }
  `;

  try {
    const API_URL = (typeof process !== 'undefined' && process.env?.PUBLIC_API_URL) || 'http://localhost:4000/';
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data?.productos?.length > 0) {
        return {
          categorias: json.data.categorias,
          productos: json.data.productos
        };
      }
    }
  } catch (err) {
    // Modo offline durante build
  }

  return {
    categorias: INITIAL_CATEGORIAS,
    productos: INITIAL_PRODUCTOS
  };
}
