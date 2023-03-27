/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const fs = require('fs')
const chai = require('chai')
const glob = require('glob')
const cheerio = require('cheerio')
const { expect } = chai

function extractTags (xml) {
  const tagsRegex = /<(Variable|Group)(\s[^>]*)?>/g
  const matches = xml.match(tagsRegex)
  if (matches) {
    return matches
  }
  return []
}

describe('Blogger Skin', () => {
  const files = glob.sync('./dist/*.xml')

  files.forEach((file) => {
    const template = fs.readFileSync(file, 'utf-8')
    const $ = cheerio.load(template, { xmlMode: true })
    const Groups = $('Group')
    const Variables = $('Variable')
    const skinContent = $('b\\:skin').text()
    const tags = extractTags(skinContent)

    describe(`File: ${file}`, () => {
      it('should have all "Variable" tags inside a "<b:skin>" tag', () => {
        Variables.each(function () {
          const parent = this.parent.name
          expect($(this).parent().is('b\\:skin'), `Invalid parent tag for <Variable> tag: ${parent}`).to.be.true
        })
      })

      it('should have all <Group> tags inside <b:skin> tag', () => {
        Groups.each(function () {
          const parent = this.parent.name
          expect(parent).to.equal('b\\:skin', `Invalid parent tag for <Group> tag: ${parent}`)
        })
      })

      it('should have valid <Group> tags', () => {
        tags.forEach((tag) => {
          if (tag.startsWith('<Group')) {
            const group = cheerio.load(tag, { xmlMode: true })('Group')[0]
            const allowedAttrs = ['description', 'selector']
            const attrs = Object.keys(group.attribs)

            attrs.forEach((attr) => {
              expect(allowedAttrs.includes(attr), `Invalid attribute "${attr}". Allowed attributes: ${allowedAttrs}`).to.be.true
            })

            const description = group.attribs.description
            expect(description, '<Group> tag must have a valid "description" attribute').to.exist.and.not.be.empty
          }
        })
      })

      it('should have valid <Variable> tags', () => {
        const usedNames = new Set()

        tags.forEach((tag) => {
          if (tag.startsWith('<Variable')) {
            const variable = cheerio.load(tag, { xmlMode: true })('Variable')[0]
            const allowedAttrs = [
              'name', 'description', 'type', 'default', 'value',
              'color', 'red', 'green', 'blue', 'alpha',
              'family', 'size',
              'min', 'max',
              'hideEditor'
            ]

            const attrs = Object.keys(variable.attribs)

            // Check required attributes
            const requiredAttrs = ['name', 'description', 'type', 'value']
            const allowedTypes = ['color', 'font', 'length', 'background', 'url', 'string', 'automatic']
            const type = variable.attribs.type

            // Check if type is valid
            expect(allowedTypes.includes(type), `Invalid value "${type}" in type. Allowed values: ${allowedTypes}`).to.be.true

            // if type is not string, then default is required
            if (type !== 'string') {
              requiredAttrs.push('default')
            }

            // if type is length, then min and max are required
            if (type === 'length') {
              requiredAttrs.push('min')
              requiredAttrs.push('max')
            }

            // Check if all required attributes are present
            requiredAttrs.forEach((attr) => {
              expect(attrs.includes(attr), `Missing required attribute "${attr}"`).to.be.true
            })

            // Check if all attributes are allowed
            attrs.forEach((attr) => {
              expect(allowedAttrs.includes(attr), `Invalid attribute "${attr}". Allowed attributes: ${allowedAttrs}`).to.be.true
            })

            // Check if name is unique and valid
            const name = variable.attribs.name
            expect(name, 'Variable name is required').to.exist.and.not.be.empty
            expect(/^[a-zA-Z0-9.]+$/.test(name), `Invalid value "${name}" in name. Only letters, numbers and dots are allowed`).to.be.true
            expect(usedNames.has(name), `Variable name "${name}" is already used`).to.be.false
            usedNames.add(name)
          }
        })
      })
    })
  })
})
