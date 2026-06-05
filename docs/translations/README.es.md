<p align=center> <a href="https://trendshift.io/repositories/12443" target="_blank"><img src="https://trendshift.io/api/badge/repositories/12443" alt="bluewave-labs%2Fcheckmate | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a></p>

<p align="center">
  🇺🇸 <a href="../../README.md">English</a> |
  🇸🇦 <a href="README.ar.md">العربية</a> |
  🇪🇸 <a href="README.ca.md">Català</a> |
  🇨🇿 <a href="README.cs.md">Čeština</a> |
  🇩🇪 <a href="README.de.md">Deutsch</a> |
  🇪🇸 <a href="README.es.md">Español</a> |
  🇫🇮 <a href="README.fi.md">Suomi</a> |
  🇫🇷 <a href="README.fr.md">Français</a> |
  🇯🇵 <a href="README.ja.md">日本語</a> |
  🇧🇷 <a href="README.pt-BR.md">Português (Brasil)</a> |
  🇷🇺 <a href="README.ru.md">Русский</a> |
  🇹🇭 <a href="README.th.md">ไทย</a> |
  🇹🇷 <a href="README.tr.md">Türkçe</a> |
  🇺🇦 <a href="README.uk.md">Українська</a> |
  🇻🇳 <a href="README.vi.md">Tiếng Việt</a> |
  🇨🇳 <a href="README.zh-CN.md">简体中文</a> |
  🇹🇼 <a href="README.zh-TW.md">繁體中文</a>
</p>

![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/checkmate)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>Una aplicación de código abierto para monitorización de disponibilidad e infraestructura</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Este repositorio contiene tanto el frontend como el backend de Checkmate, una herramienta de monitorización de código abierto y auto-alojable que rastrea hardware de servidores, disponibilidad, tiempos de respuesta e incidentes en tiempo real con bonitas visualizaciones. Checkmate comprueba periódicamente si un servidor o sitio web está accesible y funciona de forma óptima, y proporciona alertas e informes en tiempo real sobre la disponibilidad, el tiempo de inactividad y los tiempos de respuesta de los servicios monitorizados.

Checkmate también dispone de un agente llamado [Capture](https://github.com/bluewave-labs/capture) para obtener datos de servidores remotos. Capture no es necesario para ejecutar Checkmate, pero aporta información adicional sobre el estado de CPU, RAM, disco y temperatura de los servidores. Capture puede ejecutarse en Linux, Windows, Mac, Raspberry Pi o cualquier dispositivo que pueda ejecutar Go.

Checkmate ha sido sometido a pruebas de carga con más de 1000 monitores activos sin presentar problemas ni cuellos de botella de rendimiento.

## 📚 Tabla de contenidos

- [📦 Demo](#demo)
- [🔗 Guía de usuario](#users-guide)
- [🛠️ Instalación](#installation)
- [🚀 Rendimiento](#performance)
- [💚 Preguntas e ideas](#questions--ideas)
- [🧩 Características](#features)
- [🏗️ Capturas de pantalla](#screenshots)
- [🏗️ Stack tecnológico](#tech-stack)
- [🔗 Algunos enlaces](#a-few-links)
- [🤝 Contribuir](#contributing)


<a id="demo"></a>
## Demo

Puedes ver la última versión de [Checkmate](https://demo.checkmate.so/) en acción.

El usuario es demouser@demo.com y la contraseña es Demouser1! (ten en cuenta que actualizamos el servidor de demostración de vez en cuando; si no funciona, escríbenos en el canal Discussions).

<a id="users-guide"></a>
## Guía de usuario

Las instrucciones de uso están disponibles [aquí](https://checkmate.so/docs).

## Prerrequisitos
- [Docker](https://www.docker.com/) instalado
- [Git](https://git-scm.com/) instalado

<a id="installation"></a>
## Instalación

Consulta las instrucciones de instalación en el [portal de documentación de Checkmate](https://checkmate.so/docs).

También puedes utilizar [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Sudáfrica), [Cloudzy](https://cloudzy.com/marketplace/checkmate) o [Pikapods](https://www.pikapods.com/) para levantar rápidamente una instancia de Checkmate. Si quieres monitorizar la infraestructura de tus servidores, necesitarás el [agente Capture](https://github.com/bluewave-labs/capture). El repositorio de Capture también incluye las instrucciones de instalación.

### Uso de una CA personalizada

Si necesitas monitorizar endpoints HTTPS internos con certificados emitidos por autoridades certificadoras privadas (como Smallstep), consulta nuestra [guía de confianza para CAs personalizadas](../custom-ca-trust.md) con las opciones de configuración para Docker.

Para más documentación, consulta el [directorio docs](../).

<a id="performance"></a>
## Rendimiento

Gracias a optimizaciones extensas, Checkmate funciona con una huella de memoria excepcionalmente baja y requiere un mínimo de memoria y CPU. A continuación se muestra el uso de memoria de una instancia de Node.js en un servidor que monitoriza 323 servidores cada minuto:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Y aquí la huella de memoria de MongoDB y Redis en el mismo servidor (398 MB y 15 MB) para la misma cantidad de servidores:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Preguntas e ideas

Si tienes preguntas, sugerencias o comentarios, dispones de varias opciones:

- [Canal de Discord](https://discord.gg/NAb6H3UTjK) (preferido)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (entramos a verlo de vez en cuando)

No dudes en preguntar o compartir tus ideas — ¡nos encantará saber de ti!

<a id="features"></a>
## Características

- Totalmente de código abierto, desplegable en tus propios servidores o dispositivos domésticos (por ejemplo, Raspberry Pi 4 o 5)
- Varias opciones de monitorización: disponibilidad, Docker, Ping, SSL, puerto, servidor de juegos
- Monitorización de velocidad de página
- Monitorización de infraestructura (memoria, uso de disco, rendimiento de CPU, red, etc.) — requiere el agente [Capture](https://github.com/bluewave-labs/capture)
  - Monitorización selectiva de discos con selección de puntos de montaje
- Incidentes de un vistazo
- Páginas de estado con 4 temas elegantes
- Notificaciones por correo electrónico, webhooks, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Mantenimiento programado
- Monitorización mediante consultas JSON
- Soporte multiidioma para árabe, chino (simplificado), chino (tradicional, Taiwán), checo, inglés, finés, francés, alemán, japonés, portugués (Brasil), ruso, español, tailandés, turco, ucraniano y vietnamita


## Ciclo de vida de un monitor

1. Un monitor ejecuta una comprobación (HTTP / Ping / puerto / hardware vía el agente Capture)
2. El resultado se almacena (éxito/fallo + tiempo de respuesta)
3. Los resultados recientes se evalúan frente al umbral de cambio de estado configurado para el monitor
4. Si se alcanza el umbral y el estado actual difiere del anterior, el estado del monitor cambia (por ejemplo, `initializing`, `up`, `down`, `breached`)
5. Al cambiar de estado, se crea o resuelve un incidente según el estado actual del monitor
6. Las notificaciones se disparan según la configuración

<a id="screenshots"></a>
## Capturas de pantalla

<p>
<img width="1628" alt="image" src="https://github.com/user-attachments/assets/2eff6464-0738-4a32-9312-26e1e8e86275" />
</p>
<p>
  <img width="1656" alt="image" src="https://github.com/user-attachments/assets/616c3563-c2a7-4ee4-af6c-7e6068955d1a" />
</p>
<p>
</p><img width="1652" alt="image" src="https://github.com/user-attachments/assets/7912d7cf-0d0e-4f26-aa5c-2ad7170b5c99" />
</p>
<p>
<img width="1652" alt="image" src="https://github.com/user-attachments/assets/08c2c6ac-3a2f-44d1-a229-d1746a3f9d16" />
</p>



<a id="tech-stack"></a>
## Stack tecnológico

- [ReactJs](https://react.dev/)
- [MUI (framework de React)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- ¡Y muchos otros componentes de código abierto!

<a id="a-few-links"></a>
## Algunos enlaces

- Si quieres apoyarnos, dale a ⭐ y pulsa "watch".
- ¿Tienes una pregunta o sugerencia sobre la hoja de ruta o las funcionalidades? Pásate por nuestro [canal de Discord](https://discord.gg/NAb6H3UTjK) o el foro de [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- ¿Quieres una notificación cuando salga una nueva versión? Usa [Newreleases](https://newreleases.io/), un servicio gratuito para seguir releases.
- Mira un [vídeo de instalación y uso de Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## Contribuir

Somos [Alex](http://github.com/ajhollid) (team lead), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) y [Karen](https://github.com/karenvicent), y ayudamos a personas y empresas a monitorizar su infraestructura y sus servidores.

Nos enorgullecemos de construir relaciones sólidas con la comunidad de contribuidores de cualquier nivel. A pesar de ser un proyecto joven, Checkmate ya ha conseguido más de 7000 estrellas y reúne a 90+ contribuidores de todo el mundo.

Nuestro repositorio cuenta con estrellas de empleados de **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes y NEC** — así que no te cortes: únete, contribuye y aprende con nosotros.

Cómo puedes contribuir:

0. Pon una estrella a este repo :)
1. Revisa la [guía de contribución](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Si es tu primera vez, te recomendamos mirar la etiqueta `good-first-issue`.
2. Lee la estructura detallada de [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) si quieres profundizar en la arquitectura.
3. Abre un issue si crees que has encontrado un bug.
4. Busca `good-first-issue` si eres nuevo en el proyecto.
5. Abre un pull request para añadir nuevas funciones, mejoras o correcciones de bugs.
6. Echa un vistazo a este recorrido interactivo del código de `Checkmate` en CodeCanvas [aquí](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Para mejorar las simulaciones de flujo de datos existentes o crear nuevas, sigue el tutorial rápido [aquí](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
