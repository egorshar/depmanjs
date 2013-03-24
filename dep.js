(function (window, document) {
  var Dependency
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
    this.loaded = [];

    return this;
  };

  /**
  * Base object, contains common library functions
  */
  Dependency = function () {
    this.manager = new Manager();
  };

  /**
  * Defining new namespace
  * @param {String} ns Namespace path
  * @return {Object}
  */
  Dependency.prototype.namespace = function (ns) {
    var parts = ns.split('.')
      , parent = dep;

    if (parts[0] === "dep") {
      parts = parts.slice(1);
    }

    for (var i = 0, l = parts.length; i < l; i += 1) {
      if (typeof parent[parts[i]] === 'undefined') {
        parent[parts[i]] = {};
      }
      parent = parent[parts[i]];
    }

    return parent;
  };

  /**
  * Confugure your project
  * @param {Object} config Input params for configurating project
  */
  Dependency.prototype.config = function (params) {
    var config = CONFIG, key;
    params = params || {};

    for (key in config) {
      if (typeof params[key] !== 'undefined') {
        config[key] = params[key];
      }
    }

    CONFIG = config;
  };

  window.dep = new Dependency();
} (this, document));