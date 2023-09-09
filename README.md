<div align="center">
  <img width='100' src="https://raw.githubusercontent.com/zkreations/hamlet/main/dist/images/logo.png" align="center" />

  # Hamlet 

  <p>Development environment for creating Blogger templates with handlebars, which includes an example template with best practices that a true Blogger developer should follow.<p>

  <img src="https://raw.githubusercontent.com/zkreations/hamlet/main/dist/images/screenshot.png" align="center" />

  <p><a href="https://hamlet.zkreations.com/"><strong> Live Demo &rarr;</strong></a></p>

</div>

## Features

- Handlebars as template engine.
- CSS compiler using Sass.
- Stylelint to detect and fix issues in CSS code.
- Autoprefixer for better browser compatibility.
- Clean-css to minify CSS code and reduce file size.
- JavaScript compiler with Babel and Rollup.
- ESLint to find and fix errors in JavaScript code.
- Terser to minify JavaScript code.
- Test to check if your template is valid in Blogger without installing it.
- Browserslist to specify compatible browsers and versions for generated code.

## Example Template Features

- No dependencies
- Optimized for modern SEO.
- Optimized for AdSense.
- Responsive design.
- Supports multiple languages thanks to Blogger.
- Super optimized with small code size.
- Compatible with [Core Web Vitals](https://pagespeed.web.dev/report?url=https://hamlet.zkreations.com/).
- Comment system with multiple levels.
- Formatted widgets.
- Best practices.

## Getting Started

Clone, fork, or download this repository to your PC, and within the root directory of this folder, run in console:

```cmd
npm install
```

To start listening to changes and automatically compile, run in console:

```cmd
npm run dev
```

To compile only once:

```cmd
npm run compile
```

To run tests and check if your template is valid:

```cmd
npm run test
```

## Structure

The recommended structure for your template is as follows:

```cmd
├── src
│   ├── js
│   │   ├── (files and folders)
│   │   └── main.js
│   ├── scss
│   │   ├── (files and folders)
│   │   └── main.scss
│   └── views
│       ├── (files and folders)
│       └── theme.hbs
└── data.json
```
You can also add as many files and folders as you want, but the main files are without the prefix `_` (underscore).

## Compile JavaScript

To compile JavaScript, you must create a file called (for example) `main.js` without the prefix `_` (underscore) in the `src/js` folder. If you want to create modules, create files with the prefix `_`, and import them in the your main file or in other modules. For example:

```js
├── src
│   ├── js
│   │   ├── _module1.js
│   │   ├── _module2.js
│   │   └── main.js
```

Every time you save changes in your JavaScript files, the compiler will automatically compile them and generate a file called `main.js` in the `dist/js` folder.

## Compile Sass

To compile Sass, you must create a file called (for example) `main.scss` without the prefix `_` (underscore) in the `src/scss` folder. If you want to create modules, create files with the prefix `_`, and import them in the your main file or in other modules. For example:

```cmd
├── src
│   ├── scss
│   │   ├── _module1.scss
│   │   ├── _module2.scss
│   │   └── main.scss
```

Every time you save changes in your Sass files, the compiler will automatically compile them and generate a file called `main.css` in the `dist/css` folder.

## Compile Handlebars

To compile Handlebars, you must create a file called (for example) `theme.hbs` without the prefix `_` (underscore) in the `src/views` folder. If you want to create modules, create files with the prefix `_`, and import them in the your main file or in other modules. For example:

```cmd
├── src
│   ├── views
│   │   ├── _module1.hbs
│   │   ├── _module2.hbs
│   │   └── theme.hbs
```

Every time you save changes in your Handlebars files, the compiler will automatically compile them and generate a file called `theme.xml` in the `dist` folder. Unlike the previous cases, this file is not minified, so you can see the code in a more readable way, also, you cannot repeat the names of the created modules, because they will be overwritten.

### Data

To use data in your template, you must edit the `data.json` file in the root directory of the project. This file contains the data that will be used in the template. You can add as many data as you want, but you must follow the structure of the file. 

### Modules

The modules are files that contain code that can be reused in other files. For example, you can create a module that contains the code of a widget, and import it in the `theme.hbs` file. To create a module, create a file with the prefix `_` (underscore) in the `src/views` folder, and import it in the file where you want to use it. For example:

```cmd
├── src
│   ├── views
│   │   ├── _module-name.hbs
│   │   └── theme.hbs
```

In the `theme.hbs` file, or in any other module, you can import the module with the following code:

```hbs
{{> module-name}}
```

You can create any number of modules, and import them in any file, but the name of the module must be unique, because if you create two modules with the same name, the second one will overwrite the first one.

### Helpers

#### asset

The `asset` helper is used to import files. For example, if you want to import the `main.css` file in the `dist/css` folder, you must use the following code:

```hbs
<style>/*<![CDATA[*/
  {{asset "dist/css/main.css"}}
/*]]>*/</style>
```

If I want to import a file inside a node module, use `~` (tilde) before the name of the module, this is equivalent to `node_modules`. For example, if I want to import the `main.js` file in the `tooltips` module, I must use the following code:

```hbs
<script>/*<![CDATA[*/
  {{asset "~/tooltips/main.js"}}
/*]]>*/</script>
```

#### variable

If you want to create a quick wood Blogger variable, you can use the `variable` helper. For example, if I want to create a variable called `title` with the value `Hamlet`, I must use the following code:

```hbs
{{variable "example"}}
```

The result will be:

```xml
<Variable name="example" description="example" type="string" value=""/>
```

All atributtes are optional, but you can add them if you want. For example, if I want to add the description and the type, I must use the following code:

```hbs
{{variable "example" description="Example" type="color"}}
```

To see all the available attributes, see the [Blogger Code documentation](https://bloggercode-blogconnexion.blogspot.com/2014/06/tag-b-skin-b-template-skin.html).


## Contributing

You can help maintain this code as long as you take into account the following points:

- Try not to add more CSS styles.
- Do not add more JavaScript functions to the demo template.
- Correct, improve and optimize the environment and demo template.

## Supporting

If you want to help me keep this and more related projects always up to date, you can [buy me a coffee](https://ko-fi.com/zkreations) ☕. I will be very grateful 👏.


## Create your beautiful theme

If you used this repository as a template, please, add a star ⭐ and add the following tags in yours:

- `blogger-hamlet`
- `blogger-handlebars`
- `blogger-hbs`

Thanks for using this repository. Happy coding! 🚀

## License

**Hamlet** is licensed under the MIT License
