__depjs__ is a JavaScript dependency manager.

Syntax
------
Configure your project and if you use any __non-depjs__ lib, you can add rules as they are attached to __depjs__ for further use.
```javascript
dep.config({
  project: 'depjs',
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

Define your own __depjs__ module, which may depend on other libs.
```javascript
dep.use(['vendor.jquery'], function ($) {
  alert(123);
}, 'lib.graph');
```

Contributor
-----------
__Egor Sharapov__

http://egorshar.ru  
http://github.com/egych


