'use strict'

const Express = require('express')
const BodyParser = require('body-parser')
const path = require('path')
const dotenv = require('dotenv')
const getEndpoints = require('./endpoints/get')

class Server {
  constructor () {
    this.functions = []
    this.staticFolder = false
    this.log = console.log
    this.customEnvironment = {}
    // copy initial process.env
    this.processEnvironment = Object.assign({}, process.env)
  }

  // Starts the server
  start (port) {
    if (this.functions.length === 0) {
      this.log('No Lambdas with Alexa-Skill or HTTP events found')
      return
    }
    this.app = Express()
    this.app.use(BodyParser.json())
    this.functions.forEach(func =>
      func.endpoints.forEach(endpoint => this._attachEndpoint(func, endpoint))
    )
    if (this.staticFolder) {
      this.app.use('/static', Express.static(this.staticFolder))
    }
    this.server = this.app.listen(port, _ => {
      this.log(`Listening on port ${port} for requests 🚀`)
      this.log('----')
      this.functions.forEach(func => {
        this.log(`${func.name}:`)
        func.endpoints.forEach(endpoint => {
          this.log(`  ${endpoint.method} http://localhost:${port}${endpoint.path}`)
        })
      })
      if (this.staticFolder) {
        this.log(`StaticFolder`)
        this.log(`  GET http://localhost:${port}/static (${this.staticFolder})`)
        this.app.use('/static', Express.static(this.staticFolder))
      }
      this.log('----')
    })
  }

  // Sets functions, including endpoints, using the serverless config and service path
  setConfiguration (serverlessConfig, servicePath) {
    this.functions = Object.keys(serverlessConfig.functions).map(name => {
      const functionConfig = serverlessConfig.functions[name]
      const [handlerSrcFile, handlerFunctionName] = functionConfig.handler.split('.')
      let handlerPath = Array.isArray(serverlessConfig.plugins) && serverlessConfig.plugins.includes('serverless-webpack')
        ? path.join(servicePath, '/.webpack/service', handlerSrcFile)
        : path.join(servicePath, handlerSrcFile)
      return {
        name: name,
        config: serverlessConfig.functions[name],
        handlerModulePath: handlerPath,
        handlerFunctionName,
        environment: Object.assign({}, serverlessConfig.provider.environment, functionConfig.environment, this.customEnvironment)
      }
    }).map(func =>
      Object.assign({}, func, {endpoints: getEndpoints(func)})
    ).filter(func =>
      func.endpoints.length > 0
    )
    if (serverlessConfig.custom && serverlessConfig.custom.localDevStaticFolder) {
      this.staticFolder = path.join(servicePath, serverlessConfig.custom.localDevStaticFolder)
    }
  }

  // Attaches HTTP endpoint to Express
  _attachEndpoint (func, endpoint) {
    // Validate method and path
    /* istanbul ignore next */
    if (!endpoint.method || !endpoint.path) {
      return this.log(`Endpoint ${endpoint.type} for function ${func.name} has no method or path`)
    }
    // Add HTTP endpoint to Express
    this.app[endpoint.method.toLowerCase()](endpoint.path, (request, response) => {
      this.log(`${endpoint}`)
      // Execute Lambda with corresponding event, forward response to Express
      let lambdaEvent = endpoint.getLambdaEvent(request)
      this._executeLambdaHandler(func, lambdaEvent).then(result => {
        this.log(' ➡ Success')
        if (process.env.SLS_DEBUG) console.info(result)
        endpoint.handleLambdaSuccess(response, result)
      }).catch(error => {
        this.log(` ➡ Failure: ${error.message}`)
        if (process.env.SLS_DEBUG) console.error(error.stack)
        endpoint.handleLambdaFailure(response, error)
      })
    })
  }

  // Loads and executes the Lambda handler
  _executeLambdaHandler (func, event) {
    return new Promise((resolve, reject) => {
      // Load local development environment variables
      const localEnvironment = Object.assign({},
        dotenv.config({path: '.env.local'}).parsed,
        dotenv.config({path: '.local.env'}).parsed,
        dotenv.config({path: 'local.env'}).parsed)
      // set process.env explicitly
      process.env = Object.assign({}, this.processEnvironment, func.environment, localEnvironment)
      const handle = require(func.handlerModulePath)[func.handlerFunctionName]
      const context = {succeed: resolve, fail: reject}
      const callback = (error, result) => (!error) ? resolve(result) : reject(error)

      // Execute it!
      handle(event, context, callback)
    })
  }
}

module.exports = Server
