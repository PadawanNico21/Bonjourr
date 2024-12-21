const { generate } = require('./generator')

async function hasher() {
    const { data } = await generate()

    const hashes = {}

    let incr = 0
    for (const key of Object.keys(data)) {
        hashes[key] = (incr++).toString(36)
    }

    return hashes
}

module.exports = { hasher }
