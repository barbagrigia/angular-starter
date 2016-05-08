const path = require('path')
const { camel, pascal, kebab } = require('case')
const yeoman = require('yeoman-generator')
const { getConstants } = require('../../testHelper')

const pageNamePromptTemplate = `
Angular page’s name: "$ yo as:page index";
page will be initialized in created file app/pages/index/index.js
`

module.exports = yeoman.Base.extend({
  constructor: function (...args) { // eslint-disable-line
    yeoman.Base.apply(this, args)
    this.argument('pageName', {
      type: String,
      filter: camel,
      desc: pageNamePromptTemplate,
    })
  },
  writing() {
    const constants = getConstants(this)
    const create = (template, dest) => {
      if (dest === undefined) {
        dest = template // eslint-disable-line
      }
      this.fs.copyTpl(
        this.templatePath(template),
        this.destinationPath(path.join(`app/pages/${this.pageName}/`, dest)),
        { pageName: this.pageName, pascal, kebab, constants }
      )
    }
    const files = [
      'index.js',
      'template.jade',
      'style.sss',
    ]
    files.forEach(file => create(file))
  },
})