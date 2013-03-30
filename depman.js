/*!
  * depmanjs - copyright (c) Egor Sharapov 2013
  * https://github.com/egych/depmanjs
  * MIT license
  */
(function (window, document) {
  var DepMan
    , Manager
    , CONFIG
    , vendor
    , head = document.getElementsByTagName('head')[0];

  /**
    * Project config, can be changed with depman.config({}) function
    */
  CONFIG = {
    project: 'Project name',
    version: '0.0.1',
    production: true, // production env allow cache included files in browser by CONFIG.version param
    path: '/js/', // depmanjs file-structure root-path
    vendor: {}  // used non-depmanjs scripts
  };

  /**
    * Vendor scripts
    * @constructor
    * @this {Vendor}
    * @return {Vendor}
    */
  Vendor = function (manager) {
    this.manager = manager;
    this.is_being_load = [];
  };

  Vendor.prototype.check = function (ns) {
    if (ns.indexOf('vendor.') === 0) {
      return true;
    }
    return false;
  };

  /**
    * Get vendor object in config if it isset
    * @param {String} ns Vendor module namespace
    * @return {Object|Boolean} If object by namespace isset, then return object, else return false
    */
  Vendor.prototype.getConfig = function (ns) {
    var parts = ns.split('.')
      , parent = CONFIG;

    for (var i = 0, l = parts.length; i < l; i += 1) {
      if (typeof parent[parts[i]] === 'undefined') {
        return false;
      }
      parent = parent[parts[i]];
    }

    return parent;
  }

  /**
    * Get vendor module
    * @param {String} ns Vendor module namespace
    * @return {Object|undefined} If module is not loaded, then return undefined
    */
  Vendor.prototype.get = function (ns) {
    var vendor = this.getConfig(ns);
    if (typeof vendor === 'string') {
      return window[vendor];
    } else {
      if (typeof vendor.attach === 'string') {
        return window[vendor.attach];
      } else {
        return vendor.attach();
      }
    }
    return undefined;
  };
  
  /**
    * If vendor script has custom path, return custom path
    * @param {String} ns Vendor module namespace
    * @return {String|Boolean} If module has custom path, then return path string, else return false
    */
  Vendor.prototype.customPath = function (ns) {
    var vendor = this.getConfig(ns);
    if (vendor !== false) {
      return vendor['path'];
    }
    return false;
  }

  Vendor.prototype.attach = function (ns) {
    var vendor = this.getConfig(ns)
      , use = vendor['use']
      , args = [];

    if (typeof vendor.attach === 'function') {
      for (var i in use) {
        args.push(this.get(use[i]));
      }
      vendor['attach'].apply({}, args);
    }
  }

  /**
    * Dependency manager
    * @constructor
    * @this {Manager}
    * @return {Manager}
    */
  Manager = function () {
    this.queue = [];
    this.is_being_load = [];

    this.modules = {};

    this.vendor = new Vendor(this);

    return this;
  };

  /**
    * Check if module is already loaded
    * @param {String} ns Namespace of module
    * @param {Object} val Value
    * @return {Boolean}
    */
  Manager.prototype.ns = function (ns, val) {
    var parts = ns.split('.')
      , parent = this.modules
      , hasVal = typeof val !== 'undefined';

    for (var i = 0, l = parts.length; i < l; i += 1) {
      if (typeof parent[parts[i]] === 'undefined') {
        if (hasVal) {
          if (i+1 === l) {
            parent[parts[i]] = val;
          } else {
            parent[parts[i]] = {};
          }          
        } else {
          return false;
        }
      }
      parent = parent[parts[i]];
    }

    if (hasVal) {
      return parent;
    } else {
      return true;
    }
  };

  /**
    * Defining new namespace
    * @param {String} ns Namespace path
    * @param {Object} val Value, if need to set as it been defined
    * @return {Object}
    */
  Manager.prototype.namespace = function (ns, val) {
    return this.ns(ns, (val || {}));
  };

  /**
    * Check if module is already loaded
    * @param {String} ns Namespace of module
    * @return {Boolean}
    */
  Manager.prototype.isLoaded = function (ns) {
    if (this.vendor.check(ns)) {
      return (typeof this.vendor.get(ns) !== 'undefined');
    } else {
      return this.ns(ns);
    }
  };

  /**
    * Add module namespace to load-queue
    * @param {Array} requres Array of module dependencies
    * @param {Function} callback Callback function
    * @param {String} ns Namespace of module that being loaded
    * @return {Manager} Возвращает объект UseManager
    */
  Manager.prototype.add = function(requires, cb, ns) {
    var deps = []
      , vendor_use
      , self = this
      , vendor_wait = false;

    for (var i = 0, l = requires.length; i < l; i += 1) {
      // if it already loading then do nothing
      if (this.is_being_load.indexOf(requires[i]) >= 0) {
        continue;
      }

      if (this.vendor.check(requires[i])) {
        vendor_config = this.vendor.getConfig(requires[i]);

        if (vendor_config && (typeof vendor_config['use'] === 'object')) {
          this.add(vendor_config['use'], function () {
            self.load(requires[0]);
          }, requires[i]);
          vendor_wait = true;
        }
      }
      if (!vendor_wait) {
        this.load(requires[i]);
      }
      deps.push(requires[i]);
    }

    this.queue.push({
      deps: deps,
      callback: cb,
      ns: ns,
      loaded: []
    });

    this.checkQueue(ns);

    return this;
  };

  /**
    * Check array or object length
    * @param {Object} obj Object or array
    * @return {Number} Количество элементов в массиве
    */
  Manager.prototype.objLength = function(obj) {
    var i, count = 0;

    for (i in obj) {
      if (typeof obj[i] !== 'undefined' && obj.hasOwnProperty(i)) {
        count += 1;
      }
    }

    return count;
  };

  /**
    * Converts namespace to script filename
    * @param {String} ns Namespace string
    * @return {String} Filename
    */
  Manager.prototype.ns2File = function (ns) {
    var vendor_path = this.vendor.customPath(ns);
    if (typeof vendor_path !== 'string') {
      return CONFIG.path + ns.split('.').join('/').toLowerCase() + '.js';
    }
    return vendor_path;
  };

  /**
    * Prepare namespace for load js-file
    * @param {String} ns Namespace of module, converts to filename with ns2File-function
    * @return {Manager}
    */
  Manager.prototype.load = function(ns) {
    if ((this.is_being_load.indexOf(ns) >= 0) || this.isLoaded(ns)) {
      this.checkQueue(ns);
      return;
    }

    var cacheParam = '?' + (CONFIG.production ? ('v'+CONFIG.version) : (+new Date))
      , filename = this.ns2File(ns) + cacheParam;

    this.loadFile(filename, ns);
    this.is_being_load.push(ns);

    return this;
  };

  /**
    * Load js-file
    * @param {String} filename JS-filename
    * @param {String} ns Namespace of module to load
    */
  Manager.prototype.loadFile = function (filename, ns) {
    var script = document.createElement('script')
      , self = this;

    // IE
    script.onreadystatechange = function () {
      if (script.readyState === 'loaded' || script.readyState === 'complete') { 
        script.onreadystatechange = null;
        self.checkQueue(ns);
      } 
    };

    // other
    script.onload = function () {
      self.checkQueue(ns);
    };

    script.src = filename;
    head.appendChild(script);
  };

  /**
    * Get module if it loaded
    * @param {String} ns Namespace
    * @return {Mixed|Boolean} If module is loaded, then return module value, else return false
    */
  Manager.prototype.get = function (ns) {
    if (this.isLoaded(ns)) {
      if (this.vendor.check(ns)) {
        return this.vendor.get(ns);
      } else {
        return this.namespace(ns);
      }
    }
    return false;
  };

  /**
    * Check queue for loaded modules
    * @param {String} ns Namespace
    */
  Manager.prototype.checkQueue = function(ns) {
    var i, item, loaded_module;

    if (!ns) {
      return;
    }

    for (i in this.queue) {
      if (!this.queue.hasOwnProperty(i)) {
        continue;
      }

      item = this.queue[i];

      /**
        * Check loaded modules for initialize
        */
      for (var k = 0, l = item.deps.length; k < l; k++) {
        loaded_module = this.get(item.deps[k]);
        //console.log(item.deps[k]);
        if (loaded_module !== false) {
          item.loaded[k] = loaded_module;
        }
      }

      /**
        * If loaded modules equal to required modules, then trigger callback-function and initialize module
        */
        //console.log(ns);
        //console.log(this.objLength(item.deps) === this.objLength(item.loaded));
      if (this.objLength(item.deps) === this.objLength(item.loaded)) {
        this.namespace(item.ns, item.callback.apply({}, item.loaded));
        this.queue.splice(i, 1);
        this.checkQueue(item.ns);
        break;
      }
    }
  };  

  /**
    * Base object, contains common library functions
    * @constructor
    * @this {DepMan}
    * @return {DepMan}
    */
  DepMan = function () {
    this.manager = new Manager();
  };

  /**
    * Confugure your project
    * @param {Object} params Input params for configurating project
    */
  DepMan.prototype.config = function (params) {
    if (CONFIG.locked === true) {
      return false;
    }

    var config = CONFIG, key;
    params = params || {};

    for (key in config) {
      if (typeof params[key] !== 'undefined') {
        config[key] = params[key];
      }
    }
    this.version = config.version;

    CONFIG = config;
    CONFIG.locked = true;
    return true;
  };

  /**
    * Permit dependencies of module and perform a callback
    * @param {Array} requires Modules, that required for this module
    * @param {Function} callback Callback-function
    * @param {String} namespace Namespace of this module
    * @return {Boolean} true
    */
  DepMan.prototype.use = function (requires, callback, namespace) {
    namespace = namespace || 'auto_ns.'+(+new Date);
    callback = typeof callback === 'function' ? callback : (function () {});
    this.manager.add(requires, callback, namespace);

    return true;
  };

  window.depman = new DepMan();
} (this, document));