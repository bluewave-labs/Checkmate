<p align=center> <a href="https://trendshift.io/repositories/12443" target="_blank"><img src="https://trendshift.io/api/badge/repositories/12443" alt="bluewave-labs%2Fcheckmate | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a></p>

![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![OpenSSF Mejores Prácticas](https://www.bestpractices.dev/projects/9901/badge)](https://www.bestpractices.dev/projects/9901)
[![Pregunta en DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/checkmate)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>Una aplicación de código abierto para monitoreo de infraestructura y tiempo de actividad</strong></p>

<img width="1660" alt="image" src="https://github.com/user-attachments/assets/b748f36d-a271-4965-ad0a-18bf153bbee7" />

Este repositorio contiene tanto el frontend como el backend de Checkmate, una herramienta de monitoreo de código abierto y autoalojada para rastrear hardware de servidores, tiempo de actividad, tiempos de respuesta e incidentes en tiempo real con visualizaciones atractivas. Checkmate revisa regularmente si un servidor o sitio web es accesible y funciona de manera óptima, proporcionando alertas e informes en tiempo real sobre la disponibilidad, el tiempo de inactividad y el tiempo de respuesta de los servicios monitoreados.

Checkmate también tiene un agente llamado [Capture](https://github.com/bluewave-labs/capture), para recuperar datos de servidores remotos. Aunque Capture no es obligatorio para ejecutar Checkmate, proporciona información adicional sobre el estado de la CPU, RAM, disco y temperatura de tus servidores.

Checkmate ha sido probado con más de 1000 monitores activos sin problemas ni cuellos de botella de rendimiento.

**Si deseas patrocinar una función, [visita este enlace](https://checkmate.so/sponsored-features).**

## 📚 Tabla de contenidos

- [📦 Demo](#demo)  
- [🔗 Guía del usuario](#guía-del-usuario)  
- [🛠️ Instalación](#instalación)
- [🏁 Traducciones](#traducciones)  
- [🚀 Rendimiento](#rendimiento)  
- [💚 Preguntas e ideas](#preguntas-e-ideas)  
- [🧩 Características](#características)  
- [🏗️ Capturas de pantalla](#capturas-de-pantalla)  
- [🏗️ Tecnologías](#tecnologías)  
- [🔗 Enlaces útiles](#enlaces-útiles)  
- [🤝 Contribuciones](#contribuciones)  
- [💰 Patrocinadores](#patrocinadores)

...

**[Texto truncado para mantener la longitud del mensaje manejable]**

## Demo

Puedes ver la última versión de [Checkmate](https://checkmate-demo.bluewavelabs.ca/) en acción. El usuario es uptimedemo@demo.com y la contraseña es Demouser1! (ten en cuenta que actualizamos el servidor de demostración de vez en cuando, así que si no funciona para ti, por favor contáctanos en el canal de Discusiones).

## Guía del usuario

Las instrucciones de uso se pueden encontrar [aquí](https://docs.checkmate.so/checkmate-2.1). Todavía está en desarrollo y parte de la información puede estar desactualizada ya que continuamente añadimos funciones cada semana. ¡Ten por seguro que estamos haciendo lo mejor posible! :)

## Instalación

Consulta las instrucciones de instalación en el [portal de documentación de Checkmate](https://docs.checkmate.so/checkmate-2.1/users-guide/quickstart).

Alternativamente, también puedes usar [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md) o [Pikapods](https://www.pikapods.com/) para desplegar rápidamente una instancia de Checkmate. Si deseas monitorear tu infraestructura de servidores, necesitarás el agente [Capture](https://github.com/bluewave-labs/capture). El repositorio de Capture también contiene las instrucciones de instalación.

## Traducciones

Si deseas usar Checkmate en tu idioma, por favor [ve a esta página](https://poeditor.com/join/project/lRUoGZFCsJ) y regístrate para el idioma al que te gustaría traducir Checkmate.

## Rendimiento

Gracias a extensas optimizaciones, Checkmate opera con un uso de memoria excepcionalmente bajo, requiriendo recursos mínimos de memoria y CPU. Aquí está el uso de memoria de una instancia de Node.js ejecutándose en un servidor que monitorea 323 servidores cada minuto:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

También puedes ver el consumo de memoria de MongoDB y Redis en el mismo servidor (398Mb y 15Mb) para la misma cantidad de servidores:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

## Preguntas e Ideas

Si tienes alguna pregunta, sugerencia o comentario, tienes varias opciones:

- [Canal de Discord](https://discord.gg/NAb6H3UTjK)
- [Discusiones en GitHub](https://github.com/bluewave-labs/bluewave-uptime/discussions)
- [Grupo en Reddit](https://www.reddit.com/r/CheckmateMonitoring/)

¡No dudes en hacer preguntas o compartir tus ideas, nos encantaría saber de ti!

## Características

- Completamente de código abierto, desplegable en tus propios servidores o dispositivos personales (por ejemplo, Raspberry Pi 4 o 5)
- Monitoreo de sitios web
- Monitoreo de velocidad de carga
- Monitoreo de infraestructura (memoria, uso de disco, rendimiento de CPU, etc) - requiere el agente [Capture](https://github.com/bluewave-labs/capture)
- Monitoreo de Docker
- Monitoreo con ping
- Monitoreo de certificados SSL
- Monitoreo de puertos
- Incidentes en una sola vista
- Páginas de estado
- Notificaciones por correo, Webhooks, Discord, Telegram, Slack
- Mantenimiento programado
- Monitoreo de consultas JSON
- Soporte para múltiples idiomas

**Hoja de ruta a corto plazo:** ([Milestone 2.2](https://github.com/bluewave-labs/Checkmate/milestone/8))

- Mejores notificaciones
- Monitoreo de red
- ...y algunas funciones más

## Capturas de pantalla

<p>
<img width="1628" alt="image" src="https://github.com/user-attachments/assets/2eff6464-0738-4a32-9312-26e1e8e86275" />
</p>
<p>
  <img width="1656" alt="image" src="https://github.com/user-attachments/assets/616c3563-c2a7-4ee4-af6c-7e6068955d1a" />
</p>
<p>
<img width="1652" alt="image" src="https://github.com/user-attachments/assets/7912d7cf-0d0e-4f26-aa5c-2ad7170b5c99" />
</p>
<p>
<img width="1652" alt="image" src="https://github.com/user-attachments/assets/08c2c6ac-3a2f-44d1-a229-d1746a3f9d16" />
</p>

## Tecnologías

- [ReactJs](https://react.dev/)
- [MUI (framework de React)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- ¡Y muchos otros componentes de código abierto!

## Enlaces útiles

- Si deseas apoyarnos, por favor considera darle una ⭐ y haz clic en "watch".
- ¿Tienes una pregunta o sugerencia para la hoja de ruta? Revisa nuestro [canal de Discord](https://discord.gg/NAb6H3UTjK) o el foro de [Discusiones](https://github.com/bluewave-labs/checkmate/discussions).
- ¿Quieres saber cuándo hay una nueva versión? Usa [Newreleases](https://newreleases.io/), un servicio gratuito para seguir lanzamientos.
- Mira un video de instalación y uso de Checkmate [aquí](https://www.youtube.com/watch?v=GfFOc0xHIwY)

## Contribuciones

Somos [Alex](http://github.com/ajhollid) (líder de equipo), [Vishnu](http://github.com/vishnusn77), [Mohadeseh](http://github.com/mohicody), [Gorkem](http://github.com/gorkem-bwl/), [Owaise](http://github.com/Owaiseimdad), [Aryaman](https://github.com/Br0wnHammer) y [Mert](https://github.com/mertssmnoglu), ayudando a personas y empresas a monitorear su infraestructura y servidores.

Nos enorgullecemos de construir conexiones fuertes con contribuyentes de todos los niveles. A pesar de ser un proyecto joven, Checkmate ya ha ganado más de 7000 estrellas y ha atraído a más de 90 contribuyentes de todo el mundo.

Nuestro repositorio ha sido marcado con estrella por empleados de **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes y NEC**, ¡así que no te detengas — participa, contribuye y aprende con nosotros!

Cómo contribuir:

0. Dale una estrella al repositorio :)
1. Revisa la [guía para contribuidores](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Se anima a los nuevos a revisar las etiquetas `good-first-issue`.
2. Consulta la [estructura del proyecto](https://docs.checkmate.so/checkmate-2.1/developers-guide/general-project-structure) y la [visión general](https://bluewavelabs.gitbook.io/checkmate/developers-guide/high-level-overview).
3. Lee una estructura detallada de [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) si deseas profundizar en la arquitectura.
4. Abre un issue si crees que has encontrado un error.
5. Revisa los issues con la etiqueta `good-first-issue` si eres nuevo.
6. Haz un pull request para añadir nuevas funciones, mejoras o correcciones.

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Historial de estrellas](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/bluewave-uptime&Date)

## Patrocinadores

Gracias a [Gitbook](https://gitbook.io/) por darnos una cuenta gratuita para su plataforma de documentación, y a [Poeditor](https://poeditor.com/) por proporcionarnos una cuenta gratuita para servicios de traducción. Si deseas patrocinar Checkmate, por favor envía un correo a hello@bluewavelabs.ca

Si deseas patrocinar una función, [visita esta página](https://checkmate.so/sponsored-features).

También puedes revisar otros proyectos de BlueWave orientados a desarrolladores y contribuidores:

- [VerifyWise](https://github.com/bluewave-labs/verifywise), la primera plataforma de gobernanza de IA de código abierto.
- [DataRoom](https://github.com/bluewave-labs/bluewave-dataroom), una aplicación de intercambio de archivos seguro, también conocida como dataroom.
- [Guidefox](https://github.com/bluewave-labs/guidefox), una app que ayuda a nuevos usuarios a aprender a usar tu producto mediante pistas, tours, popups y banners.
