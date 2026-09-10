describe('blob-util 2.x', () => {
  const { Promise } = Cypress

  // blob-util types each method against its own input, but this suite deliberately passes a string through every one of them, so look them up as plain converters
  const blobUtil = Cypress.Blob as unknown as Record<string, (value: string) => Blob>

  const conversions: [string, string][] = [
    ['arrayBufferToBlob', '1234'],
    ['base64StringToBlob', '1234'],
    ['binaryStringToBlob', '0100101'],
    ['dataURLToBlob', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='],
  ]

  // https://github.com/cypress-io/cypress/issues/8365
  conversions.forEach(([method, value]) => {
    it(`Cypress.Blob.${method} does not error when wrapped by Promise methods`, () => {
      return Promise.all([
        Promise.resolve(blobUtil[method](value)),
        Promise.try(() => blobUtil[method](value)),
      ])
    })

    it(`Cypress.Blob.${method} does not error with 5.0.0 workaround`, () => {
      // this is the 5.0.0 workaround that the cypress-file-upload plugin uses
      const wrapBlob = (blob: Blob & { then?: unknown }) => {
        delete blob.then

        return Cypress.Promise.resolve(blob)
      }

      return Promise.all([
        Promise.resolve(wrapBlob(blobUtil[method](value))),
        Promise.try(() => wrapBlob(blobUtil[method](value))),
      ])
    })
  })
})
