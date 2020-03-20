const commons = {
  files: [
    '.eslintrc.js',
    '.gitignore',
    '.prettierrc',
    'package.json',
    'README.md',
    'yarn.lock',
  ],
  preconditions:
    '1- Tener yarn instalado:\n   $ yarn --version\n2- Tener git instalado:\n   $ git --version\n3- Tener nodejs instalado:\n   $ node --version\n4- Tener pm2 instalado:\n   $ pm2 --version',
  installation:
    '1- Estar en el directorio raíz del paquete:\n   $ cd :path\n2- Obtener los últimos cambios de github:\n    $ git pull origin :branch\n3- Instalar los paquetes de node necesarios:\n    $ yarn install\n4- Ejecutar el launch script:\n    $ :executionScript',
  verification:
    '1- Listar los procesos que están activos en pm2:\n    $ pm2 list\n2- De la tabla/lista que de se despliega, verificar que exista un ítem con el nombre :name\n3- Verificar que en la lista/tabla el ítem con el nombre :name el campo status no indique error\n4- Verificar que no exista ningún error reciente en los logs de pm2:\n    $ pm2 logs :name --lines 100',
  rollback:
    '1- Hacer checkout al commit anterior:\n    $ git checkout :lastCommitSHA\n2- Reiniciar pm2:\n    $ pm2 restart :name',
}

/**
 * whitelist: se deben indicar las rutas de los archivos y/o
 * folders a ser tomados en cuenta para el merge del branch de origen
 * al branch de destino. Por ejemplo si en la lista dice ['folder1/']
 * cuándo haga el merge, al destino solo se va mergear los cambios en
 * folder1 aunque exista un folder2 y se le hayan hecho cambios.
 * utilice . para incluir todos los files
 * reviewers: los reviewer son las personas por defecto asignadas
 * para que revisen el Pull Request y lo aprueben.
 * labels: los labels son la lista de tags con las
 * que quiere etiquetar el Pull Request
 * pm2: información que respecta a pm2
 * steps: pasos de instalación
 */
export const config = {
  branch1: {
    whitelist: [...commons.files, 'folder1/'],
    reviewers: ['chicus12'],
    labels: ['test', 'test2'],
    pm2: {
      name: 'branch1',
      path: 'path',
      executionScript: 'yarn start:project:environment',
    },
    steps: {
      preconditions: commons.preconditions,
      installation: commons.installation,
      verification: commons.verification,
      rollback: commons.rollback,
    },
  },
  develop: {
    whitelist: ['.'],
    reviewers: ['chicus12'],
    labels: ['test', 'test2'],
    pm2: {
      name: 'branch1',
      path: 'path',
      executionScript: 'yarn start:project:environment',
    },
    steps: {
      preconditions: commons.preconditions,
      installation: commons.installation,
      verification: commons.verification,
      rollback: commons.rollback,
    },
  },
  branch2: {
    whitelist: [...commons.files, 'folder2/'],
    reviewers: ['chicus12'],
  },
  branch3: {
    whitelist: [...commons.files, 'folder3/'],
    reviewers: ['chicus12'],
  },
}

export const branches = Object.keys(config).map(branch => branch)

export const REPO = 'test-github-pr-restrict-folder.git'

export const GITHUB_ORGANIZATION = 'Test-Merge-Requester'

export const gitActionTypes = {
  a: 'Se agregó el archivo',
  c: 'Se copió el archivo',
  d: 'Se eliminó el archivo',
  m: 'Se modificó el archivo',
  r: 'Se renombró el archivo',
}
