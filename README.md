__depmanjs__ is a JavaScript dependency manager.

Syntax
------
Configure your project and if you use any __non-depmanjs__ lib, you can add rules as they are attached to __depmanjs__ for further use.
```javascript
depman.config({
  project: 'depmanjs',
  version: '0.1.0',
  path: '/js/',
  vendor: {
    underscore: '_',
    jquery: 'jQuery',
    backbone: {
      use: ['vendor.underscore', 'vendor.jquery'],
      attach: function (_, $) {
        return Backbone;
      }
    }
  }
});
```

Define your own __depmanjs__ module, which may depend on other libs.
```javascript
depman.use(['vendor.jquery'], function ($) {
  alert(123);
}, 'lib.graph');
```

Contributors
------------
__Egor Sharapov__

http://egorshar.ru  
http://github.com/egych


