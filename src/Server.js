'use strict'

const Express = require('express')
const BodyParser = require('body-parser')
const path = require('path')
const getEndpoints = require('./endpoints/get')

class Server {
  constructor () {
    this.functions = []
    this.log = console.log
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
    this.app.listen(port, _ => {
      this.log(`Listening on port ${port} for requests 🚀`)
      this.log('----')
      this.functions.forEach(func => {
        this.log(`${func.name}:`)
        func.endpoints.forEach(endpoint => {
          this.log(`  ${endpoint.method} http://localhost:${port}${endpoint.path}`)
        })
      })
      this.log('----')
    })
  }
  // Sets functions, including endpoints, using the serverless config and service path
  setFunctions (serverlessConfig, servicePath) {
    this.functions = Object.keys(serverlessConfig.functions).map(name => {
      let functionConfig = serverlessConfig.functions[name]
      let handlerParts = functionConfig.handler.split('.')
      return {
        name: name,
        config: serverlessConfig.functions[name],
        handlerModulePath: path.join(servicePath, handlerParts[0]),
        handlerFunctionName: handlerParts[1],
        environment: Object.assign({}, serverlessConfig.provider.environment, functionConfig.environment)
      }
    }).map(func =>
      Object.assign({}, func, { endpoints: getEndpoints(func) })
    ).filter(func =>
      func.endpoints.length > 0
    )
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
      // Set new environment variables
      Object.assign(process.env, { IS_LOCAL: true }, func.environment)

      // Load function and variables
      let handle = require(func.handlerModulePath)[func.handlerFunctionName]
      let context = { succeed: resolve, fail: reject }
      let callback = (error, result) => (!error) ? resolve(result) : reject(error)

      // Execute it!
      handle(event, context, callback)
    })
  }
}

module.exports = Server
