# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-08-06
> **Objetivo:** Portar el prototipo estático de `references/templates/` a seis pantallas de Next.js App Router, solo capa visual, sin motor de juego.

---

## Alcance

**Dentro:**

- Seis rutas de App Router: `/` (landing), `/biblioteca`, `/juego/[id]`, `/juego/[id]/jugar`, `/acceso`, `/salon`.
- `app/juego/[id]/not-found.tsx` con estética arcade para IDs inexistentes, disparado con `notFound()`.
- Nav compartido en `app/layout.tsx`: logo → `/`, enlaces `Inicio`, `Biblioteca`, `Salón de la Fama`, contador de créditos, botón de sesión y panel móvil deslizante.
- Pie de página compartido (`© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`).
- `lib/games.ts` con `GAMES`, `CATS` y el tipo `Game`; `lib/scores.ts` con `seededScores` y el tipo `ScoreRow`.
- Sesión falsa en `localStorage` (`av_user`): `/acceso` acepta cualquier entrada, el nav refleja el usuario, cerrar sesión lo borra.
- Puntuaciones falsas en `localStorage` (`av_scores`): el modal de fin de partida las guarda.
- Simulación del reproductor: puntuación que sube por `setInterval`, vidas, nivel, pausa, botón FIN y modal de guardado.
- Reutilización de `app/globals.css` tal cual: los componentes usan las clases `av-*` existentes.
- Todas las páginas son Server Components finos que renderizan un componente cliente por pantalla.

**Fuera de alcance (para specs futuras):**

- Cualquier motor de juego real. Ningún juego es jugable.
- Backend, base de datos, autenticación real, OAuth. Los botones `GOOGLE` y `GITHUB` son decorativos.
- Puntuaciones reales: las tablas siguen generándose con `seededScores`, no leen `av_scores`.
- Landing ampliada (destacados, teaser del salón, CTA de registro).
- Traducir `globals.css` a utilidades Tailwind. La configuración `@theme inline` ya existe pero no se fuerza su uso.
- Tests, accesibilidad auditada, SEO más allá del `metadata` ya presente en `layout.tsx`.
- Página de cuenta o perfil. El enlace `Cuenta` del panel móvil apunta a `/acceso`.

---

## Modelo de datos

### `lib/games.ts`

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;          // slug de la ruta: /juego/bloque-buster
  title: string;       // "BLOQUE BUSTER"
  short: string;       // una línea, tarjeta de la biblioteca
  long: string;        // párrafo, pantalla de detalle
  cat: GameCategory;
  cover: string;       // clase CSS del gradiente: "cover-bricks"
  color: GameColor;    // variante del botón JUGAR
  best: number;
  plays: string;       // preformateado: "12.4K"
};

export const GAMES: Game[] = [/* los 8 juegos de data.jsx, sin cambios */];
export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;
export type CatFilter = (typeof CATS)[number];

export function getGame(id: string): Game | undefined;
```

### `lib/scores.ts`

```ts
export type ScoreRow = {
  rank: number;
  name: string;   // "PX_KAI"
  score: number;
  date: string;   // "07/03/2026", formato dd/mm/yyyy ya formateado
};

export const PLAYERS: string[];  // los 18 alias de data.jsx

// Determinista: misma semilla, mismas filas. Sin Math.random.
export function seededScores(seed: number, count?: number): ScoreRow[];
```

Semillas usadas, idénticas al prototipo:

- Detalle: `seededScores(id.length * 17 + 3, 10)`
- Salón: `seededScores(idPestaña.length * 23 + 7, 12)`

### Estado en `localStorage`

```ts
// Clave "av_user"
type StoredUser = { name: string };  // mayúsculas, máx. 10 caracteres

// Clave "av_scores"
type StoredScore = { game: string; score: number; name: string; at: number };
```

Convenciones:

- Números al usuario siempre con `toLocaleString("es-ES")`.
- Rangos y niveles con relleno de cero a dos dígitos: `#07`, `NIVEL 03`.
- La sesión se lee en un `AuthProvider` cliente montado en `app/layout.tsx`; `localStorage` no se toca durante el render del servidor.

---

## Plan de implementación

Cada paso deja la aplicación arrancable con `npm run dev` y es committeable por separado.

**Paso 0 — Verificación previa (no genera código).** Leer `node_modules/next/dist/docs/01-app/03-api-reference/` para `params` de rutas dinámicas, `notFound()` y `generateMetadata`. En Next 16 `params` es una Promise: las páginas dinámicas deben ser `async` y hacer `await params`. No escribir rutas dinámicas antes de confirmarlo en la documentación local.

1. **Capa de datos.** Crear `lib/games.ts` (tipos `Game`, `GameCategory`, `GameColor`, constantes `GAMES` y `CATS`, función `getGame`) y `lib/scores.ts` (tipo `ScoreRow`, `PLAYERS`, `seededScores`). Portar los 8 juegos y los 18 alias de `references/templates/data.jsx` sin cambiar ningún valor. Verificación: `npx tsc --noEmit` sin errores.

2. **Contexto de sesión.** Crear `components/auth-provider.tsx` (cliente): estado `user`, funciones `signIn(name)` y `signOut()`, lectura de `av_user` en `useEffect`, escritura en cada cambio. Envolver los `children` en `app/layout.tsx`. Verificación: la app arranca igual que antes, sin errores de hidratación en consola.

3. **Chrome compartido.** Crear `components/nav.tsx` (cliente: enlace activo, panel móvil, botón de sesión desde el contexto) y `components/site-footer.tsx` (servidor). Montarlos en `app/layout.tsx` alrededor de `<main className="av-main">`. Verificación: nav y pie visibles en cualquier ruta; por debajo de 840 px aparece la hamburguesa y el panel deslizante.

4. **Landing.** Reescribir `app/page.tsx`: hero `ARCADE VAULT` con `flicker`, subtítulo `INSERTA UNA MONEDA PARA JUGAR _` parpadeante y botón `ENTRAR AL VAULT` con `<Link href="/biblioteca">`. Borrar el scaffold de `create-next-app` y el import de `next/image`. Verificación: `/` muestra el hero y el botón navega a `/biblioteca`.

5. **Biblioteca.** Crear `components/game-card.tsx` (cliente, efecto tilt con `useRef` y `onMouseMove`) y `components/library-browser.tsx` (cliente: buscador, chips de categoría, grid filtrado, estado `NO HAY RESULTADOS`). Crear `app/biblioteca/page.tsx` como Server Component que pasa `GAMES` y `CATS`. Título compacto `BIBLIOTECA`, sin hero. Verificación: escribir `ser` deja solo `SERPENTINA`; el chip `PUZZLE` deja solo `CAÍDA`; una búsqueda sin resultados muestra el vacío.

6. **Detalle.** Crear `app/juego/[id]/page.tsx` (async, `await params`, `notFound()` si el id no existe, `generateMetadata` con el título del juego), `components/leaderboard.tsx` (servidor, 10 filas de `seededScores(id.length * 17 + 3, 10)`) y `app/juego/[id]/not-found.tsx` con estética arcade. Verificación: `/juego/caida` muestra portada, etiquetas, párrafo largo, tira de estadísticas y tabla; `/juego/xxx` muestra el 404.

7. **Reproductor.** Crear `components/game-player.tsx` (cliente: HUD con jugador/puntuación/vidas/nivel, arena CRT con enemigos y nave, superposición de pausa, franja inferior, modal de fin con guardado en `av_scores`) y `app/juego/[id]/jugar/page.tsx` (async, `notFound()` si el id no existe). Verificación: la puntuación sube cada 220 ms, `PAUSA` la congela y muestra `EN PAUSA`, `FIN` abre el modal, `GUARDAR PUNTUACIÓN` muestra `▸ PUNTUACIÓN GUARDADA_` y `JUGAR DE NUEVO` reinicia a 0.

8. **Acceso.** Crear `components/auth-form.tsx` (cliente: pestañas `INICIAR SESIÓN` / `CREAR CUENTA`, campo de correo solo en `CREAR CUENTA`, envío que llama a `signIn` y redirige a `/biblioteca`, botón de invitado, botones sociales decorativos) y `app/acceso/page.tsx`. Verificación: enviar el formulario cambia el botón del nav al nombre en mayúsculas; pulsarlo cierra sesión y vuelve a `Iniciar Sesión`.

9. **Salón de la Fama.** Crear `components/hall-of-fame.tsx` (cliente: pestañas por juego, podio plata/oro/bronce, tabla de 12 filas con animación escalonada, filas `▸ TU MEJOR MARCA EN …` y la fila amarilla solo si hay sesión) y `app/salon/page.tsx`. Verificación: cambiar de pestaña cambia las filas; sin sesión no aparece la fila amarilla.

10. **Ajustes de estilos.** Añadir a `app/globals.css` únicamente lo que las pantallas nuevas necesiten y no exista: título compacto de la biblioteca, bloque del 404 arcade y estado activo del enlace `Inicio`. No modificar ninguna regla portada del prototipo.

11. **Pasada de `/frontend-design`.** Revisar las seis pantallas: estados de foco visibles en teclado, comportamiento entre 360 px y 1440 px, y contraste de los textos `--ink-faint`. Aplicar solo correcciones que no alteren la fidelidad 1:1 acordada.

---

## Criterios de aceptación

**Compilación y tipos**

- [ ] `npm run build` termina sin errores.
- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `app/page.tsx` no importa `next/image` ni contiene texto del scaffold de `create-next-app`.

**Rutas**

- [ ] `/` responde 200 y muestra el hero `ARCADE VAULT`.
- [ ] `/biblioteca` responde 200 y muestra las 8 tarjetas.
- [ ] `/juego/bloque-buster` responde 200 y muestra el título `BLOQUE BUSTER`.
- [ ] `/juego/no-existe` responde 404 y renderiza `app/juego/[id]/not-found.tsx`.
- [ ] `/juego/caida/jugar` responde 200 y muestra el marco CRT.
- [ ] `/acceso` y `/salon` responden 200.
- [ ] El pie de página aparece en las seis rutas.

**Navegación**

- [ ] El logo del nav navega a `/`.
- [ ] `Biblioteca` está resaltado en `/biblioteca`, `/juego/[id]` y `/juego/[id]/jugar`.
- [ ] `Salón de la Fama` está resaltado solo en `/salon`.
- [ ] Por debajo de 840 px el nav muestra la hamburguesa y ocultan los enlaces horizontales.
- [ ] Pulsar la hamburguesa abre el panel lateral; pulsar el fondo lo cierra.

**Biblioteca**

- [ ] Escribir `ser` en el buscador deja visible solo `SERPENTINA`.
- [ ] El chip `PUZZLE` deja visible solo `CAÍDA`.
- [ ] El chip `TODOS` está activo al cargar.
- [ ] Buscar `zzz` muestra `NO HAY RESULTADOS`.
- [ ] Pulsar una tarjeta navega a `/juego/<id>`.
- [ ] Las puntuaciones se muestran con separador de miles español (`28.450`).

**Detalle**

- [ ] La tabla lateral muestra 10 filas.
- [ ] Recargar `/juego/caida` produce exactamente las mismas 10 filas.
- [ ] `▶ JUGAR AHORA` navega a `/juego/caida/jugar`.
- [ ] `VOLVER AL VAULT` navega a `/biblioteca`.
- [ ] La pestaña del navegador muestra el título del juego.

**Reproductor**

- [ ] La puntuación aumenta sola tras cargar la pantalla.
- [ ] `PAUSA` detiene el incremento y muestra la capa `EN PAUSA`.
- [ ] `REANUDAR` reanuda el incremento.
- [ ] `FIN` abre el modal `FIN DEL JUEGO` con la puntuación final.
- [ ] `GUARDAR PUNTUACIÓN` sustituye el campo por `▸ PUNTUACIÓN GUARDADA_` y añade una entrada a `av_scores` en `localStorage`.
- [ ] `JUGAR DE NUEVO` cierra el modal y reinicia puntuación a 0, vidas a 3 y nivel a 01.
- [ ] Sin sesión, el campo de nombre arranca en `INVITADO`.

**Sesión**

- [ ] Enviar el formulario de `/acceso` con `px_kai` redirige a `/biblioteca` y el nav muestra `PX_KAI ▾`.
- [ ] Recargar cualquier página mantiene la sesión.
- [ ] Pulsar el botón del usuario cierra sesión y el nav vuelve a `Iniciar Sesión`.
- [ ] `JUGAR COMO INVITADO` navega a `/biblioteca` sin crear sesión.
- [ ] La pestaña `CREAR CUENTA` añade el campo de correo; `INICIAR SESIÓN` lo oculta.

**Salón de la Fama**

- [ ] El podio muestra los rangos 02, 01 y 03 en ese orden visual.
- [ ] La tabla muestra 12 filas.
- [ ] Cambiar de pestaña cambia las filas y el podio.
- [ ] Sin sesión no aparece la fila `▸ TU MEJOR MARCA EN …`.
- [ ] Con sesión aparece esa fila con el nombre del usuario en amarillo.

**Fidelidad e hidratación**

- [ ] Ninguna pantalla produce advertencias de hidratación en la consola del navegador.
- [ ] Las seis pantallas usan las clases `av-*` de `app/globals.css`; no se reescribe el prototipo con utilidades Tailwind.
- [ ] Comparadas contra `references/templates/Arcade Vault.html` abierto en el navegador, las pantallas coinciden en estructura, copia y colores.

---

## Decisiones

**Rutas**

- **Sí:** segmentos de App Router en español (`/juego/[id]`, `/acceso`, `/salon`). URLs compartibles y coherentes con la interfaz, que es toda en español.
- **No:** replicar el hash-router del prototipo en un único `page.tsx` cliente. Anula el App Router y deja las pantallas sin URL propia.
- **No:** segmentos en inglés. Mezclar idiomas entre URL e interfaz sin ninguna ventaja a cambio.

**Landing**

- **Sí:** landing propia en `/` con el hero del prototipo y un botón hacia `/biblioteca`. Da a la raíz una identidad sin inventar contenido que no existe en `references/templates/`.
- **Sí:** biblioteca sin hero, con título compacto `BIBLIOTECA`. Repetir el hero en dos rutas seguidas lo convierte en ruido.
- **No:** landing ampliada con destacados, teaser del salón y CTA de registro. Es diseño nuevo, no un port; va en su propia spec.

**Estilos**

- **Sí:** reutilizar `app/globals.css` tal cual, con las clases `av-*`. Las 975 líneas ya están portadas y verificadas contra el prototipo; reescribirlas es trabajo sin beneficio y con riesgo de deriva visual.
- **No:** traducir el prototipo a utilidades Tailwind. Los bloques `@theme inline` quedan disponibles para código nuevo, pero nada obliga a usarlos aquí.
- **Sí:** concentrar los añadidos de CSS en un único paso final. Evita reglas huérfanas repartidas por el historial.

**Componentes**

- **Sí:** páginas Server Component finas que delegan en un componente cliente por pantalla. Mantiene el árbol de servidor intacto y aísla `"use client"` donde de verdad hace falta.
- **No:** `"use client"` directo en cada `page.tsx`. Arrastra toda la página al cliente para nada.

**Sesión**

- **Sí:** sesión falsa en `localStorage` bajo `av_user`, sin validación. Es exactamente lo que hace el prototipo y el MVP es solo visual.
- **Sí:** leer `localStorage` en `useEffect`, con `user` arrancando en `null`. Leerlo durante el render rompería la hidratación.
- **Sí:** aceptar el parpadeo del botón del nav (`Iniciar Sesión` antes del nombre). Reservar hueco añade complejidad por un detalle de milisegundos en un MVP visual.
- **No:** autenticación real, OAuth o backend. Otra spec, si llega.

**Datos**

- **Sí:** `lib/games.ts` y `lib/scores.ts` con tipos TypeScript explícitos. Los datos son la única parte compartida por las seis pantallas.
- **Sí:** mantener `seededScores` determinista y con los mismos multiplicadores del prototipo (`*17+3`, `*23+7`). Servidor y cliente generan filas idénticas, sin desajuste de hidratación.
- **Sí:** escribir `av_scores` sin leerlo nunca. Replica el comportamiento del prototipo; leerlo implicaría fusionar puntuaciones reales con las generadas, lo cual es una feature, no un port.
- **No:** `Math.random` en cualquier punto del renderizado. Garantiza el desajuste de hidratación.

**Errores**

- **Sí:** `notFound()` más `app/juego/[id]/not-found.tsx` con estética arcade. Un id inválido devuelve 404 real, no una pantalla en blanco.
- **No:** el `return null` del prototipo. Página vacía con código 200: peor para el usuario y para los buscadores.

**Proceso**

- **Sí:** fidelidad 1:1 con el prototipo; `/frontend-design` solo revisa foco, responsive y contraste al final. El prototipo ya es la especificación visual aprobada.
- **No:** reinterpretar la dirección visual. Convierte la revisión en una discusión de gustos en lugar de una comparación contra una referencia.
- **Sí:** leer la documentación local de Next 16 antes de escribir rutas dinámicas. `params` es una Promise en esta versión y la firma antigua no compila.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `params` como Promise en Next 16 rompe las rutas dinámicas escritas con la firma antigua | Paso 0 obligatorio: leer `node_modules/next/dist/docs/01-app/03-api-reference/` antes de escribir `app/juego/[id]/`. Las páginas dinámicas son `async` y hacen `await params`. |
| Desajuste de hidratación al leer `localStorage` | `AuthProvider` arranca en `null` y lee en `useEffect`. Ningún componente lee `localStorage` durante el render. |
| El efecto tilt de las tarjetas escribe `style.transform` en cada `mousemove` | Se mantiene igual que el prototipo, sobre `transform` (compuesto por GPU). Si aparece jank, se revisa en el paso 11, no antes. |
| El `setInterval` del reproductor sigue corriendo al salir de la pantalla | El `useEffect` devuelve `clearInterval`. Verificar además que el intervalo se detiene con `paused` y con `over`. |
| Divergencia visual silenciosa respecto al prototipo | El último criterio de aceptación exige comparación lado a lado con `references/templates/Arcade Vault.html` abierto en el navegador. |
| Clases `av-*` huérfanas o duplicadas tras el paso 10 | Los añadidos de CSS se concentran en un solo paso y no se modifica ninguna regla portada. |

---

## Qué **no** está en esta spec

- Ningún juego jugable. Cero motores, cero bucles de render, cero canvas.
- Backend, base de datos y autenticación real. Los botones `GOOGLE` y `GITHUB` no hacen nada.
- Puntuaciones reales o persistentes: las tablas siguen saliendo de `seededScores`.
- Landing ampliada: destacados, teaser del Salón de la Fama, CTA de registro.
- Traducción de `globals.css` a utilidades Tailwind.
- Página de cuenta o perfil de usuario.
- Tests automatizados y auditoría de accesibilidad.

Cada uno de esos, si llega, va en su propia spec.
