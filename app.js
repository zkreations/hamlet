const Handlebars = require('handlebars')

const fs = require('fs')
const path = require('path')
const sass = require('sass')
const CleanCSS = require('clean-css')
const autoprefixer = require('autoprefixer')
const postcss = require('postcss')

const rollup = require('rollup')
const terser = require('@rollup/plugin-terser')
const commonjs = require('@rollup/plugin-commonjs')
const { babel } = require('@rollup/plugin-babel')
const { nodeResolve } = require('@rollup/plugin-node-resolve')

const sourceDir = './src'
const distDir = './dist'
const cacheFile = './.cache.json'
const dataFile = './data.json'

let data = {}

if (fs.existsSync(dataFile)) {
  data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
}

// Compilar archivos con caché
function compileWithCache (compileFunction, context, options) {
  const file = path.join(__dirname, sourceDir, context)
  const dirName = path.dirname(file)
  const extname = path.extname(file)

  let cache = {}

  // Cargar la caché desde el archivo
  if (fs.existsSync(cacheFile)) {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
  }

  let fileChanged = true

  if (cache[file]) {
    const hash = cache[file]
    const currentFile = getFilesLastModifiedSum(dirName, extname)

    if (hash.lastModified === currentFile) {
      fileChanged = false
    }
  }

  let result

  if (fileChanged) {
    result = compileFunction(context, options)
    const hash = {
      lastModified: getFilesLastModifiedSum(dirName, extname),
      result
    }

    cache[file] = hash

    fs.writeFileSync(cacheFile, JSON.stringify(cache), 'utf8')
  } else {
    result = cache[file].result
    return new Handlebars.SafeString(result.string)
  }

  // Guardar la caché en el archivo
  return result
}

// Obtener la suma de las fechas de modificación de los archivos
function getFilesLastModifiedSum (dir, extension) {
  let sum = 0

  // Obtener los archivos del directorio
  const filesInDir = fs.readdirSync(dir)

  filesInDir.forEach((file) => {
    const pathToFile = path.join(dir, file)
    const isDirectory = fs.statSync(pathToFile).isDirectory()

    // Si es un directorio, llamamos de nuevo a la función
    if (isDirectory) {
      sum += getFilesLastModifiedSum(pathToFile, extension)
    } else if (path.extname(file) === extension) {
      // Si es un archivo, obtenemos la fecha de modificación
      const lastModified = fs.statSync(pathToFile).mtimeMs
      sum += lastModified
    }
  })

  return sum
}

// Obtener la ruta del archivo compilado
function getFilePath (file, distDir, extension, options) {
  const fileName = path.basename(file, path.extname(file))
  const minifyExt = options.hash.minify !== false ? '.min' : ''
  return path.join(__dirname, distDir,
    `${extension}/${fileName}${minifyExt}.${extension}`
  )
}

// Compilar JS con Rollup
async function compileJs (context, options) {
  const file = path.join(__dirname, sourceDir, context)

  const bundle = await rollup.rollup({
    input: file,
    plugins: [
      nodeResolve(),
      commonjs(),
      babel({
        babelHelpers: options.hash.name || 'bundled',
        presets: ['@babel/preset-env']
      }),
      options.hash.minify !== false
        ? terser()
        : null
    ]
  })

  const outputOptions = {
    name: options.hash.title || 'app',
    format: options.hash.format || 'iife'
  }

  if (options.hash.bundle === true) {
    const filePath = getFilePath(file, distDir, 'js', options)

    await bundle.write({
      file: filePath,
      ...outputOptions
    })
  } else {
    const { output } = await bundle.generate(outputOptions)
    const code = output[0].code

    return new Handlebars.SafeString(code)
  }
}

// Compilar SASS con autoprefixer y minificar con CleanCSS
function compileSass (context, options) {
  const file = path.join(__dirname, sourceDir, context)

  const compiled = sass.compile(file)

  let css = compiled.css.toString()

  if (options.hash.minify !== false) {
    css = new CleanCSS().minify(css).styles
  }

  if (options.hash.autoprefix !== false) {
    css = postcss([autoprefixer]).process(css).css
  }

  if (options.hash.bundle === true) {
    const filePath = getFilePath(file, distDir, 'css', options)

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
    }
    fs.writeFileSync(filePath, css)
  } else {
    return new Handlebars.SafeString(css)
  }
}

// Función que registra los parciales de una carpeta
function registerPartials (folderPath) {
  const files = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.hbs') && file.startsWith('_'))

  files.forEach(async file => {
    const filePath = path.join(folderPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      // Si la ruta es un directorio, llamamos de nuevo a la función
      registerPartials(filePath)
    } else {
      const partialName = file.slice(1, -4) // Eliminamos el "_" y ".hbs" del nombre
      const partialTemplate = fs.readFileSync(filePath, 'utf8')

      Handlebars.registerPartial(partialName, partialTemplate)
    }
  })
}

// Función que compila los archivos de una carpeta
function compileTemplates (folderPath) {
  const files = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.hbs') && !file.startsWith('_'))

  files.forEach(file => {
    console.time(`${file} compiled successfully!`)

    const input = path.join(__dirname, sourceDir, file)

    const source = fs.readFileSync(input, 'utf8')
    const template = Handlebars.compile(source)

    const output = template(data)
    const filePath = path.join(__dirname, distDir, `./${file.replace('.hbs', '.xml')}`)

    fs.writeFileSync(filePath, output)
    console.timeEnd(`${file} compiled successfully!`)
  })
}

// Registrar el compilador de JS
Handlebars.registerHelper('js', function (context, options) {
  return compileWithCache(compileJs, context, options)
})

// Registrar el compilador de SASS
Handlebars.registerHelper('sass', function (context, options) {
  return compileWithCache(compileSass, context, options)
})

registerPartials(sourceDir)

compileTemplates(sourceDir)
