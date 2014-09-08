/*
 * IFrameTransport - Storage Service
 *
 * Persist data across domains.
 * Targets modern browsers, IE8+
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('ift-storage-service', ['ift'], factory);
  else if (typeof exports === 'object') module.exports = factory(require('../ift'));
  else root.ift = factory(root.ift);
}(this, function(ift) {

  var support = ift.support,
      mixin = ift.util.mixin;

  mixin(support, {
    storageEventTarget: ('onstorage' in window ? window : document)
  });

  // Wrap localStorage so it may be swapped out.
  var lsWrapper = {
    get: function(key) {
      return localStorage.getItem(key);
    },
    set: function(key, value) {
      return localStorage.setItem(key, value);
    },
    unset: function(keys) {
      if (!(keys instanceof Array)) keys = [keys];
      for (i = 0; i < keys.length; i++) localStorage.removeItem(keys[i]);
    }
  };

  // Service
  // --------

  // Implement the LocalStorage service from a service's perspective.
  var Service = ift.Service.extend({

    constructor: function(channel, storage) {
      this.storage = storage || lsWrapper;
      this.listen();
      ift.Service.apply(this, arguments);
    },

    listen: function() {
      var service = this, target = support.storageEventTarget;
      support.on(target, 'storage', function(evt) { service.onStorage(evt); });
    },

    get: function(key) {
      return this.storage.get(key);
    },

    set: function(key, value, options) {
      return this.storage.set(key, value, options);
    },

    unset: function(keys) {
      return this.storage.unset(keys);
    },

    onStorage: function(evt) {
      if (evt) {
        // IE9+: Don't trigger if value didn't change
        if (evt.oldValue === evt.newValue) return;
      } else {
        // IE8: `evt` is undefined
        evt = {};
      }

      this._channel.request('trigger', ['change', {
        key: evt.key,
        oldValue: evt.oldValue,
        newValue: evt.newValue
      }]);
    }

  });

  // Consumer
  // --------

  // Implement the LocalStorage service from a consumer's perspective.
  var Consumer = ift.Service.extend({

    get: function(key, callback) {
      this._channel.request('get', [key], callback);
    },

    set: function(key, value, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      } else options = options || {};

      this._channel.request('set', [key, value, options], callback);
    },

    unset: function(keys, callback) {
      this._channel.request('unset', [keys], callback);
    }

  });

  ift.register('storage', Service, Consumer);

  return ift;

}));
