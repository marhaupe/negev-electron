import { system, filesystem } from 'gluegun'

const src = filesystem.path(__dirname, '..')

const cli = async (cmd): Promise<string> =>
  system.run(
    'node ' + filesystem.path(src, 'bin', 'graphql-loadtest-cli') + ` ${cmd}`
  )

test('outputs version', async () => {
  const output = await cli('--version')
  expect(output).toContain('0.0.1')
})

test('outputs help', async () => {
  const output = await cli('--help')
  expect(output).toContain('0.0.1')
})
