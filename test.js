
const pathToProperty = require('./index')
const assert = require('assert')
const { describe, it } = require('mocha')

const testCases = [
  {
    path: 'child1.child2.["good.talk":up with the local industries].reasons.1."say.it"',
    object: { child1: { child2: [{ 'good.talk': 'up with the local industries', reasons: [{ 'say.it': 'local devs' }, { 'say.it': 'local jobs' }] }] } },
    expectedResult: 'local jobs'
  },
  {
    path: "child1.child2.['good.talk':up with the local industries].reasons.1.'say.it'",
    object: { child1: { child2: [{ 'good.talk': 'up with the local industries', reasons: [{ 'say.it': 'local devs' }, { 'say.it': 'El Salvador' }] }] } },
    expectedResult: 'El Salvador'
  },
  {
    // number find
    path: "child1.child2.['good.talk':12.4].reasons.1.'say.it'",
    object: { child1: { child2: [{ 'good.talk': 12.4, reasons: [{ 'say.it': 'local devs' }, { 'say.it': 'ARG devs' }] }] } },
    expectedResult: 'ARG devs'
  },
  {
    // nested find properties
    path: '[country.code:AR].softwareCompanies.[website:redjar.com.ar].features.0',
    object: [
      {
        country: { code: 'AR' },
        softwareCompanies: [
          { website: 'redjar.com.ar', features: ['great people', 'great environment'] },
          { website: 'other.com.ar', features: ['other people', 'other environment'] }

        ]
      },
      { code: 'BR', softwareCompanies: [{ website: 'other.com.br', features: ['other people', 'other environment'] }] }
    ],
    expectedResult: 'great people'
  },
  {
    // boolean filter
    path: '[code:AR].softwareCompanies.[website:true].features.0',
    object: [
      {
        code: 'AR',
        softwareCompanies: [
          { website: true, features: ['true great people', 'great environment'] },
          { website: 'other.com.ar', features: ['other people', 'other environment'] }

        ]
      },
      { code: 'BR', softwareCompanies: [{ website: 'other.com.br', features: ['other people', 'other environment'] }] }
    ],
    expectedResult: 'true great people'
  }
]

describe('Path to property', function () {
  describe('getProperty(object, path)', function () {
    testCases.forEach((element, index) => {
      it('testCases[' + index + '] should return expectedResult: ' + element.expectedResult, function () {
        assert.strictEqual(pathToProperty(element.object, element.path), element.expectedResult, 'Wrong expected property for testCase[' + index + ']')
      })
    })
  })
})
