/**
 * Picks env variables with keys starting with `term`.
 * @param {string} [term] - A starting term of a key to pick.
 * @returns {Record<string, string>}
 */
function pickEnvironmentByKey(term) {
  return Object.entries(process.env).reduce(
    (result, [key, value]) => {
      if (key.startsWith(term)) {
        result[key] = value
      }

      return result
    },

    {},
  )
}

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  images: {formats: ['avif', 'webp'].map((type) => `image/${type}`)},
  output: 'standalone',
  poweredByHeader: false,

  publicRuntimeConfig: {
    ACCEPT_IMAGES_MIME_TYPES: ['avif', 'gif', 'jpeg', 'png', 'svg+xml', 'webp']
      .map((type) => `image/${type}`)
      .join(', '),
    ITEMS_PER_PAGE: 25,
    US_DATE_FORMAT: 'MM/DD/YYYY',
    ...pickEnvironmentByKey('NEXT_PUBLIC_'),
  },

  reactStrictMode: true,
  serverRuntimeConfig: pickEnvironmentByKey('NEXT_SERVER_'),
}
