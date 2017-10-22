'use strict'

// Invokes the succeed callback
module.exports.succeed = (_, context) => {
  context.succeed()
}

// Invokes the fail callback
module.exports.fail = (_, context) => {
  context.fail(new Error('Some reason'))
}

// Returns process.env
module.exports.mirrorEnv = (request, context) => {
  context.succeed(process.env)
}

// Succeed if request object has correct form
module.exports.alexaSkill = (request, context) => {
  if (!request.session) {
    context.fail(new Error('session-object not in request JSON'))
  } else if (!request.request) {
    context.fail(new Error('request-object not in request JSON'))
  } else if (request.version !== '1.0') {
    context.fail(new Error('version not 1.0'))
  } else {
    context.succeed()
  }
}

// Succeed if request object has correct form, returning the request object
module.exports.httpGet = (request, context) => {
  if (request.httpMethod !== 'GET') {
    context.fail(new Error('httpMethod should be GET'))
  } else if (request.body.toString() !== '{}') {
    context.fail(new Error('body should be empty'))
  } else {
    context.succeed({
      headers: {'Content-Type': 'application/json'},
      statusCode: 200,
      body: request
    })
  }
}

// Succeed if request object has correct form
module.exports.httpPost = (request, context) => {
  if (request.httpMethod !== 'POST') {
    context.fail(new Error('httpMethod not POST'))
  } else if (request.body.toString() === '{"foo":"bar"}') {
    context.fail(new Error('body should not be empty'))
  } else {
    context.succeed({
      statusCode: 204
    })
  }
}
