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


Este repositório contém o frontend e o backend do Checkmate, uma ferramenta de monitoramento de código aberto e auto-hospedável para acompanhar hardware de servidores, disponibilidade, tempos de resposta e incidentes em tempo real com visualizações bonitas. O Checkmate verifica regularmente se um servidor ou site está acessível e funcionando de forma ótima, oferecendo alertas e relatórios em tempo real sobre disponibilidade, indisponibilidade e tempos de resposta dos serviços monitorados.

O Checkmate também possui um agente chamado [Capture](https://github.com/bluewave-labs/capture) para coletar dados de servidores remotos. O Capture não é necessário para rodar o Checkmate, mas fornece informações adicionais sobre o status de CPU, RAM, disco e temperatura dos servidores. O Capture pode rodar em Linux, Windows, Mac, Raspberry Pi ou qualquer dispositivo capaz de executar Go.

O Checkmate passou por testes de estresse com mais de 1000 monitores ativos sem nenhum problema ou gargalo de desempenho notável.

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


## Demo

Você pode ver a versão mais recente do [Checkmate](https://demo.checkmate.so/) em ação.

O usuário é demouser@demo.com e a senha é Demouser1! (Observação: atualizamos o servidor de demonstração de tempos em tempos; se não funcionar, fale conosco no canal Discussions).

## Guia do usuário

As instruções de uso podem ser encontradas [aqui](https://checkmate.so/docs).

## Pré-requisitos
- [Docker](https://www.docker.com/) instalado
- [Git](https://git-scm.com/) instalado

## Instalação

Veja as instruções de instalação no [portal de documentação do Checkmate](https://checkmate.so/docs).

Alternativamente, você pode usar [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (África do Sul), [Cloudzy](https://cloudzy.com/marketplace/checkmate) ou [Pikapods](https://www.pikapods.com/) para subir rapidamente uma instância do Checkmate. Se quiser monitorar sua infraestrutura de servidores, você precisará do [agente Capture](https://github.com/bluewave-labs/capture). O repositório do Capture também contém as instruções de instalação.

### Usando uma CA personalizada

Se você precisa monitorar endpoints HTTPS internos com certificados emitidos por autoridades certificadoras privadas (como Smallstep), veja nosso [Guia de confiança em CA personalizada](../custom-ca-trust.md) para opções de configuração do Docker.

Para mais documentação, veja o [diretório docs](../).

## Desempenho

Graças a otimizações extensas, o Checkmate opera com uma pegada de memória excepcionalmente pequena, exigindo memória e CPU mínimos. Veja o uso de memória de uma instância Node.js em um servidor monitorando 323 servidores a cada minuto:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Você pode ver a pegada de memória do MongoDB e Redis no mesmo servidor (398 MB e 15 MB) para a mesma quantidade de servidores:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

## Perguntas & ideias

Se você tem perguntas, sugestões ou comentários, há várias opções:

- [Canal do Discord](https://discord.gg/NAb6H3UTjK) (preferido)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (passamos por aqui de vez em quando)

Sinta-se à vontade para perguntar ou compartilhar suas ideias — adoramos ouvir você!

## Funcionalidades

- Totalmente código aberto, implantável em seus servidores ou dispositivos domésticos (ex.: Raspberry Pi 4 ou 5)
- Várias opções de monitoramento: disponibilidade, Docker, ping, SSL, porta, servidor de jogos
- Monitoramento de velocidade de página
- Monitoramento de infraestrutura (memória, uso de disco, desempenho de CPU, rede, etc.) — requer o agente [Capture](https://github.com/bluewave-labs/capture)
  - Monitoramento seletivo de disco com escolha de pontos de montagem
- Incidentes em um relance
- Páginas de status com 4 temas elegantes
- Notificações por e-mail, webhooks, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Manutenção agendada
- Monitoramento por consulta JSON
- Suporte a múltiplos idiomas: árabe, chinês (simplificado), chinês (tradicional, Taiwan), tcheco, inglês, finlandês, francês, alemão, japonês, português (Brasil), russo, espanhol, tailandês, turco, ucraniano e vietnamita


## Ciclo de vida do monitor

1. Um monitor executa uma verificação (HTTP / ping / porta / hardware via agente Capture)
2. O resultado é armazenado (sucesso/falha + tempo de resposta)
3. Os resultados recentes são avaliados em relação ao limite de mudança de status configurado
4. Se o limite for atingido e o status atual diferir do anterior, o estado do monitor muda (ex.: `initializing`, `up`, `down`, `breached`)
5. Em uma mudança de estado, um incidente é criado ou resolvido conforme o status atual do monitor
6. As notificações são disparadas com base na configuração

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



## Stack tecnológica

- [ReactJs](https://react.dev/)
- [MUI (framework React)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- E muitos outros componentes de código aberto!

## Alguns links

- Se quiser nos apoiar, considere dar uma ⭐ e clicar em "watch".
- Tem alguma pergunta ou sugestão sobre o roadmap/funcionalidades? Confira nosso [canal do Discord](https://discord.gg/NAb6H3UTjK) ou o fórum [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Quer receber um aviso a cada novo lançamento? Use o [Newreleases](https://newreleases.io/), um serviço gratuito de acompanhamento de releases.
- Assista a um [vídeo de instalação e uso do Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

## Contribuindo

Somos o [Alex](http://github.com/ajhollid) (líder de equipe), o [Gorkem](http://github.com/gorkem-bwl/), o [Aryaman](https://github.com/Br0wnHammer), o [Mert](https://github.com/mertssmnoglu) e a [Karen](https://github.com/karenvicent) — ajudamos indivíduos e empresas a monitorar suas infraestruturas e servidores.

Nos orgulhamos de construir conexões fortes com contribuidores de todos os níveis. Apesar de ser um projeto jovem, o Checkmate já conquistou mais de 7000 estrelas e atraiu mais de 90 contribuidores no mundo todo.

Nosso repositório recebeu estrelas de funcionários do **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes e NEC** — então não se segure: entre, contribua e aprenda com a gente!

Como contribuir:

0. Dê uma estrela neste repositório :)
1. Confira o [guia do contribuidor](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Iniciantes são incentivados a verificar a tag `good-first-issue`.
2. Leia uma estrutura detalhada do [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) se quiser mergulhar na arquitetura.
3. Abra uma issue se acreditar ter encontrado um bug.
4. Procure por `good-first-issue`s se você é novo.
5. Faça um pull request para adicionar novas funcionalidades, melhorias ou correções de bugs.
6. Confira este passo a passo interativo da base de código do `Checkmate` no CodeCanvas [aqui](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Para refinar simulações existentes de fluxo de dados ou criar novas, siga o tutorial rápido [aqui](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
