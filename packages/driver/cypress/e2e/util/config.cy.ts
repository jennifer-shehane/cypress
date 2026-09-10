import $SetterGetter from '../../../src/cypress/setter_getter'
import { getMochaOverrideLevel, validateConfig } from '../../../src/util/config'

import type { StateFunc } from '../../../src/cypress/state'

// $SetterGetter isn't generic over the state it holds, so cast it the same way
// the driver itself does when it builds `cy.state` in src/cypress.ts
const createState = (state: Record<string, any>) => {
  return $SetterGetter.create(state) as unknown as StateFunc
}

describe('driver/src/cypress/validate_config', () => {
  describe('getMochaOverrideLevel', () => {
    it('returns override level of undefined', () => {
      const state = createState({
        duringUserTestExecution: true,
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.be.undefined
    })

    it('returns override level of test:before:run:async', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _fired: { 'runner:test:before:run': true, 'runner:test:before:run:async': true },
        },
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.be.undefined
    })

    it('returns override level of restoring', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'restoring' },
        },
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.eq('restoring')
    })

    it('returns override level of suite', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'suite' },
        },
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.eq('suite')
    })

    it('returns override level of test', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'test' },
        },
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.eq('test')
    })

    it('returns override level of fileLoad', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: undefined,
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.be.undefined
    })
  })

  describe('validate config', () => {
    it('does not throw for non-cypress configuration options', () => {
      const state = createState({
        duringUserTestExecution: false,
      })

      expect(() => validateConfig(state, { hello: 'world' })).not.to.throw()
    })

    describe('ensures override level', () => {
      it('throws when config override level is never', () => {
        const state = createState({
          duringUserTestExecution: true,
          specWindow: { Error },
          runnable: { type: 'suite' },
        })
        const overrideLevel = getMochaOverrideLevel(state)

        expect(overrideLevel).to.be.undefined

        expect(() => {
          validateConfig(state, { chromeWebSecurity: true })
        }).to.throw(`\`Cypress.config()\` can never override \`chromeWebSecurity\` because it is a read-only configuration option.`)
      })

      describe('when config override level is suite', () => {
        it('does not throw when runtime level is suite', () => {
          const state = createState({
            duringUserTestExecution: false,
            test: {
              _testConfig: { applied: 'suite' },
            },
            specWindow: { Error },
          })
          const overrideLevel = getMochaOverrideLevel(state)

          expect(overrideLevel).to.eq('suite')

          expect(() => {
            validateConfig(state, { testIsolation: true })
          }).not.to.throw()
        })

        it('throws when runtime level is not suite', () => {
          const state = createState({
            duringUserTestExecution: false,
            test: {
              _testConfig: { applied: 'test' },
            },
            specWindow: { Error },
          })
          const overrideLevel = getMochaOverrideLevel(state)

          expect(overrideLevel).to.eq('test')

          expect(() => {
            validateConfig(state, { testIsolation: true })
          }).to.throw(`The \`testIsolation\` configuration can only be overridden from a suite-level override.`)
        })
      })

      describe('when config override level is suite', () => {
        it('and config override is read-only', () => {
          const state = createState({
            duringUserTestExecution: false,
            specWindow: { Error },
          })
          const overrideLevel = getMochaOverrideLevel(state)

          expect(overrideLevel).to.be.undefined

          expect(() => {
            validateConfig(state, { chromeWebSecurity: true })
          }).to.throw(`\`Cypress.config()\` can never override \`chromeWebSecurity\` because it is a read-only configuration option.`)
        })

        ;['test', 'suite'].forEach((mocha_runnable) => {
          it(`and config override level is ${mocha_runnable}`, () => {
            const state = createState({
              duringUserTestExecution: false,
              test: {
                _testConfig: { applied: mocha_runnable },
              },
              specWindow: { Error },
            })
            const overrideLevel = getMochaOverrideLevel(state)

            expect(overrideLevel).to.eq(mocha_runnable)

            expect(() => {
              validateConfig(state, { chromeWebSecurity: false })
            }).to.throw(`The \`chromeWebSecurity\` configuration can never be overridden because it is a read-only configuration option.`)
          })
        })
      })
    })

    it('skips checking override level when opted-out', () => {
      const state = createState({
        duringUserTestExecution: true,
        specWindow: { Error },
        runnable: { type: 'test' },
      })

      const skipOverrideCHeck = true

      expect(() => {
        validateConfig(state, { chromeWebSecurity: true }, skipOverrideCHeck)
      }).not.to.throw()
    })

    it('skips checking override level when restoring global configuration before next test', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'restoring' },
        },
        specWindow: { Error },
      })

      expect(() => {
        validateConfig(state, { testIsolation: true })
      }).not.to.throw()
    })

    it('throws when invalid configuration value', () => {
      const state = createState({
        duringUserTestExecution: true,
        specWindow: { Error },
        runnable: { type: 'test' },
      })

      expect(() => {
        validateConfig(state, { viewportHeight: '300' })
      }).to.throw(`Expected \`viewportHeight\` to be a number.\n\nInstead the value was: \`"300"\``)
    })
  })
})
