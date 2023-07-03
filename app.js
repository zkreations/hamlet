const fs = require('fs')
const path = require('path')
const glob = require('glob')

const Handlebars = require('handlebars')

const sass = require('sass')
const CleanCSS = require('clean-css')
const autoprefixer = require('autoprefixer')
const postcss = require('postcss')

const rollup = require('rollup')
const terser = require('@rollup/plugin-terser')
const commonjs = require('@rollup/plugin-commonjs')
const { babel } = require('@rollup/plugin-babel')
const { nodeResolve } = require('@rollup/plugin-node-resolve')

const chokidar = require('chokidar')

const sourceDir = './src'
const distDir = './dist'
const dataFile = './data.json'

let data = {}

// Handlebars helpers
// If a helper is missing, show a message in the console
Handlebars.registerHelper('helperMissing', function (/* dynamic arguments */) {
  const options = arguments[arguments.length - 1]
  return console.error(`Helper: {{${options.name}}} does not exist`)
})

// Include a file
Handlebars.registerHelper('asset', function readFileHelper (filePath) {
  let fullPath
  if (filePath.startsWith('~')) {
    fullPath = path.join(__dirname, 'node_modules', filePath.slice(1))
  } else {
    fullPath = path.join(__dirname, filePath)
  }

  if (!fs.existsSync(fullPath)) {
    const result = `Error: File ${fullPath} does not exist`
    console.error(result)
    return `/*${result}*/`
  }
  const content = fs.readFileSync(fullPath, 'utf8')
  return new Handlebars.SafeString(content)
})

// Add attributes to an element
Handlebars.registerHelper('attr', function (context) {
  if (typeof context !== 'object' || context === null || Array.isArray(context)) {
    console.warn('The provided argument must be an object')
    return ''
  }

  const attrs = []
  for (const prop in context) {
    // eslint-disable-next-line no-prototype-builtins
    if (context.hasOwnProperty(prop)) {
      attrs.push(prop + '="' + context[prop] + '"')
    }
  }

  return new Handlebars.SafeString(attrs.join(' '))
})

// Create a Blogger variable
Handlebars.registerHelper('variable', function (name = 'null', options) {
  const attributes = []

  const Default = {
    description: name,
    type: 'string',
    value: '',
    ...options.hash
  }

  Object.keys(Default).forEach(key => {
    const escapedKey = Handlebars.escapeExpression(key)
    const escapedValue = Handlebars.escapeExpression(Default[key])
    attributes.push(`${escapedKey}="${escapedValue}"`)
  })

  if (!(attributes.includes('type="string"'))) {
    attributes.push(`default="${Default.value}"`)
  }

  const escapedOutput = `<Variable name="${name}" ${attributes.join(' ')}/>`
  return new Handlebars.SafeString(escapedOutput)
})

// Calculate time of execution of a function
const timer = async (fn, message, ...args) => {
  const currentTime = new Date()
  const dateFormatted = currentTime.toLocaleTimeString('en-US', { hour12: false })

  const start = performance.now()
  const result = await fn(...args)
  const end = performance.now()
  const tiempo = Math.round(end - start)
  console.log(`${dateFormatted} - ${message || fn.name} finish in: ${tiempo}ms`)
  return result
}

// Task to compile Handlebars templates
const compileJS = async () => {
  try {
    const output = path.join(__dirname, distDir, 'js')

    // Get all js files in the source directory, ignoring files that start with "_"
    const files = await new Promise((resolve, reject) => {
      glob(`${sourceDir}/**/!(_)*.js`, (err, files) => {
        if (err) {
          reject(err)
        } else {
          resolve(files)
        }
      })
    })

    if (files.length === 0) {
      return
    }

    // Iterate over the files found and compile each one separately
    for (const file of files) {
      const bundle = await rollup.rollup({
        input: file,
        plugins: [
          nodeResolve(),
          commonjs(),
          babel({
            babelHelpers: 'bundled',
            presets: ['@babel/preset-env']
          })
        ]
      })

      const fileName = path.basename(file, path.extname(file))
      const outputFile = path.join(output, `${fileName}.js`)

      // Generate the output file without minifying it
      await bundle.write({
        file: outputFile,
        format: 'iife'
      })

      // Generate the output file minified
      const minifiedOutputFile = path.join(output, `${fileName}.min.js`)
      await bundle.write({
        file: minifiedOutputFile,
        format: 'iife',
        plugins: [
          terser()
        ]
      })
    }
  } catch (err) {
    console.error(err)
  }
}

// Task to compile Sass files
const compileSass = () => {
  // Search for all .scss and .sass files in the source directory, ignoring files that start with "_"
  const files = glob.sync(`${sourceDir}/**/!(_)*.{scss,sass}`)

  if (files.length === 0) {
    return
  }

  // Iterate over the files found and compile each one separately
  files.forEach(file => {
    const compiled = sass.compile(file)

    let css = compiled.css.toString()
    css = postcss([autoprefixer]).process(css).css

    const minified = new CleanCSS().minify(css).styles
    const fileName = path.basename(file, path.extname(file))

    const output = path.join(__dirname, distDir, 'css')
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true })
    }

    // Write the file without minifying it
    const outputFile = path.join(output, `${fileName}.css`)
    fs.writeFileSync(outputFile, css)

    // Write the file minified
    const minifiedOutputFile = path.join(output, `${fileName}.min.css`)
    fs.writeFileSync(minifiedOutputFile, minified)
  })
}

// Register all partials in the source directory
const registerPartials = (folderPath = sourceDir) => {
  // Search for all files in the source directory, including files that start with "_"
  const files = fs.readdirSync(folderPath).filter(file => {
    const filePath = path.join(folderPath, file)
    const stat = fs.statSync(filePath)
    return (stat.isFile() && file.endsWith('.hbs') && file.startsWith('_')) || stat.isDirectory()
  })

  if (files.length === 0) {
    return
  }

  files.forEach(file => {
    const filePath = path.join(folderPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      // If it's a directory, recursively search for partials
      registerPartials(filePath)
    } else if (file.endsWith('.hbs') && file.startsWith('_')) {
      const partialName = file.slice(1, -4) // Remove the leading "_" and the trailing ".hbs"
      const partialTemplate = fs.readFileSync(filePath, 'utf8')

      Handlebars.registerPartial(partialName, partialTemplate)
    }
  })
}

// Widget Counter Increment
const widgetCounter = (template) => {
  const regex = /<b:widget\s+type='([^']+)'\s+(?!id)([^>]+)>/g
  const typeMap = {}

  const transformedHTML = template.replace(regex, (_, type, attributes) => {
    let counter = 1
    // eslint-disable-next-line no-prototype-builtins
    if (typeMap.hasOwnProperty(type)) {
      counter = typeMap[type] + 1
    }
    typeMap[type] = counter
    const id = `${type}${counter}`
    const transformedAttributes = `id='${id}' type='${type}' ${attributes}`
    return `<b:widget ${transformedAttributes}>`
  })

  return transformedHTML
}

// Compile all Handlebars templates
const compileHbs = (folderPath = sourceDir) => {
  // Register all partials in the source directory
  registerPartials()
  // Search for all files in the source directory, ignoring files that start with "_"
  const files = fs.readdirSync(folderPath).filter(file => {
    const filePath = path.join(folderPath, file)
    const stat = fs.statSync(filePath)
    return (stat.isFile() && file.endsWith('.hbs') && !file.startsWith('_')) || stat.isDirectory()
  })

  if (files.length === 0) {
    return
  }

  files.forEach(file => {
    const filePath = path.join(folderPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      // If it's a directory, recursively search for templates
      compileHbs(filePath)
    } else {
      // Cargar los datos del archivo data.json

      if (fs.existsSync(dataFile)) {
        data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
      }

      const source = fs.readFileSync(filePath, 'utf8')
      const template = Handlebars.compile(source)
      const output = widgetCounter(template(data))
      const outputDir = path.join(__dirname, distDir, `./${file.replace('.hbs', '.xml')}`)

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
      }

      fs.writeFileSync(outputDir, output)
    }
  })
}

// Watch for changes in the source directory
if (process.argv[2] === 'compile') {
  (async () => {
    try {
      await timer(compileJS)
      await timer(compileSass)
      await timer(compileHbs)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })()
} else {
  chokidar.watch(sourceDir, {
    ignored: [
      /(^|[/\\])\../, // Ignore hidden files and folders
      /node_modules/, // Ignore node_modules folder
      '!**/*.js', // Include .js files
      '!**/*.(sa|sc)ss', // Include .scss and .sass files
      '!**/*.hbs' // Include .hbs files
    ]
  }).on('change', async (filePath) => {
    const extension = path.extname(filePath).toLowerCase()
    switch (extension) {
    case '.js':
      await timer(compileJS)
      await timer(compileHbs)
      break
    case '.scss':
    case '.sass':
      await timer(compileSass)
      await timer(compileHbs)
      break
    case '.hbs':
      await timer(compileHbs)
      break
    default:
      console.error(`The file ${extension} is not compatible with any compiler.`)
    }
  })
  console.log('Listening to your changes...')
}
