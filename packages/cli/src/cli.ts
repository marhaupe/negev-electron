import { build, GluegunToolbox } from 'gluegun'

export async function run(argv): Promise<GluegunToolbox> {
  const cli = build()
    .brand('graphql-loadtest-cli')
    .src(__dirname)
    .plugins('./node_modules', {
      matching: 'graphql-loadtest-cli-*',
      hidden: true,
    })
    .help()
    .version()
    .create()

  const toolbox = await cli.run(argv)
  return toolbox
}
