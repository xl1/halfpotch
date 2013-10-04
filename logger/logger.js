// Generated by CoffeeScript 1.6.3
(function() {
  var Controller, Logger, app,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Controller = (function() {
    function Controller() {}

    Controller.getController = function() {
      var required,
        _this = this;
      required = angular.injector().annotate(this);
      required.unshift('$scope');
      required.push(function() {
        var $scope, args, key, value, _ref;
        $scope = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        _ref = _this.prototype;
        for (key in _ref) {
          value = _ref[key];
          if (typeof value === 'function') {
            $scope[key] = value.bind($scope);
          } else {
            $scope[key] = value;
          }
        }
        return _this.apply($scope, args);
      });
      return required;
    };

    return Controller;

  })();

  app = angular.module('logger');

  app.service('lotsTextParser', function(dataLoader) {
    return {
      data: dataLoader.load().then(function(_arg) {
        var c, colorList, colors, p, partList, parts, _;
        parts = _arg.parts, colors = _arg.colors;
        partList = ((function() {
          var _results;
          _results = [];
          for (_ in parts) {
            p = parts[_];
            _results.push(p);
          }
          return _results;
        })()).sort(function(a, b) {
          return b.name.length - a.name.length;
        });
        colorList = ((function() {
          var _results;
          _results = [];
          for (_ in colors) {
            c = colors[_];
            _results.push(c);
          }
          return _results;
        })()).sort(function(a, b) {
          return b.name.length - a.name.length;
        });
        return {
          partList: partList,
          colorList: colorList
        };
      }),
      parse: function(text) {
        var _this = this;
        return this.data.then(function(data) {
          var line, _i, _len, _ref, _results;
          _ref = text.split(/[\r\n]+/);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            line = _ref[_i];
            if (line) {
              _results.push(_this.parseLotText(line, data));
            }
          }
          return _results;
        });
      },
      searchColor: function(text, _arg) {
        var c, colorList, _i, _len;
        colorList = _arg.colorList;
        for (_i = 0, _len = colorList.length; _i < _len; _i++) {
          c = colorList[_i];
          if (text.indexOf(c.name) >= 0) {
            return c;
          }
        }
      },
      searchPart: function(text, _arg) {
        var p, partList, _i, _len;
        partList = _arg.partList;
        for (_i = 0, _len = partList.length; _i < _len; _i++) {
          p = partList[_i];
          if (text.indexOf(p.name) === 0) {
            return p;
          }
        }
        return {
          name: text
        };
      },
      parseLotText: function(text, data) {
        var amount, cname, color, condition, idx, part, price, priceEach;
        condition = '';
        amount = 1;
        priceEach = '';
        price = '';
        text = text.replace(/\[(new|old)\]/i, function(_, cond) {
          condition = cond.toLowerCase() === 'new' ? 'New' : 'Old';
          return '';
        }).replace(/(?:\Wx(\d+))|(?:(\d+)x\W)/i, function(_, a1, a2) {
          amount = +(a1 || a2);
          return '';
        }).replace(/\s+(\\|[a-z]{3})\s*([\d,\.]+)(\s*each)?/i, function(_, cur, p) {
          priceEach = cur + ' ' + p;
          price = cur + ' ' + (+p * amount);
          return '';
        }).replace(/\s+(\\|[a-z]{3})\s*([\d,\.]+)/i, function(_, cur, p) {
          price = cur + ' ' + p;
          return '';
        }).replace(/\ [.,]+ /g, function() {
          return ' ';
        });
        if (color = this.searchColor(text, data)) {
          cname = color.name;
          idx = text.indexOf(cname);
          text = text.slice(0, idx) + text.slice(idx + cname.length);
        }
        part = this.searchPart(text.trim(), data);
        return {
          condition: condition,
          amount: amount,
          priceEach: priceEach,
          price: price,
          color: color,
          part: part
        };
      }
    };
  });

  app.directive('contenteditable', function() {
    return {
      require: 'ngModel',
      link: function(scope, elem, attrs, model) {
        elem.bind('blur', function() {
          return scope.$apply(function() {
            return model.$setViewValue(elem.html());
          });
        });
        return model.$render = function() {
          return elem.html(this.$viewValue);
        };
      }
    };
  });

  app.directive('onEnter', function() {
    return function(scope, elem, attrs) {
      return elem.bind('keydown', function(e) {
        if (e.keyCode === 13) {
          return scope.$apply(attrs.onEnter);
        }
      });
    };
  });

  app.directive('inputDate', function(dateFilter) {
    return {
      require: 'ngModel',
      link: function(scope, elem, attrs, model) {
        return model.$render = function() {
          return elem.val(dateFilter(this.$viewValue, 'yyyy-MM-dd'));
        };
      }
    };
  });

  Logger = (function(_super) {
    __extends(Logger, _super);

    function Logger(lotsTextParser, loggerConstants) {
      this.lotsTextParser = lotsTextParser;
      this.user = {
        name: 'Anonymous',
        isLoggedIn: false
      };
      this.newLabelText = '';
      this.newLotsText = '';
      this.selectedOrder = null;
      this.orders = loggerConstants._debug.orders;
    }

    Logger.prototype.select = function(order) {
      return this.selectedOrder = order;
    };

    Logger.prototype.addLabel = function() {
      var _ref;
      if ((_ref = this.selectedOrder) != null) {
        _ref.labels.push(this.newLabelText);
      }
      return this.newLabelText = '';
    };

    Logger.prototype.deleteLabel = function(label) {
      var idx, order;
      if (order = this.selectedOrder) {
        idx = order.labels.indexOf(label);
        if (idx >= 0) {
          return order.labels.splice(idx, 1);
        }
      }
    };

    Logger.prototype.getLabelStyle = function(label) {
      var b, g, i, r, s, t, x, _i, _len;
      x = 0xC0FFEE;
      for (_i = 0, _len = label.length; _i < _len; _i++) {
        s = label[_i];
        i = s.charCodeAt(0);
        t = x ^ (x << 11);
        x = (i << 3) ^ (i << 13) ^ t ^ (t << 7);
      }
      r = (x >>> 16) & 255;
      g = (x >>> 8) & 255;
      b = x & 255;
      return {
        backgroundColor: "rgb(" + r + ", " + g + ", " + b + ")",
        color: r + g + b < 0x180 ? 'white' : 'black'
      };
    };

    Logger.prototype.addLots = function() {
      var order;
      if (order = this.selectedOrder) {
        this.lotsTextParser.parse(this.newLotsText).then(function(lots) {
          return order.lots = order.lots.concat(lots);
        });
      }
      return this.newLotsText = '';
    };

    Logger.prototype.deleteLot = function(lot) {
      var idx, order;
      if (order = this.selectedOrder) {
        idx = order.lots.indexOf(lot);
        if (idx >= 0) {
          return order.lots.splice(idx, 1);
        }
      }
    };

    return Logger;

  })(Controller);

  app.controller('logger', Logger.getController());

}).call(this);
