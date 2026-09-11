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

  // 5.0.0 attached a breaking-change `then` to these return values, which made the Blob thenable and broke Promise wrapping. that wrapping is long gone, so these guard against it coming back
  // https://github.com/cypress-io/cypress/issues/8365
  conversions.forEach(([method, value]) => {
    it(`Cypress.Blob.${method} does not error when wrapped by Promise methods`, () => {
      return Promise.all([
        Promise.resolve(blobUtil[method](value)),
        Promise.try(() => blobUtil[method](value)),
      ])
    })
  })
})
