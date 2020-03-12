const commons = [
  '.eslintrc.js',
  '.gitignore',
  '.prettierrc',
  'package.json',
  'README.md',
  'yarn.lock',
]

/**
 * whitelist: se deben indicar las rutas de los archivos y/o
 * folders a ser tomados en cuenta para el merge del branch de origen
 * al branch de destino. Por ejemplo si en la lista dice ['folder1/']
 * cuándo haga el merge, al destino solo se va mergear los cambios en
 * folder1 aunque exista un folder2 y se le hayan echo cambios.
 * reviewers: los reviewer son las personas por defecto asignadas
 * para que revisen el Pull Request y lo aprueben.
 */
export const config = {
  branch1: {
    whitelist: [...commons, 'folder1/'],
    reviewers: ['chicus12'],
  },
  branch2: {
    whitelist: [...commons, 'folder2/'],
    reviewers: ['chicus12'],
  },
  branch3: {
    whitelist: [...commons, 'folder3/'],
    reviewers: ['chicus12'],
  },
}

export const branches = Object.keys(config).map(branch => branch)

export const REPO = 'test-github-pr-restrict-folder.git'

export const GITHUB_ORGANIZATION = 'Test-Merge-Requester'
