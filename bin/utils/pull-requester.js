const commons = [
  '.eslintrc.js',
  '.gitignore',
  '.prettierrc',
  'package.json',
  'README.md',
  'yarn.lock',
]

export default {
  branch1: {
    pathsToInclude: [...commons, 'folder1/'],
  },
  branch2: {
    pathsToInclude: [...commons, 'folder2/'],
  },
  branch3: {
    pathsToInclude: [...commons, 'folder3/'],
  },
}
