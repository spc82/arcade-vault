# SPEC 02 — Home de Arcade Vault

> **Estado:** Implementado
> **Depende de:** `01-mvp-visual.md` (Implementado)
> **Fecha:** 2026-08-20
> **Objetivo:** Sustituir la landing mínima de `/` por el home completo de seis secciones de `references/templates/home-about/home.jsx`, sin tocar la página About.

---

## Alcance

**Dentro:**

- Reescritura de `app/page.tsx`: Server Component fino que renderiza `<HomeLanding />`. Se borra el hero actual (`ARCADE VAULT` + `ENTRAR AL VAULT`).
- `components/home-landing.tsx` (cliente) con las seis secciones del template, en este orden:
  1. **Hero** — eyebrow `▸ INSERTA UNA MONEDA_`, título en tres líneas, subtítulo, dos CTA, indicador `DESLIZA ▼`, silhouettes flotantes de fondo.
  2. **`// 01` ¿POR QUÉ ARCADE VAULT?** — cuatro `feature-card` con icono pixel SVG.
  3. **`// 02` JUEGOS DISPONIBLES AHORA** — `mini-rail` con los seis primeros de `GAMES` + botón a `/biblioteca`.
  4. **Franja de estadísticas** — tres `stat-block`.
  5. **`// 03` ACTIVIDAD EN VIVO** — ticker de siete puntuaciones + top cinco jugadores con barras y podio oro/plata/bronce.
  6. **`// 04` PRECIOS** — `price-card` de plan único gratuito con sello `FREE PLAY` y tres FAQ.
  7. **CTA final** — `¿LISTO PARA JUGAR?` + `INSERTAR MONEDA →`.
- `components/home-decor.tsx` (servidor): `FloatingSilhouettes` (ocho SVG pixel) y `FeatureIcon` (`GAMEPAD`, `FREE`, `TROPHY`, `ROCKET`).
- `lib/home.ts`: constantes tipadas `FEATURES`, `HOME_STATS`, `TICKER`, `TOP_TODAY`, `PRICING_PERKS`, `FAQ`.
- Hook `useReveal` (IntersectionObserver, `threshold: 0.12`, `unobserve` tras entrar) dentro de `components/home-landing.tsx`.
- Añadido a `app/globals.css` del bloque de home del `styles.css` del template, verbatim, más tres bloques propios al final del archivo: `prefers-reduced-motion` para el home, y dos correcciones de responsive detectadas en el paso 9.
- Enlaces con `next/link` a `/biblioteca`, `/acceso`, `/salon` y `/juego/<id>` desde las `mini-card`.

**Fuera de alcance:**

- **La página About en cualquier forma.** No se crea `/acerca`, no se porta `about.jsx`, no se añade el enlace `Acerca de` al nav ni al panel móvil, y no se copia al CSS ningún bloque `about-*`, `gp-*`, `contact-*`, `term-*`, `div-*`, `lg-*`, `highlight*`, `score-pop`, `rivet`, `screw`.
- `.live-led` y su `@keyframes pulse-led`. Están físicamente dentro del rango ACTIVITY que sí se copia, pero no los usa **ningún** template (`grep -c live-led` da `0` en `home.jsx` y en `about.jsx`): son CSS huérfano. Se excluyen a mano.
- Cambios en `components/nav.tsx` y `components/site-footer.tsx`. El nav se queda con Inicio · Biblioteca · Salón de la Fama.
- Cambios en `lib/games.ts`, `lib/scores.ts` y en las otras cinco pantallas.
- Datos reales: ticker, top de hoy y estadísticas son constantes fijas. No leen `av_scores` ni `seededScores`.
- Variación de los CTA según sesión. `CREAR CUENTA` y `EMPEZAR GRATIS →` apuntan siempre a `/acceso`.
- Filas de ticker clicables.
- Acordeón en las FAQ. Texto estático.
- Traducción de las reglas nuevas a utilidades Tailwind.
- Tests automatizados y auditoría de accesibilidad completa.

---

## Modelo de datos

Ningún dato nuevo se persiste. `lib/home.ts` solo contiene constantes de presentación, con los valores exactos del template.

```ts
import type { GameColor } from "@/lib/games";  // "cyan" | "magenta" | "yellow" | "green"

export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export type Feature = {
  icon: FeatureIconKind;
  title: string;   // "JUEGOS CLÁSICOS"
  desc: string;
  color: GameColor;
};

export type HomeStat = {
  number: string;  // "12+", "MILES", "GLOBAL"
  unit: string;    // "JUEGOS"
  sub: string;     // "Y CONTANDO"
};

export type TickerRow = {
  player: string;  // "NEONFOX"
  game: string;    // "Caída" — texto plano, no enlaza
  score: number;   // 184220
  ago: string;     // "hace 2 min"
  color: GameColor;
};

export type TopRow = {
  rank: number;    // 1..5
  player: string;
  score: number;
};

export type FaqItem = { q: string; a: string };

export const FEATURES: Feature[];        // 4 entradas
export const HOME_STATS: HomeStat[];     // 3 entradas
export const TICKER: TickerRow[];        // 7 entradas
export const TOP_TODAY: TopRow[];        // 5 entradas
export const PRICING_PERKS: string[];    // 6 líneas, con el "✔ " incluido
export const FAQ: FaqItem[];             // 3 entradas
```

Convenciones heredadas de la spec 01:

- Puntuaciones al usuario con `toLocaleString("es-ES")`. El ticker las prefija con `+`, el top no.
- Rangos con relleno de cero a dos dígitos: `#01` … `#05`.
- Nada de `Math.random` ni `Date.now()` en el render. Los tiempos (`hace 2 min`) son cadenas fijas.
- El ancho de la barra de `TOP_TODAY` se calcula en el render como `100 - i * 16` por ciento; no se almacena.
- Los seis juegos del `mini-rail` salen de `GAMES.slice(0, 6)` de `lib/games.ts`: `bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `rocas`.
- Las clases de color se componen igual que en el template: `"feature-card " + color`, `"neon-" + color`.

---

## Plan de implementación

Cada paso deja la aplicación arrancable con `npm run dev` y es committeable por separado.

**Paso 0 — Verificación previa (no genera código).** Confirmar que `app/page.tsx` no necesita `generateMetadata` propio: `app/layout.tsx` ya define el `metadata` del sitio. No hay rutas dinámicas nuevas, así que no aplica el asunto de `params` como Promise de Next 16. Si se decidiera añadir `metadata` a `/`, leer antes `node_modules/next/dist/docs/01-app/01-getting-started/metadata*`.

1. **Datos.** Crear `lib/home.ts` con los tipos y las seis constantes de la sección anterior, copiando los valores literales de `references/templates/home-about/home.jsx` (features en líneas 135–139, stats 170–173, ticker 197–204, top 222–227, perks 257–264, FAQ 270–283). Importar `GameColor` desde `@/lib/games`. Verificación: `npx tsc --noEmit` sin errores.

2. **Estilos.** Añadir al final de `app/globals.css` dos bloques copiados verbatim de `references/templates/home-about/styles.css`:
   - líneas **930–1069** — `/* ===== HOME PAGE ===== */` hasta `.reveal.in`, incluidos `@keyframes bounce` y `@keyframes float`
   - líneas **1621–1725** — `/* ===== ACTIVITY ... */` hasta `.faq-a`, incluido `@keyframes tickin`

   No copiar nada entre 1070 y 1620 (bloque About) ni desde 1726 (`.fade-in` y siguientes ya existen). Del segundo rango, borrar a mano las cuatro líneas de `.live-led` y `@keyframes pulse-led`: caen dentro del rango pero son CSS huérfano que no usa ningún template. No modificar ninguna regla previa de `globals.css`. Verificación: la app arranca igual; las clases nuevas no colisionan con ninguna existente; `head -1068 app/globals.css` sigue idéntico byte a byte al archivo original.

3. **Decoración.** Crear `components/home-decor.tsx` (sin `"use client"`) exportando `FloatingSilhouettes` (contenedor `home-silos` con `aria-hidden="true"` y los ocho SVG `s1`–`s8`) y `FeatureIcon({ kind }: { kind: FeatureIconKind })` con los cuatro iconos de 16×16. `fill` y `stroke` en `currentColor`; los rects "huecos" mantienen el `#0a0a0f` literal del template. Verificación: `npx tsc --noEmit` limpio; ningún componente lo usa todavía.

4. **Hero y sustitución de la landing.** Crear `components/home-landing.tsx` con `"use client"`, el hook `useReveal` y, de momento, solo el hero: raíz `<div className="home fade-in">`, `<FloatingSilhouettes />`, eyebrow, `home-title` en tres líneas, subtítulo con `<br/>`, dos `<Link className="btn xl …">` a `/biblioteca` y `/acceso`, e indicador `hero-scroll` con `aria-hidden`. Reescribir `app/page.tsx` para que solo renderice `<HomeLanding />`; borrar el hero antiguo y el import de `Link`. Verificación: `/` muestra el hero nuevo a pantalla completa con las silhouettes flotando; ambos botones navegan.

5. **Secciones 01 y 02.** Añadir a `home-landing.tsx` el bloque `¿POR QUÉ ARCADE VAULT?` (mapeando `FEATURES` sobre `feature-card` con `transitionDelay` de `i * 80` ms) y `JUEGOS DISPONIBLES AHORA` (`mini-rail` con `GAMES.slice(0, 6)`, cada `mini-card` es un `<Link href={"/juego/" + g.id}>`, más el botón `VER TODOS LOS JUEGOS →`). Ambas secciones llevan `className="home-section reveal"`. Los kickers van como `{"// 01"}` y `{"// 02"}`, no como texto suelto: ESLint los lee como comentario y falla con `react/jsx-no-comment-textnodes`. El HTML renderizado es idéntico. Verificación: al bajar, las dos secciones aparecen con el fundido; pulsar una portada abre su ficha.

6. **Estadísticas y sección 03.** Añadir la franja `home-stats reveal` con `HOME_STATS` (`transitionDelay` de `i * 90` ms) y la sección `ACTIVIDAD EN VIVO` con las dos `activity-card`: ticker de `TICKER` (`animationDelay` de `i * 60` ms, puntuaciones con `+` y `toLocaleString("es-ES")`) y top de `TOP_TODAY` (clases `top1`/`top2`/`top3` en los tres primeros, `tp-bar` con `width: (100 - i * 16) + "%"`, rango con `padStart(2, "0")`, y `lb-link` a `/salon`). Verificación: el podio sale en oro, plata y bronce; las filas del ticker entran escalonadas.

7. **Precios y CTA final.** Añadir la sección `PRECIOS` (`price-card` con `PRICING_PERKS`, sello `pc-stamp`, botón `EMPEZAR GRATIS →` a `/acceso` a ancho completo, pie `No pedimos tarjeta. Nunca lo haremos.`) junto a `pricing-faq` con los tres `FAQ`, y la sección `home-final` con `¿LISTO PARA JUGAR?` e `INSERTAR MONEDA →` hacia `/biblioteca`. Verificación: `/` renderiza las seis secciones completas de arriba abajo.

8. **Movimiento reducido.** Añadir un bloque `@media (prefers-reduced-motion: reduce)` **nuevo, al final de `app/globals.css`**, con:
   - `.home-silos .silo` y `.hero-scroll .arrow` → `animation: none`
   - `.tick-row` → `animation-duration: 1ms`
   - `.reveal` → `opacity: 1; transform: none`

   Dos precisiones que hay que respetar o la regla no hace nada:

   - **Va al final, no dentro del bloque existente.** El bloque `prefers-reduced-motion` original está en la línea ~1053, pero el CSS del home se añade después (1069+). Con la misma especificidad gana la regla posterior, así que las reglas metidas en el bloque original quedan muertas: `.reveal` se queda en `opacity: 0` y las siluetas siguen flotando. Como efecto secundario, el bloque original no se toca.
   - **`.tick-row` no puede llevar `animation: none`.** Su regla base tiene `opacity: 0` y solo llega a 1 vía `animation: tickin ... forwards`; anulando la animación, las siete filas quedarían invisibles para siempre. Va al grupo de `animation-duration: 1ms`, que es el que el archivo ya usa para `.fade-in`, `.slide-in` y `.hall-table .tr`.

   Verificación: emulando `prefers-reduced-motion: reduce`, las seis `.reveal` computan `opacity: 1` sin la clase `in`, `.tick-row` computa `opacity: 1`, y `.silo` y `.arrow` computan `animation-name: none`.

9. **Pasada de `/frontend-design`.** Revisar `/` entre 360 px y 1440 px: foco de teclado, scroll horizontal, legibilidad del ticker por debajo de 520 px y contraste de `--ink-faint`. Aplicar solo correcciones que no rompan la fidelidad 1:1. Resultado de la revisión:

   - **Foco de teclado: sin cambios.** Recorrido real con `Tab`: los 12 enlaces del home ya reciben `outline: 2px solid rgb(0,245,255)`.
   - **Corrección 1 — scroll horizontal a 360 px.** `.activity-card` es ítem de grid y hereda `min-width: auto`, así que no baja de su `min-content` (267 px), impuesto por `▸ ÚLTIMAS PUNTUACIONES` en fuente pixel sin poder partir. Arreglo: `.activity-grid > * { min-width: 0; }` bajo `max-width: 520px`. `.ac-title` ya tiene elipsis, así que trunca solo.
   - **Corrección 2 — `GLOBAL` recortado entre 721 y 840 px.** Misma causa raíz, pero `.home-stats` tiene `overflow: hidden`, así que en vez de scroll producía texto cortado en silencio. Arreglo: subir el breakpoint de apilado de `.stat-block` de 720 a 880 px, con las mismas tres reglas del template.
   - **Contraste: reportado, no corregido.** `--ink-faint` (`#4a4f70`) sobre `#0f0f18` da **2.4:1**, por debajo del 4.5:1 de WCAG AA, en `.stat-s`, `.mini-cat`, `.tk-t`, `.pc-foot` y `.hero-scroll` (todos de 9 a 11 px). No se toca: es una variable preexistente que usan las seis pantallas, fuera del alcance de esta spec, y cambiar solo esas cinco clases rompería la fidelidad 1:1. Merece su propia spec de accesibilidad.

---

## Criterios de aceptación

**Compilación y tipos**

- [ ] `npm run build` termina sin errores.
- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `app/page.tsx` no contiene el texto `ENTRAR AL VAULT` ni `INSERTA UNA MONEDA PARA JUGAR`.
- [ ] `app/page.tsx` no lleva la directiva `"use client"`.

**Estructura de `/`**

- [ ] `/` responde 200 y su elemento raíz tiene la clase `home`.
- [ ] Se renderizan exactamente siete secciones en este orden: hero, `// 01`, `// 02`, franja de estadísticas, `// 03`, `// 04`, CTA final.
- [ ] El hero muestra las tres líneas `EL ARCADE`, `CLÁSICO ESTÁ`, `DE VUELTA`.
- [ ] El contenedor `home-silos` renderiza ocho `svg` y lleva `aria-hidden="true"`.
- [ ] El indicador `hero-scroll` lleva `aria-hidden="true"` y no es enfocable con tabulador.

**Contenido de las secciones**

- [ ] La sección `// 01` muestra cuatro `feature-card`, una por color: `cyan`, `yellow`, `magenta`, `green`.
- [ ] La sección `// 02` muestra seis `mini-card` con los títulos `BLOQUE BUSTER`, `CAÍDA`, `SERPENTINA`, `GLOTÓN`, `INVASORES`, `ROCAS`.
- [ ] La franja de estadísticas muestra tres bloques: `12+`, `MILES`, `GLOBAL`.
- [ ] El ticker de `// 03` muestra siete filas; la primera es `NEONFOX ▸ Caída +184.220 hace 2 min`.
- [ ] Las filas del ticker son texto plano: ninguna contiene un `<a>`.
- [ ] El top de `// 03` muestra cinco filas con rangos `#01` a `#05`; `#01` es `NEONFOX` con `312.840`.
- [ ] `#01` sale en oro, `#02` en plata y `#03` en bronce.
- [ ] La `price-card` de `// 04` muestra `$0`, `/ SIEMPRE`, seis líneas de ventajas y el sello `FREE PLAY`.
- [ ] La sección `// 04` muestra tres `faq-item` con bordes izquierdos cian, magenta y amarillo.
- [ ] Todas las puntuaciones usan separador de miles español (`184.220`, no `184,220`).

**Navegación**

- [ ] `▶ EXPLORAR JUEGOS` navega a `/biblioteca`.
- [ ] `✦ CREAR CUENTA` navega a `/acceso`.
- [ ] `VER TODOS LOS JUEGOS →` navega a `/biblioteca`.
- [ ] `VER SALÓN →` navega a `/salon`.
- [ ] `EMPEZAR GRATIS →` navega a `/acceso`.
- [ ] `INSERTAR MONEDA →` navega a `/biblioteca`.
- [ ] Pulsar la `mini-card` de `CAÍDA` navega a `/juego/caida`.
- [ ] Con sesión iniciada, `✦ CREAR CUENTA` y `EMPEZAR GRATIS →` siguen mostrando el mismo texto y el mismo destino.
- [ ] En `/`, el enlace `Inicio` del nav está resaltado.

**Animación de aparición**

- [ ] Al cargar `/`, las secciones por debajo del pliegue tienen `opacity: 0`.
- [ ] Al hacer scroll hasta cada sección, esta recibe la clase `in` y se vuelve visible.
- [ ] Una sección ya revelada no vuelve a ocultarse al salir del viewport.
- [ ] Con `prefers-reduced-motion: reduce`, las seis secciones son visibles sin necesidad de scroll.
- [ ] Con `prefers-reduced-motion: reduce`, las silhouettes no flotan y la flecha `▼` no rebota.

**Ausencia de About**

- [ ] No existe `app/acerca/` ni ningún archivo con `about` en el nombre.
- [ ] `components/nav.tsx` no ha cambiado y no contiene el texto `Acerca de`.
- [ ] `app/globals.css` no contiene ninguna regla `.about-*`, `.gp-*`, `.contact-*`, `.term-*`, `.lg-*`, `.highlight*`, `.score-pop`, `.rivet`, `.screw`, `.div-*`.
- [ ] `app/globals.css` no contiene `.live-led` ni `@keyframes pulse-led` (CSS huérfano excluido a mano del rango ACTIVITY).
- [ ] `app/globals.css` no contiene `@keyframes pxblink`, `@keyframes scorepop` ni `@keyframes shake`.

**Fidelidad e hidratación**

- [ ] `/` no produce advertencias de hidratación en la consola del navegador.
- [ ] `app/globals.css` contiene `@keyframes float`, `@keyframes bounce` y `@keyframes tickin`.
- [ ] Ninguna regla previa de `app/globals.css` ha sido modificada: `git diff --numstat app/globals.css` no reporta ninguna línea eliminada, y `head -1068 app/globals.css` es idéntico byte a byte al archivo antes de la rama.
- [ ] `app/globals.css` termina con tres bloques propios: `@media (prefers-reduced-motion: reduce)` para el home, `@media (max-width: 520px)` con `.activity-grid > * { min-width: 0 }`, y `@media (max-width: 880px)` con el apilado de `.stat-block`.
- [ ] Comparada contra `references/templates/home-about/arcade-vault-standalone.html` abierta en el navegador, `/` coincide en estructura, copia y colores.
- [ ] Entre 360 px y 1440 px no aparece scroll horizontal en `/` (comprobado en 360, 375, 414, 520, 600, 721, 768, 840, 880, 900, 1024, 1280 y 1440).
- [ ] En ese mismo barrido, ningún descendiente de `.home` sobresale del ancho del viewport; en particular `GLOBAL` se lee entero entre 721 y 880 px.
- [ ] Los 12 enlaces del home muestran `outline` visible al recorrerlos con `Tab`.

---

## Decisiones

**Alcance**

- **Sí:** portar solo el home. El template trae home y About en el mismo `styles.css`; se corta por la mitad y se copia únicamente lo que el home usa.
- **No:** crear `/acerca`, ni siquiera como placeholder. Instrucción explícita del usuario.
- **No:** añadir el enlace `Acerca de` al nav, aunque el `nav.jsx` del template lo traiga. Un enlace a una página inexistente es un 404 esperando.

**Landing anterior**

- **Sí:** borrar el hero de la spec 01 por completo. Era un marcador de posición hasta que existiera un home de verdad; la spec 01 ya listaba la "landing ampliada" como trabajo futuro.
- **No:** conservar el hero viejo encima del nuevo. Dos heros seguidos es exactamente el ruido que la spec 01 evitó en `/biblioteca`.

**Datos**

- **Sí:** `lib/home.ts` con constantes tipadas, reutilizando `GameColor` de `lib/games.ts`. Los mismos cuatro colores; un segundo tipo idéntico sería deriva.
- **No:** literales dentro del componente. Mezcla copia y marcado, y hace ilegible el diff cuando cambie un texto.
- **No:** derivar el ticker y el top de `seededScores`. Esos datos no tienen nombre de juego ni marca temporal (`hace 2 min`); habría que inventar campos y la copia dejaría de coincidir con el template.
- **Sí:** cadenas fijas para los tiempos. `Date.now()` en el render garantiza desajuste de hidratación, y el ticker no es un dato real de todas formas.
- **Sí:** el ancho de barra del top se calcula en el render (`100 - i * 16`). Es presentación derivada del índice, no un dato.

**Interfaz**

- **Sí:** `CREAR CUENTA` y `EMPEZAR GRATIS →` fijos, sin mirar la sesión. El `AuthProvider` lee `localStorage` en `useEffect`, así que cualquier variante mostraría el texto de invitado durante un instante antes de cambiar. Un parpadeo en el CTA principal es peor que un CTA genérico.
- **Sí:** ticker como texto plano. El CSS del template no trae estado de hover para `tick-row`, y hacer las filas clicables obligaría a mapear siete títulos a ids y a inventar estilo.
- **Sí:** FAQ estática, sin acordeón. El template no lo tiene; añadirlo es una feature.
- **Sí:** `hero-scroll` decorativo con `aria-hidden`. Igual que el template; convertirlo en ancla es diseño nuevo.

**Estilos**

- **Sí:** copiar los dos rangos de `styles.css` verbatim al final de `globals.css`. Coherente con la decisión de la spec 01 de no traducir el prototipo a Tailwind, y hace el diff auditable línea a línea contra el original.
- **No:** traducir a utilidades Tailwind v4. Mismo razonamiento que la spec 01: trabajo sin beneficio y con riesgo de deriva visual.
- **Sí:** añadir el CSS **antes** de los componentes (paso 2), al revés que la spec 01, que lo dejó para el final. Aquí el port es verbatim y cada sección necesita sus reglas para poder verificarse al terminar su paso.
- **Sí:** tres bloques propios al final del archivo, fuera del port: `prefers-reduced-motion` del home y las dos correcciones de responsive del paso 9. Son las excepciones justificadas, no una licencia para retocar el port.
- **Sí:** poner esos bloques al final en vez de editar los existentes. En CSS plano, a igual especificidad gana la regla posterior: metidos antes del CSS del home quedarían muertos. Además deja intacto todo lo anterior, que es lo que exige el criterio de aceptación.
- **Sí:** excluir a mano `.live-led` y `@keyframes pulse-led` del rango copiado. El "verbatim" era el medio; el fin es que `globals.css` no cargue con nada que el home no use. No lo usa ningún template, ni siquiera About.
- **No:** dejar `.live-led` dentro por respetar el corte de líneas al pie de la letra. Serían cuatro líneas muertas y un criterio de aceptación incumplido a cambio de nada.
- **Sí:** arreglar los dos desbordes con `min-width: 0` y con el breakpoint del propio template, no reescribiendo la maqueta. Ambos son el mismo bug latente del template (`min-width: auto` en ítems de grid) y el arreglo es de una línea en cada caso.
- **No:** tocar `--ink-faint` para arreglar el contraste. La usan las seis pantallas: cambiarla se sale del alcance de esta spec y hacerlo solo en el home rompe la fidelidad 1:1. Va a su propia spec.

**Componentes**

- **Sí:** `app/page.tsx` como Server Component fino sobre `components/home-landing.tsx`. Misma convención que las otras cinco pantallas.
- **Sí:** separar `components/home-decor.tsx` como componente de servidor. Son ~60 líneas de SVG puro sin estado; dejarlas en el archivo cliente las envía al navegador sin motivo y entierra la lógica del home.
- **No:** un único archivo cliente con todo. `home.jsx` ya son 338 líneas con la decoración incluida; el corte natural existe en el propio template.
- **Sí:** `useReveal` dentro de `home-landing.tsx`. Un solo consumidor; extraerlo a `lib/` sería abstracción prematura.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `.reveal` arranca en `opacity: 0`; si el IntersectionObserver no dispara (JS deshabilitado, error en el bundle, viewport muy alto), cinco de las siete secciones quedan invisibles con un 200 en la respuesta | Paso 8: regla de `prefers-reduced-motion` que fuerza `.reveal { opacity: 1 }`. Cubre el caso de accesibilidad pero **no** el de JS caído — asumido: el resto de la app ya requiere JS. Criterio de aceptación que verifica la revelación real con scroll. |
| Una regla añadida al bloque `prefers-reduced-motion` existente queda muerta sin avisar: está antes del CSS del home y pierde por orden de cascada | Paso 8 lo fija explícitamente al final del archivo. Se detectó porque la verificación mide `getComputedStyle`, no porque la regla "se vea bien" en el diff. |
| `min-width: auto` en ítems de grid provoca desbordes que `overflow: hidden` convierte en texto recortado en silencio, sin scroll que lo delate | Paso 9: el barrido de anchos compara `getBoundingClientRect().right` contra `clientWidth`, no solo `scrollWidth > clientWidth`. Así salió `GLOBAL`, que no producía scroll. |
| `--ink-faint` a 2.4:1 incumple WCAG AA en cinco textos del home | Documentado en el paso 9 y deliberadamente no corregido aquí. Pendiente de una spec de accesibilidad que trate la variable en las seis pantallas a la vez. |
| Al copiar `styles.css` se cuela sin querer el bloque About (líneas 1070–1620) | Los rangos están fijados en el paso 2 y hay cuatro criterios de aceptación que hacen `grep` de `.about-*`, `.gp-*`, `.contact-*` y de los tres `@keyframes` exclusivos de About. |
| Colisión de nombres de clase entre el CSS nuevo y las 1068 líneas existentes | Verificado antes de escribir la spec: los ~90 selectores del bloque de home no existen en `globals.css`. Reverificar tras el paso 2 si `globals.css` cambia por otra rama. |
| `@keyframes float`, `bounce` o `tickin` se pierden si el corte de líneas se desplaza | Criterio de aceptación explícito que exige los tres presentes. Sin `float` las silhouettes se quedan quietas y el fallo pasa desapercibido. |
| Ocho SVG animados con `filter: drop-shadow` en el hero pueden costar caro en móviles modestos | Se mantiene igual que el template. La animación es sobre `transform` (compuesta por GPU). Si aparece jank, se revisa en el paso 9, no antes. |
| El hero usa `min-height: calc(100vh - 60px)`; en móvil la barra de direcciones de iOS hace saltar `100vh` | Comprobación entre 360 px y 1440 px en el paso 9. No se sustituye por `dvh` sin verlo fallar: sería salirse del port verbatim. |
| Deriva silenciosa respecto al template | Último criterio de aceptación: comparación lado a lado con `arcade-vault-standalone.html` abierto en el navegador. |
| El `mini-rail` asume que `GAMES` mantiene su orden actual; reordenar `lib/games.ts` cambia los seis destacados sin avisar | Aceptado. `GAMES.slice(0, 6)` es intencional y está documentado; un campo `featured` sería modelo de datos nuevo, fuera de alcance. |
