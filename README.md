Serverless Local Dev Server Plugin With Multi Project Support
=============================================================

[![Build Status](https://travis-ci.org/exocom/serverless-local-dev-server.svg)](https://travis-ci.org/exocom/serverless-local-dev-server)

### This is a fork of the Local Dev Server Plugin from  [DieProduktMacher/serverless-local-dev-server](https://github.com/DieProduktMacher/serverless-local-dev-server)

This plugin exposes Alexa-Skill and HTTP events as local HTTP endpoints, removing the need to deploy every code change to AWS Lambda. You can connect these endpoints to Alexa, Facebook Messenger or other services via forwardhq, ngrok or any other forwarding service.

Supported features:

* Expose `alexa-skill` and `http` events as local HTTP endpoints
* Environment variables
* Basic HTTP integration
* Auto reload via nodemon (see *How To*)

This package requires node >= 6.0


# How To

### 1. Install the plugin

```sh
npm install @kalarrs/serverless-local-dev-server --save-dev
```

### 2. Add the plugin to your serverless configuration file

*serverless.yml* configuration example:

```yaml
provider:
  name: aws
  runtime: nodejs6.10

functions:
  hello:
    handler: handler.hello
    events:
      - alexaSkill
      - http: GET /hello

# Add serverless-local-dev-server to your plugins:
plugins:
  - "@kalarrs/serverless-local-dev-server"

# if needed add folder for serving static files if necessary (relative to service path)
custom:
  localDevStaticFolder: path/to/static/files
```



### 3. Start the server

```sh
serverless local-dev-server
```

On default the server listens on port 5005. You can specify another one with the *--port* argument:

```sh
serverless local-dev-server --port 5000
```

To automatically restart the server when files change, you may use nodemon:

```sh
nodemon --exec "serverless local-dev-server" -e "js yml json"
```

To see responses returned from Lambda and stack traces, prepend SLS_DEBUG=*

```sh
SLS_DEBUG=* serverless local-http-server
```

### 4. For Alexa Skills

#### 4.1 Share localhost with the internet

For example with forwardhq:

```sh
forward 5005
```

#### 4.2 Configure AWS to use your HTTPS endpoint

In the Configuration pane, select HTTPS as service endpoint type and specify the forwarded endpoint URL.

As method for SSL Certificate validation select *My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority*.


# License & Credits

Licensed under the MIT license.

