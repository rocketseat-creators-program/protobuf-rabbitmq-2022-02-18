<img src="https://storage.googleapis.com/golden-wind/experts-club/capa-github.svg" />

# Tipagem de mensagens com Protobuf

Nesta aula vamos aprendemos como podemos tipar mensagens assíncronas e eventos de mensageria usando protobuf. Apresentado por [Lucas Santos][1].

> __Atenção__: Este é o projeto completo, se você está procurando o projeto de template, vá para [este repositório](https://github.com/rocketseat-experts-club/template-protobuf-rabbitmq)

## Instalação

1. Clone o repositório
2. Instale as dependencias indo até as pastas `producer` e `consumer` e rodando `npm install`
3. Na raiz do projeto, execute o comando `docker compose up -d` para iniciar o servidor do RabbitMQ
4. Use o comando `source .envrc && npm run start:producer` para criar um produtor e `source .envrc && npm run start:consumer` para criar um consumidor
5. Abra o navegador em `http://localhost:8080` faça login com o usuário `guest` e a senha `guest` para ver os status do broker

## Expert

| [<img src="https://github.com/khaosdoctor.png" width="75px;"/>][1] |
| :-: |
|[Lucas Santos][1]|


[1]: https://lsantos.dev
