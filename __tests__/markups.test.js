/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const fs = require('fs')
const chai = require('chai')
const glob = require('glob')
const cheerio = require('cheerio')
const { expect } = chai

describe('Blogger Default Markup', () => {
  const files = glob.sync('./dist/*.xml')

  files.forEach((file) => {
    const template = fs.readFileSync(file, 'utf-8')
    const $ = cheerio.load(template, { xmlMode: true })
    const markups = $('b\\:defaultmarkup')

    describe(`File: ${file}`, () => {
      it('all <b:defaultmarkup> tags should be direct children of <b:defaultmarkups>', function () {
        markups.each(function () {
          const parent = $(this).parent().get(0).tagName
          expect(parent).to.equal('b:defaultmarkups')
        })
      })

      it('should have valid <b:defaultmarkup> tags', () => {
        const validTypes = [
          'All', 'Common', 'AdSense', 'Blog', 'BlogArchive', 'BlogList', 'BlogSearch',
          'ContactForm', 'FeaturedPost', 'Feed', 'Header', 'HTML',
          'Image', 'Label', 'LinkList', 'PageList', 'PopularPosts',
          'Profile', 'Stats', 'Subscribe', 'Text', 'TextList',
          'Translate', 'Wikipedia'
        ]

        markups.each(function () {
          const type = $(this).attr('type')
          expect(type).to.exist

          const types = type.split(',')
          types.forEach((type) => {
            expect(validTypes, `Invalid markup type: ${type}. Valid types: ${validTypes}`).to.include(type.trim())
          })
        })
      })

      it('should only contain <b:includable> tags inside <b:defaultmarkup> tags', () => {
        const defaultMarkups = $('b\\:defaultmarkup')
        defaultMarkups.each(function () {
          const includables = $(this).find('b\\:includable')
          expect(includables.length).to.equal($(this).children().length)
        })
      })
    })
  })
})
