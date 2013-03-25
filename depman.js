/*!
  * depmanjs - copyright (c) Egor Sharapov 2013
  * https://github.com/egych/depmanjs
  * MIT license
  */
(function (window, document) {
  var DepMan
    , Manager
    , Vendor
    , CONFIG;

  /**
    * Project config, can be changed with dep.config({}) function
    */
  CONFIG = {
    project: 'Project name',
    version: '0.0.1',
    path: '/js/', // depjs file-structure root-path
    vendor: {}  // used non-depjs scripts
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

    return this;
  };

  /**
    * Defining new namespace
    * @param {String} ns Namespace path
    * @param {Object} val Value, if need to set as it been defined
    * @return {Object}
    */
  Manager.prototype.namespace = function (ns, val) {
    var parts = ns.split('.')
      , parent = this.modules;

    for (var i = 0, l = parts.length; i < l; i += 1) {
      if (typeof parent[parts[i]] === 'undefined') {
        // if setted val variable, then set it to last namespace key
        if (i+1 === l && (typeof val !== 'undefined')) {
          parent[parts[i]] = val;
        } else {
          parent[parts[i]] = {};
        }
      }
      parent = parent[parts[i]];
    }

    return parent;
  };  

  /**
    * Check if module is already loaded
    * @param {String} ns Namespace of module
    * @return {Boolean}
    */
  Manager.prototype.isLoaded = function (ns) {
    if (typeof this.namespace(ns) !== 'undefined') {
      return true;
    }
    return false;
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
    var config = CONFIG, key;
    params = params || {};

    for (key in config) {
      if (typeof params[key] !== 'undefined') {
        config[key] = params[key];
      }
    }

    CONFIG = config;
  };

  /**
    * Permit dependencies of module and perform a callback
    * @param {Array} requires Modules, that required for this module
    * @param {Function} callback Callback-function
    * @param {String} namespace Namespace of this module
    * @return {Boolean} true
    */
  DepMan.prototype.use = function (requires, callback, namespace) {
    if (arguments.length == 2) {
      if (typeof requires === 'function') {
        // bind on ready
      }
    } else {
      namespace = namespace || 'auto_ns.'+(+new Date);
      this.manager.add(requires, callback, namespace);
    }
    return true;
  };

  window.depman = new DepMan();
} (this, document));