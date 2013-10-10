// Generated by CoffeeScript 1.6.3
(function() {
  var Controller, Logger, app,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

  app = angular.module('logger', []);

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
        text = text.replace(/\[(new|used)\]/i, function(_, cond) {
          condition = cond.toLowerCase() === 'new' ? 'New' : 'Used';
          return '';
        }).replace(/(?:\Wx(\d+))|(?:(\d+)x\W)/i, function(_, a1, a2) {
          amount = +(a1 || a2);
          return '';
        }).replace(/\s+([A-Z]{3} |[A-Z]{2} \$)([\d,\.]+)(\s*each)?/, function(_, cur, p) {
          priceEach = cur + p;
          price = cur + (+p * amount);
          return '';
        }).replace(/\s+([A-Z]{3} |[A-Z]{2} \$)([\d,\.]+)/, function(_, cur, p) {
          price = cur + p;
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

  app.factory('Order', function($http, dateFilter, loggerConstants) {
    var Order;
    return Order = (function() {
      function Order(order) {
        var _ref, _ref1;
        if (order == null) {
          order = {};
        }
        this.id = (_ref = order.id) != null ? _ref : 'new';
        this.title = (_ref1 = order.title) != null ? _ref1 : 'New Entry';
        this.comment = order.comment || '';
        this.date = order.date || dateFilter(new Date(), 'yyyy-MM-dd');
        this.labels = order.labels || [];
        this.lots = order.lots || [];
      }

      Order.prototype.addLabel = function(text) {
        return this.labels.push(text);
      };

      Order.prototype.deleteLabel = function(label) {
        var idx;
        idx = this.labels.indexOf(label);
        if (idx >= 0) {
          return this.labels.splice(idx, 1);
        }
      };

      Order.prototype.addLots = function(lots) {
        var _ref;
        return (_ref = this.lots).push.apply(_ref, lots);
      };

      Order.prototype.deleteLot = function(lot) {
        var idx;
        idx = this.lots.indexOf(lot);
        if (idx >= 0) {
          return this.lots.splice(idx, 1);
        }
      };

      Order.prototype.toJSON = function() {
        return {
          id: this.id,
          title: this.title,
          comment: this.comment,
          date: this.date,
          labels: this.labels,
          lots: this.lots
        };
      };

      return Order;

    })();
  });

  Logger = (function(_super) {
    __extends(Logger, _super);

    function Logger($http, lotsTextParser, loggerConstants, Order) {
      var _this = this;
      this.$http = $http;
      this.lotsTextParser = lotsTextParser;
      this.loggerConstants = loggerConstants;
      this.Order = Order;
      this.user = {
        name: 'anonymous',
        isLoggedIn: false
      };
      this.orders = [];
      this.newLabelText = '';
      this.newLotsText = '';
      this.selectedOrder = null;
      $http({
        method: 'GET',
        url: loggerConstants.apiurl + this.user.name,
        responseType: 'json'
      }).success(function(orders) {
        var order, _i, _len;
        for (_i = 0, _len = orders.length; _i < _len; _i++) {
          order = orders[_i];
          _this.orders.push(new Order(order));
        }
        return _this.selectedOrder = _this.orders[0];
      });
    }

    Logger.prototype.select = function(selectedOrder) {
      this.selectedOrder = selectedOrder;
    };

    Logger.prototype.addOrder = function() {
      this.orders.unshift(this.selectedOrder = new this.Order());
      return this.saveOrder();
    };

    Logger.prototype.addLabel = function() {
      var _ref;
      if ((_ref = this.selectedOrder) != null) {
        _ref.addLabel(this.newLabelText);
      }
      return this.newLabelText = '';
    };

    Logger.prototype.deleteLabel = function(label) {
      var _ref;
      return (_ref = this.selectedOrder) != null ? _ref.deleteLabel(label) : void 0;
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
        color: 0.3 * r + 0.58 * g + 0.12 * b < 0x80 ? 'white' : 'black'
      };
    };

    Logger.prototype.addLots = function() {
      var order;
      if (order = this.selectedOrder) {
        this.lotsTextParser.parse(this.newLotsText).then(order.addLots.bind(order));
        return this.newLotsText = '';
      }
    };

    Logger.prototype.deleteLot = function(lot) {
      var _ref;
      return (_ref = this.selectedOrder) != null ? _ref.deleteLot(lot) : void 0;
    };

    Logger.prototype.saveOrder = function() {
      var order,
        _this = this;
      if (this.saving) {
        return;
      }
      this.saving = true;
      order = this.selectedOrder;
      return this.$http({
        method: 'PUT',
        url: this.loggerConstants.apiurl + this.user.name + '/' + order.id,
        data: JSON.stringify(order)
      }).success(function(data) {
        return order.id = data.id;
      })["finally"](function() {
        return _this.saving = false;
      });
    };

    Logger.prototype.deleteOrder = function() {
      var order;
      order = this.selectedOrder;
      this.selectedOrder = null;
      this.orders.splice(this.orders.indexOf(order), 1);
      return this.$http({
        method: 'DELETE',
        url: this.loggerConstants.apiurl + this.user.name + '/' + order.id
      });
    };

    return Logger;

  })(Controller);

  app.controller('logger', Logger.getController());

  angular.module('logger').constant('loggerConstants', {
    dataurl: '/data/',
    appurl: '/logger/',
    apiurl: '/logger/api/',
    _debug: {
      orders: [
        {
          title: 'BrickLink Order #1234567',
          labels: ['Label1'],
          date: '2013-07-27',
          comment: 'これはコメントです',
          lots: [
            {
              color: {
                id: 11,
                name: 'Black',
                rgb: 'black'
              },
              part: {
                id: 3004,
                name: 'Brick 1 x 2'
              },
              condition: 'New',
              priceEach: 'EUR 0.0501',
              amount: 100,
              price: 'EUR 5.0100'
            }, {
              color: {
                id: 5,
                name: 'Red',
                rgb: '#b30006'
              },
              part: {
                id: 3003,
                name: 'Brick 2 x 2'
              },
              condition: 'New',
              priceEach: 'US $0.03',
              amount: 200,
              price: 'US $6.00'
            }
          ]
        }, {
          title: 'BrickLink Order #1111111',
          labels: [],
          date: '2012-12-24',
          comment: 'コメント',
          lots: [
            {
              color: {
                name: ''
              },
              part: {
                name: '#2259 Ninjago Skull Motorbike'
              },
              condition: 'New',
              priceEach: '\\4,500',
              price: '\\4,500'
            }
          ]
        }, {
          title: 'BrickLink Order #1000000',
          labels: ['Label1', 'Label2'],
          date: '2012-05-10',
          comment: 'これもコメントです',
          lots: []
        }
      ]
    }
  });

  angular.module('logger').service('dataLoader', function($q, $http, loggerConstants) {
    return {
      cache: null,
      unescapeHTML: function(text) {
        return angular.element('<div>').html(text).text();
      },
      get: function(type) {
        var url;
        url = loggerConstants.dataurl + type;
        return $http.get(url).then(function(_arg) {
          var data, line, _i, _len, _ref, _results;
          data = _arg.data;
          _ref = data.trim().split('\r\n');
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            line = _ref[_i];
            if (line) {
              _results.push(line.split('\t'));
            }
          }
          return _results;
        });
      },
      load: function() {
        var categories, colorNames, colors, parts, type,
          _this = this;
        if (this.cache) {
          return $q.when(this.cache);
        }
        colors = {};
        colorNames = {};
        parts = {};
        categories = {};
        return $q.all((function() {
          var _i, _len, _ref, _results;
          _ref = ['colors', 'codes', 'parts'];
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            type = _ref[_i];
            _results.push(this.get(type));
          }
          return _results;
        }).call(this)).then(function(_arg) {
          var category, categoryId, categoryName, codesData, color, colorId, colorName, colorsData, id, name, part, partsData, rrggbb, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
          colorsData = _arg[0], codesData = _arg[1], partsData = _arg[2];
          for (_i = 0, _len = colorsData.length; _i < _len; _i++) {
            _ref = colorsData[_i], colorId = _ref[0], colorName = _ref[1], rrggbb = _ref[2];
            colors[colorId] = colorNames[colorName] = {
              id: colorId,
              name: _this.unescapeHTML(colorName),
              rgb: '#' + rrggbb
            };
          }
          for (_j = 0, _len1 = codesData.length; _j < _len1; _j++) {
            _ref1 = codesData[_j], id = _ref1[0], colorName = _ref1[1];
            color = colorNames[colorName];
            if (!color) {
              continue;
            }
            part = parts[id] || (parts[id] = {
              id: id,
              colors: []
            });
            if (__indexOf.call(part.colors, color) < 0) {
              part.colors.push(color);
            }
          }
          for (_k = 0, _len2 = partsData.length; _k < _len2; _k++) {
            _ref2 = partsData[_k], categoryId = _ref2[0], categoryName = _ref2[1], id = _ref2[2], name = _ref2[3];
            part = parts[id];
            if (!part) {
              continue;
            }
            category = categories[categoryId] || (categories[categoryId] = {
              id: categoryId,
              name: _this.unescapeHTML(categoryName),
              parts: []
            });
            part.name = _this.unescapeHTML(name);
            part.categoryId = categoryId;
            category.parts.push(part);
          }
          return _this.cache = {
            categories: categories,
            parts: parts,
            colors: colors
          };
        });
      }
    };
  });

}).call(this);
