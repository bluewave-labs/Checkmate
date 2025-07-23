<p align=center> <a href="https://trendshift.io/repositories/12443" target="_blank"><img src="https://trendshift.io/api/badge/repositories/12443" alt="bluewave-labs%2Fcheckmate | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a></p>

![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/9901/badge)](https://www.bestpractices.dev/projects/9901)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/checkmate)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>Una aplicación de monitoreo de infraestructura y disponibilidad de código abierto</strong></p>

<img width="1660" alt="image" src="https://github.com/user-attachments/assets/b748f36d-a271-4965-ad0a-18bf153bbee7" />

Este repositorio contiene tanto el frontend como el backend de Checkmate, una herramienta de monitoreo de código abierto y autoalojada para rastrear hardware de servidores, tiempo de actividad, tiempos de respuesta e incidentes en tiempo real con visualizaciones atractivas. Checkmate verifica regularmente si un servidor/sitio web es accesible y funciona de manera óptima, proporcionando alertas y reportes en tiempo real sobre disponibilidad, tiempo de inactividad y respuesta de los servicios monitoreados.

Checkmate también tiene un agente llamado [Capture](https://github.com/bluewave-labs/capture) para obtener datos de servidores remotos. Aunque no es obligatorio para ejecutar Checkmate, proporciona información adicional sobre el estado del CPU, RAM, disco y temperatura de tus servidores.

Checkmate ha sido probado con más de 1000 monitores activos sin problemas significativos ni cuellos de botella en el rendimiento.

**Si deseas patrocinar una función, [consulta este enlace](https://checkmate.so/sponsored-features).**

## 📚 Tabla de contenidos

- [📦 Demo](#-demo)  
- [🔗 Guía del usuario](#-guía-del-usuario)  
- [🛠️ Instalación](#️-instalación)
- [🚀 Despliegue con Helm](#-despliegue-con-helm)
- [🏁 Traducciones](#-traducciones)  
- [🚀 Rendimiento](#-rendimiento)  
- [💚 Preguntas e ideas](#-preguntas-e-ideas)  
- [🧩 Funcionalidades](#-funcionalidades)  
- [🏗️ Capturas de pantalla](#-capturas-de-pantalla)  
- [🏗️ Tecnología utilizada](#-tecnología-utilizada)  
- [🔗 Enlaces útiles](#enlaces-útiles)  
- [🤝 Cómo contribuir](#-cómo-contribuir)  
- [💰 Patrocinadores](#-patrocinadores)

## 📦 Demo

Puedes ver la última versión de [Checkmate](https://checkmate-demo.bluewavelabs.ca/) en acción. Usuario: `uptimedemo@demo.com`, contraseña: `Demouser1!`. (Actualizamos el servidor demo periódicamente. Si no funciona, contáctanos en el canal de Discussions).

## 🔗 Guía del usuario

Instrucciones de uso disponibles [aquí](https://docs.checkmate.so/checkmate-2.1). Aún está en desarrollo, pero se actualiza constantemente.

## 🛠️ Instalación

Consulta las instrucciones de instalación en el [portal de documentación de Checkmate](https://docs.checkmate.so/checkmate-2.1/users-guide/quickstart).

También puedes usar [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md) o [Pikapods](https://www.pikapods.com/) para desplegar rápidamente una instancia. Si quieres monitorear tu infraestructura, necesitarás el agente [Capture](https://github.com/bluewave-labs/capture).

## 🏁 Traducciones

Si deseas usar Checkmate en otro idioma, [únete a este proyecto en Poeditor](https://poeditor.com/join/project/lRUoGZFCsJ) para colaborar con las traducciones.

## 🚀 Rendimiento

Gracias a optimizaciones avanzadas, Checkmate tiene un consumo de memoria muy bajo. Aquí el uso de memoria monitoreando 323 servidores cada minuto:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Uso de MongoDB y Redis en el mismo servidor (398Mb y 15Mb):

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

## 💚 Preguntas e ideas

Puedes contactarnos por:

- [Canal de Discord](https://discord.gg/NAb6H3UTjK)
- [Discusiones en GitHub](https://github.com/bluewave-labs/bluewave-uptime/discussions)
- [Grupo en Reddit](https://www.reddit.com/r/CheckmateMonitoring/)

¡Tus ideas son bienvenidas!

## 🧩 Funcionalidades

- Código abierto, autoalojable (Raspberry Pi incluido)
- Monitoreo de sitios web, puertos, ping, SSL
- Velocidad de página
- Monitoreo de infraestructura (requiere agente Capture)
- Monitoreo Docker
- Incidentes y mantenimiento programado
- Notificaciones (email, Discord, Slack, Telegram, Webhooks)
- Consulta JSON
- Multilenguaje

**Próximas funciones (Milestone 2.2):**
- Mejores notificaciones
- Monitoreo de red
- Otras mejoras

## 🏗️ Capturas de pantalla

(Ver imágenes en el repo original)

## 🏗️ Tecnología utilizada

- ReactJs
- MUI
- Node.js
- MongoDB
- Recharts
- Y muchos componentes de código abierto

## Enlaces útiles

- ⭐ Dale una estrella si te gusta el proyecto
- 📌 Participa en [Discussions](https://github.com/bluewave-labs/checkmate/discussions)
- 📥 Usa [NewReleases](https://newreleases.io/) para recibir actualizaciones
- 🎥 Mira un [video de instalación](https://www.youtube.com/watch?v=GfFOc0xHIwY)

## 🤝 Cómo contribuir

Somos [Alex](http://github.com/ajhollid), [Vishnu](http://github.com/vishnusn77), [Mohadeseh](http://github.com/mohicody), [Gorkem](http://github.com/gorkem-bwl/), [Owaise](http://github.com/Owaiseimdad), [Aryaman](https://github.com/Br0wnHammer) y [Mert](https://github.com/mertssmnoglu).

Checkmate tiene más de 7000 estrellas y 90+ contribuidores globales. Está marcado por empleados de Google, Microsoft, Intel, Cisco, etc.

Pasos para contribuir:

1. ⭐ Dale estrella al repositorio
2. Lee la [guía de contribución](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md)
3. Revisa la [estructura del proyecto](https://docs.checkmate.so/checkmate-2.1/developers-guide/general-project-structure)
4. Aprende más con [DeepWiki](https://deepwiki.com/bluewave-labs/Checkmate)
5. Abre un issue si encuentras errores
6. Mira las tareas con `good-first-issue`
7. Envía un PR con mejoras o nuevas funciones

![Contribuidores](https://contrib.rocks/image?repo=bluewave-labs/checkmate)

[![Historial de estrellas](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/bluewave-uptime&Date)

## 💰 Patrocinadores

Gracias a [Gitbook](https://gitbook.io/) y [Poeditor](https://poeditor.com/) por sus cuentas gratuitas.

¿Quieres patrocinar? Escríbenos a hello@bluewavelabs.ca  
También puedes [ver funciones patrocinadas](https://checkmate.so/sponsored-features)

Otros proyectos:

- [VerifyWise](https://github.com/bluewave-labs/verifywise): Gobernanza de IA
- [DataRoom](https://github.com/bluewave-labs/bluewave-dataroom): Compartir archivos seguro
- [Guidefox](https://github.com/bluewave-labs/guidefox): Onboarding con tours y ayudas visuales