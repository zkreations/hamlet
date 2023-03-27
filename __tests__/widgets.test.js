/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const fs = require('fs')
const chai = require('chai')
const glob = require('glob')
const cheerio = require('cheerio')
const { expect } = chai

describe('Blogger Syntax', () => {
  const files = glob.sync('./dist/*.xml')

  files.forEach((file) => {
    const template = fs.readFileSync(file, 'utf-8')
    const $ = cheerio.load(template, { xmlMode: true })
    const widgets = $('b\\:widget')

    describe(`File: ${file}`, () => {
      it('all <b:widget> tags should have required attributes and correct format', function () {
        const validTypes = [
          'AdSense', 'Blog', 'BlogArchive', 'BlogList', 'BlogSearch',
          'ContactForm', 'FeaturedPost', 'Feed', 'Header', 'HTML',
          'Image', 'Label', 'LinkList', 'PageList', 'PopularPosts',
          'Profile', 'Stats', 'Subscribe', 'Text', 'TextList',
          'Translate', 'Wikipedia'
        ]

        widgets.each(function () {
          const id = $(this).attr('id')
          const type = $(this).attr('type')

          expect(id).to.exist
          expect(type).to.exist
          expect(validTypes, `Invalid widget type: ${type}. Valid types: ${validTypes}`).to.include(type)

          const idRegex = /^[A-Za-z]+[0-9]{1,3}$/
          expect(id).to.match(idRegex)
          expect(id).to.match(new RegExp(`${type}\\d+$`))
        })
      })

      it('all <b:widget> tags should have a unique "id" attribute', function () {
        const idList = new Set()

        widgets.each(function () {
          const id = $(this).attr('id')
          expect(id).to.exist
          expect(idList.has(id), `Duplicate id attribute: ${id}`).to.be.false
          idList.add(id)
        })
      })

      it('all <b:widget> tags should be direct children of <b:section>', function () {
        widgets.each(function () {
          const parent = $(this).parent().get(0).tagName
          expect(parent).to.equal('b:section')
        })
      })
    })
  })
})
