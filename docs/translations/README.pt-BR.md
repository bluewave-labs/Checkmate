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

<p align="center"><strong>Uma aplicação de código aberto para monitoramento de disponibilidade e infraestrutura</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Este repositório contém o frontend e o backend do Checkmate, uma ferramenta de monitoramento open source e auto-hospedável que acompanha em tempo real o hardware dos servidores, a disponibilidade, os tempos de resposta e os incidentes — tudo com visualizações bem feitas. O Checkmate verifica periodicamente se um servidor ou site está acessível e funcionando bem, e envia alertas e relatórios em tempo real sobre disponibilidade, indisponibilidade e tempos de resposta dos serviços monitorados.

O Checkmate também conta com um agente chamado [Capture](https://github.com/bluewave-labs/capture), que coleta dados de servidores remotos. Capture não é obrigatório para rodar o Checkmate, mas dá informações adicionais sobre CPU, RAM, disco e temperatura dos seus servidores. Ele roda em Linux, Windows, macOS, Raspberry Pi ou qualquer dispositivo capaz de executar Go.

O Checkmate foi testado sob carga com mais de 1.000 monitores ativos, sem problemas nem gargalos de desempenho notáveis.

## 📚 Sumário

- [📦 Demo](#demo)
- [🔗 Guia do usuário](#users-guide)
- [🛠️ Instalação](#installation)
- [🚀 Desempenho](#performance)
- [💚 Perguntas & ideias](#questions--ideas)
- [🧩 Funcionalidades](#features)
- [🏗️ Capturas de tela](#screenshots)
- [🏗️ Stack tecnológica](#tech-stack)
- [🔗 Alguns links](#a-few-links)
- [🤝 Contribuindo](#contributing)


<a id="demo"></a>
## Demo

A versão mais recente do [Checkmate](https://demo.checkmate.so/) está disponível para testar.

O usuário é demouser@demo.com e a senha é Demouser1!. (O servidor de demonstração é atualizado de tempos em tempos; se não estiver no ar, avise a gente no canal Discussions.)

<a id="users-guide"></a>
## Guia do usuário

As instruções de uso estão [aqui](https://checkmate.so/docs).

## Pré-requisitos
- [Docker](https://www.docker.com/) instalado
- [Git](https://git-scm.com/) instalado

<a id="installation"></a>
## Instalação

As instruções de instalação estão no [portal de documentação do Checkmate](https://checkmate.so/docs).

Como alternativa, você pode usar [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (África do Sul), [Cloudzy](https://cloudzy.com/marketplace/checkmate) ou [Pikapods](https://www.pikapods.com/) para subir rapidamente uma instância. Para monitorar a infraestrutura dos seus servidores, é preciso o [agente Capture](https://github.com/bluewave-labs/capture); o repositório do Capture também traz as instruções de instalação.

### Usando uma CA própria

Se você precisa monitorar endpoints HTTPS internos com certificados de autoridades certificadoras privadas (como Smallstep), confira nosso [guia de confiança em CA personalizada](../custom-ca-trust.md) com as opções de configuração para o Docker.

Para mais documentação, veja o [diretório docs](../).

<a id="performance"></a>
## Desempenho

Graças a muitas otimizações, o Checkmate roda com uma pegada de memória excepcionalmente baixa e precisa de muito pouca memória e CPU. Veja o uso de memória de uma instância Node.js em um servidor monitorando 323 servidores a cada minuto:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Você pode ver a pegada de memória do MongoDB e Redis no mesmo servidor (398 MB e 15 MB) para a mesma quantidade de servidores:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Perguntas & ideias

Se tiver perguntas, sugestões ou comentários, há várias opções:

- [Discord](https://discord.gg/NAb6H3UTjK) (preferido)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (passamos por lá de vez em quando)

Fique à vontade para perguntar ou compartilhar ideias — a gente adora ouvir você!

<a id="features"></a>
## Funcionalidades

- Totalmente open source, pode ser instalado nos seus próprios servidores ou em dispositivos domésticos (ex.: Raspberry Pi 4 ou 5)
- Vários tipos de monitoramento: uptime, Docker, ping, SSL, porta, servidor de jogos
- Monitoramento de velocidade de páginas
- Monitoramento de infraestrutura (memória, disco, desempenho de CPU, rede etc.) — requer o agente [Capture](https://github.com/bluewave-labs/capture)
  - Monitoramento seletivo de disco com escolha de pontos de montagem
- Incidentes num só lugar
- Páginas de status com 4 temas bem feitos
- Notificações por e-mail, webhooks, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Manutenções agendadas
- Monitoramento por consulta JSON
- Suporte a múltiplos idiomas: árabe, chinês (simplificado), chinês (tradicional, Taiwan), tcheco, inglês, finlandês, francês, alemão, japonês, português (Brasil), russo, espanhol, tailandês, turco, ucraniano e vietnamita


## Ciclo de vida do monitor

1. Um monitor executa uma verificação (HTTP / ping / porta / hardware via agente Capture)
2. O resultado é armazenado (sucesso/falha + tempo de resposta)
3. Os resultados recentes são avaliados em relação ao limite de mudança de status configurado
4. Se o limite for atingido e o status atual diferir do anterior, o estado do monitor muda (ex.: `initializing`, `up`, `down`, `breached`)
5. Em uma mudança de estado, um incidente é criado ou resolvido conforme o status atual do monitor
6. As notificações são disparadas com base na configuração

<a id="screenshots"></a>
## Capturas de tela

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
## Stack tecnológica

- [ReactJs](https://react.dev/)
- [MUI (framework React)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- E muitos outros componentes de código aberto!

<a id="a-few-links"></a>
## Alguns links

- Para nos apoiar, deixe uma ⭐ e clique em "watch".
- Tem dúvida ou sugestão sobre o roadmap ou as funcionalidades? Aparece no [Discord](https://discord.gg/NAb6H3UTjK) ou no fórum [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Quer ser avisado a cada novo lançamento? [Newreleases](https://newreleases.io/) é um serviço gratuito que acompanha releases.
- Assista a um [vídeo de instalação e uso do Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## Contribuindo

Somos [Alex](http://github.com/ajhollid) (líder de equipe), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) e [Karen](https://github.com/karenvicent), e ajudamos pessoas e empresas a monitorar a infraestrutura e os servidores delas.

Cuidamos para construir relações sólidas com contribuidores em qualquer nível. Apesar de novo, o Checkmate já passou de 7.000 estrelas e mais de 90 contribuidores ao redor do mundo.

Funcionários do **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes e NEC** já deram estrela no nosso repositório — então fique à vontade para entrar, contribuir e aprender com a gente.

Como contribuir:

0. Dê uma estrela neste repositório :)
1. Leia o [guia do contribuidor](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Se for sua primeira vez, dê uma olhada na tag `good-first-issue` primeiro.
2. Para mergulhar na arquitetura, leia a [estrutura detalhada do Checkmate](https://deepwiki.com/bluewave-labs/Checkmate).
3. Abra uma issue se achar que encontrou um bug.
4. Se você é novo por aqui, procure pelas tags `good-first-issue`.
5. Abra uma pull request para adicionar funcionalidades, melhorar pequenas coisas ou corrigir bugs.
6. Veja o tour interativo pela base de código do `Checkmate` no CodeCanvas [aqui](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Para refinar simulações de fluxo de dados ou criar novas, siga o tutorial rápido [aqui](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
