# Depmanjs
JavaScript dependency manager. You can provide module like this:

```js
depman.use([], function () {
  return {
    sum: function (a, b) {
      return a+b;
    }
  };
}, 'module.name');
```

## API

Depmanjs has four main methods, each packing quite a punch.

  * <a href="#config">depman.<code>config()</code></a>
  * <a href="#v">depman.<code>v()</code></a>
  * <a href="#use">depman.<code>use()</code></a>
  * <a href="#addVendor">depman.<code>addVendor()</code></a>

--------------------------------------------------------
<a name="config"></a>
### config(params)
<code>depman.config()</code> lets you configure your project and if you use any non-depmanjs lib, you can add rules as they are attached to depmanjs for further use.

**Arguments**

  * **params / object** (DOM Element or Object) - an HTML DOM element or any JavaScript Object

**Examples**

```js
// simple
depman.config({
  project: 'Project name',
  version: '0.0.1',
  production: false, // default
  vendors: {} // default
});
```
--------------------------------------------------------

## Browser support

Depmanjs passes our tests in all the following browsers. If you've found bugs in these browsers or others please let us know by submitting an issue on GitHub!

  - IE6+
  - Chrome 1+
  - Safari 4+
  - Firefox 3.5+
  - Opera 10+

## Contributors

  * [Egor Sharapov](https://github.com/egych/depmanjs/commits/master?author=egych) ([Home](http://egorshar.ru))

## Licence & copyright

Depmanjs is copyright &copy; 2013 Egor Sharapov and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included MIT-LICENSE file for more details.