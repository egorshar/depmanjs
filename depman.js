/*!
  * depmanjs - copyright (c) Egor Sharapov 2013
  * https://github.com/egych/depmanjs
  * MIT license
  */
(function (window, document) {
  var DepMan,
      Manager,
      Vendor,
      CONFIG,
      head = document.getElementsByTagName('head')[0],
      start_time = +new Date(),
      log = function (msg) { // wrapper for console.log
        if ((CONFIG.production !== true) && console && (typeof (console.log) !== 'undefined')) {
          console.log('[' + (+new Date()-start_time)/1000 + ']  ' + msg);
        }
      };

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
  };

  /**
    * Check namespace for vendor accessory
    * @param {String} ns Namespace
    * @return {Boolean}
    */
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
    var parts = ns.split('.'), 
        parent = CONFIG;

    for (var i = 0, l = parts.length; i < l; i += 1) {
      if (typeof parent[parts[i]] === 'undefined') {
        return false;
      }
      parent = parent[parts[i]];
    }

    return parent;
  };

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
        try {
          return this.attach((vendor.use || []), vendor.attach);
        } catch (e) {
          return undefined;
        }
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
      return vendor.path;
    }
    return false;
  };

  /**
    * If vendor has attach function, then trigger it with deps args
    * @param {Array} deps Vendor dependencies
    * @param {Function} attach Attach function
    * @return {Mixed} Attach function result
    */
  Vendor.prototype.attach = function (deps, attach) {
    var args = [];

    for (var i in deps) {
      args.push(this.get(deps[i]));
    }
    return attach.apply({}, args);
  };

  /**
    * Load vendor if it has dependencies
    * @param {String} ns Vendor namespace
    * @return {Boolean} If vendor has hard deps, then it can be synchronous loaded
    */
  Vendor.prototype.load = function (ns) {
    var vendor_config = this.getConfig(ns),
        self = this,
        callback = function () {
          if (vendor_config.sync === true) {
            self.manager.load(ns);
          }
        };

    if (vendor_config && (typeof vendor_config.use === 'object')) {
      this.manager.add(vendor_config.use, callback, ns);

      return (vendor_config.sync === true);
    }

    return false;
  };

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
    var parts = ns.split('.'), 
        parent = this.modules, 
        hasVal = typeof val !== 'undefined';

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
    * @param {String} version Module version
    * @return {Manager} Возвращает объект UseManager
    */
  Manager.prototype.add = function(requires, cb, ns, version) {
    var deps = [], 
        vendor_use, 
        self = this, 
        vendor_wait = false;

    for (var i = 0, l = requires.length; i < l; i += 1) {
      // if it already loading then do nothing
      if (this.is_being_load.indexOf(requires[i]) >= 0) {
        continue;
      }

      if (this.vendor.check(requires[i]) && (typeof this.vendor.get(requires[i]) === 'undefined')) {
        vendor_wait = this.vendor.load(requires[i], this);
      }
      if (!vendor_wait) {
        this.load(requires[i], version);
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
    * Mix version of module and config version
    * @param {String} version Module version
    * @return {String} Mixed version of module and config versions
    */
  Manager.prototype.mixVersion = function (version) {
    var config_version = CONFIG.version.split('.'), 
        module_version = [];

    version = (version || '0.0.0').split('.');
    for (var i = 0, l = config_version.length; i < l; i += 1) {
      module_version[i] = (config_version[i]|0)+(version[i]|0);
    }

    return module_version.join('.');
  };

  /**
    * Prepare namespace for load js-file
    * @param {String} ns Namespace of module, converts to filename with ns2File-function
    * @param {String} version Module version
    * @return {Manager}
    */
  Manager.prototype.load = function(ns, version) {
    if ((this.is_being_load.indexOf(ns) >= 0) || this.isLoaded(ns)) {
      this.checkQueue(ns);
      return;
    }

    var cacheParam = '?' + (CONFIG.production ? ('v'+this.mixVersion(version)) : (+new Date())), 
        filename = this.ns2File(ns) + cacheParam;

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
    var script = document.createElement('script'), 
        self = this;

    // IE
    script.onreadystatechange = function () {
      if (script.readyState === 'loaded' || script.readyState === 'complete') { 
        script.onreadystatechange = null;
        log(ns.toString() + ' is loaded');
        self.checkQueue(ns);
      } 
    };

    // other
    script.onload = function () {
      log(ns.toString() + ' is loaded');
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
        if (loaded_module !== false) {
          item.loaded[k] = loaded_module;
        }
      }

      /**
        * If loaded modules equal to required modules, then trigger callback-function and initialize module
        */
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
    this.module_version = '0.0.0';
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
    var version = this.module_version;
    this.module_version = '0.0.0';
    namespace = namespace || 'auto_ns.'+(+new Date());
    callback = typeof callback === 'function' ? callback : (function () {});
    this.manager.add(requires, callback, namespace, version);

    return true;
  };

  /**
    * Adding vendor to project without adding this to project config
    * @param {Object} vendor Params like each vendor in config
    * @return {DepMan}
    */
  DepMan.prototype.addVendor = function (name, vendor) {
    if (typeof (CONFIG.vendor[name]) !== 'undefined') {
      log('This vendor already set in config: ' + name.toString());
    } else {
      CONFIG.vendor[name] = vendor;
    }
    return this;
  };

  /**
    * Set custom version of module being loaded
    * @param {String} version Version of module, for clear cache after module update
    * @return {DepMan}
    */
  DepMan.prototype.v = function (version) {
    if (typeof version === 'string') {
      this.module_version = version;
    }

    return this;
  };
  
  /**
   * Simple hash from string
   * @param {String} s Input string
   * @return {String} Hash
   */
	DepMan.prototype.getHash = function(s){
		return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
	};
  
  /**
   * Add css file to head
   * @param {String|Array} css CSS files or file need to add
   * @return {DepMan}
   */
	DepMan.prototype.addCSS = function (css) {
    var self = this, i,
        add_fn = function (url) {
      		url += (url.indexOf('?') >= 0 ? '&' : '?') + 'v=' + self.module_version;
      		var link = document.createElement('LINK'),
      		    hash = self.getHash(url);

      		if (!document.getElementById('css_'+hash)) {
      			link.href = url;
      			link.type = 'text/css';
      			link.rel = 'stylesheet';
      			link.id = 'css_' + hash;
      			document.getElementsByTagName('head')[0].appendChild(link);
      		}
        };
    
    css = (typeof css === 'string') ? [css] : css;
    
    for (i in css) {
      add_fn(css[i]);
    }
    
    return this;
	};

  window.depman = new DepMan();
} (this, document));