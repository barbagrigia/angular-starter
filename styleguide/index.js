const R = require('ramda')
const path = require('path')
const fs = require('fs-promise')
const marked = require('marked')
const express = require('express')
const postcss = require('postcss-middleware')


const view = template => path.join(__dirname, 'views', template)

module.exports = options => {
  const constants = options.constants
  const componentsDir = options.componentsDir
  const styleguideMiddleware = express.Router() // eslint-disable-line

  const getComponentsNames = () => fs.readdir(componentsDir)

  const getComponentDoc = component => {
    const docPath = path.join(componentsDir, component, 'README.md')
    return fs.readFile(docPath, 'utf-8').then(marked)
  }

  const resolve = baseUrl => function () {
    const args = Array.from(arguments)
    return R.apply(path.join, R.insert(0, baseUrl, args))
  }

  const getComponentsData = () => {
    return getComponentsNames()
      .then(components => {
        return Promise.all([components, Promise.all(components.map(getComponentDoc))])
      })
      .then(args => {
        const components = args[0]
        const componentsDocs = args[1]
        return R.zipWith((name, doc) => ({ name, doc }), components, componentsDocs)
      })
      .catch(console.error)
  }


  styleguideMiddleware.use('/styles', postcss({
    src(req) {
      return path.join(__dirname, 'styles', req.path)
    },
    plugins: [
      require('postcss-import')(),
      require('precss')(),
      require('postcss-cssnext')(),
    ],
    options: {
      parser: require('sugarss'),
    },
  }))
  styleguideMiddleware.use(express.static('node_modules/github-markdown-css'))

  styleguideMiddleware.get('/', (req, res) => {
    getComponentsData()
      .then(components => {
        res.render(view('styleguide.jade'), {
          resolve: resolve(req.baseUrl),
          components,
          constants,
        })
      })
  })

  styleguideMiddleware.get('/:component', (req, res) => {
    getComponentsData()
      .then(components => {
        const findComponent = R.find(R.propEq('name', req.params.component))
        const componentData = findComponent(components)
        if (!componentData) {
          return res.status(404).send('Component not found')
        }
        return res.render(view('component.jade'), {
          resolve: resolve(req.baseUrl),
          name: req.params.component,
          doc: componentData.doc,
          components,
          constants,
        })
      })
      .catch(console.error)
  })

  return styleguideMiddleware
}
