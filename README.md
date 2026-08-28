# EliDate — Invitación romántica estilo Instagram

SPA ligera en HTML, CSS y JavaScript vanilla que simula la interfaz de Instagram con historias interactivas y trivia.

## Vista local

Abre `index.html` en el navegador o usa un servidor local:

```bash
# Python 3
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Luego visita `http://localhost:8080`.

## Personalizar imágenes

Reemplaza los archivos en `assets/images/` (o cambia las rutas en `js/app.js`):

| Archivo placeholder | Uso |
|---------------------|-----|
| `placeholder-perfil.svg` | Avatar del perfil en historias |
| `placeholder-historia-1.svg` … `4.svg` | Fondos de historias 1–4 |
| `placeholder-bosque.svg` | Fondo de la invitación final |

Busca comentarios `REEMPLAZA` en `index.html` y `js/app.js`.

## Personalizar trivia

Edita el array `stories` en [`js/app.js`](js/app.js) con tus preguntas, respuestas e imágenes.

## Persistencia

El progreso se guarda en `localStorage` bajo la clave `elidate-story-progress` (respuestas, quizzes completados, historia actual y si aceptó la invitación).

## Deploy en GitHub Pages

1. Crea un repositorio en GitHub y sube este proyecto.
2. Ve a **Settings → Pages**.
3. En **Source**, elige **Deploy from a branch**.
4. Selecciona la rama `main` y la carpeta `/ (root)`.
5. Guarda. En unos minutos estará disponible en:

   `https://<tu-usuario>.github.io/EliDate/`

Todas las rutas son relativas; no se requiere build ni configuración extra. El archivo `.nojekyll` evita conflictos con Jekyll.

## Estructura

```
EliDate/
├── index.html
├── css/style.css
├── js/app.js
├── assets/images/
├── .nojekyll
└── README.md
```
