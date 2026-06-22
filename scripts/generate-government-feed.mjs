import { generateGovernmentFeed, writeGovernmentFeed } from '../src/lib/government-export/index.mjs'

loadLocalEnvFiles()

const args = process.argv.slice(2)
const options = {}

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]

  if (arg === '--date') {
    options.exportDate = args[index + 1]
    index += 1
    continue
  }

  if (arg === '--fixture') {
    options.fixturePath = args[index + 1]
    index += 1
    continue
  }

  if (arg === '--base-url') {
    options.baseUrl = args[index + 1]
    index += 1
    continue
  }

  if (!arg.startsWith('--') && !options.exportDate) {
    options.exportDate = arg
  }
}

const result = await generateGovernmentFeed(options)
await writeGovernmentFeed(result)

console.log(
  JSON.stringify(
    {
      exportDate: result.exportDate,
      csvFiles: result.csvFiles.map((entry) => entry.relativePath),
      feedPath: 'public/otwarte-dane/feed.xml',
      md5Path: 'public/otwarte-dane/feed.md5',
    },
    null,
    2,
  ),
)

function loadLocalEnvFiles() {
  if (typeof process.loadEnvFile !== 'function') {
    return
  }

  for (const fileName of ['.env', '.env.local']) {
    try {
      process.loadEnvFile(fileName)
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'ENOENT') {
        continue
      }

      throw error
    }
  }
}
