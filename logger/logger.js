// Generated by CoffeeScript 1.7.1
(function() {
  var Controller, Logger, OrderDetail, Statistics, app,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Controller = (function() {
    function Controller() {}

    Controller.getController = function() {
      var required;
      required = angular.injector().annotate(this);
      required.unshift('$scope');
      required.push((function(_this) {
        return function() {
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
        };
      })(this));
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
        return this.data.then((function(_this) {
          return function(data) {
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
          };
        })(this));
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
            return {
              name: p.name,
              categoryId: p.categoryId,
              id: p.id
            };
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
          p = p.replace(/,/g, '');
          priceEach = cur + p;
          price = cur + (+p * amount);
          return '';
        }).replace(/\s+([A-Z]{3} |[A-Z]{2} \$)([\d,\.]+)/, function(_, cur, p) {
          price = cur + p;
          return '';
        }).replace(/\ [.,]+ /g, ' ');
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

  app.factory('Order', function($http, dateFilter, lotsTextParser, route) {
    var Order;
    return Order = (function() {
      Order.fetchAll = function() {
        return $http.get(route.logger.api.orders()).then(function(_arg) {
          var data, o, _i, _len, _results;
          data = _arg.data;
          _results = [];
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            o = data[_i];
            _results.push(new Order(o));
          }
          return _results;
        });
      };

      function Order(order) {
        var _ref;
        if (order == null) {
          order = {};
        }
        this.id = order.id;
        this.title = (_ref = order.title) != null ? _ref : 'New Entry';
        this.comment = order.comment || '';
        this.date = order.date || dateFilter(new Date(), 'yyyy-MM-dd');
        this.labels = order.labels || [];
        this.lots = order.lots || [];
        if (order.unresolved) {
          lotsTextParser.parse(order.lotsText).then((function(_this) {
            return function(lots) {
              _this.lots = lots;
            };
          })(this));
        }
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

      Order.prototype.save = function() {
        var order;
        order = route.logger.api.order;
        return $http.post(this.id ? order.update(this.id) : order.create(), this.toJSON()).success((function(_this) {
          return function(_arg) {
            _this.id = _arg.id;
          };
        })(this));
      };

      Order.prototype["delete"] = function() {
        return $http.post(route.logger.api.order["delete"](this.id));
      };

      return Order;

    })();
  });

  Logger = (function(_super) {
    __extends(Logger, _super);

    function Logger($window, $http, route) {
      this.$window = $window;
      this.user = {};
      $http.get(route.logger.api.verify()).success((function(_this) {
        return function(user) {
          _this.user = user;
        };
      })(this));
    }

    Logger.prototype.move = function(url) {
      return this.$window.location.href = url;
    };

    return Logger;

  })(Controller);

  OrderDetail = (function(_super) {
    __extends(OrderDetail, _super);

    function OrderDetail($window, $q, lotsTextParser, Order) {
      this.$window = $window;
      this.$q = $q;
      this.lotsTextParser = lotsTextParser;
      this.Order = Order;
      this.orders = [];
      this.newLabelText = '';
      this.newLotsText = '';
      this.selectedOrder = null;
      this.isDirty = false;
      Order.fetchAll().then((function(_this) {
        return function(orders) {
          _this.orders = orders;
          return _this.selectedOrder = _this.orders[0];
        };
      })(this));
      $window.addEventListener('beforeunload', (function(_this) {
        return function() {
          _this.saveOrder();
        };
      })(this), false);
    }

    OrderDetail.prototype.select = function(order) {
      this.saveOrder();
      return this.selectedOrder = order;
    };

    OrderDetail.prototype.addOrder = function() {
      this.saveOrder();
      this.orders.unshift(this.selectedOrder = new this.Order());
      this.isDirty = true;
      return this.saveOrder();
    };

    OrderDetail.prototype.addLabel = function() {
      this.isDirty = true;
      this.selectedOrder.addLabel(this.newLabelText);
      return this.newLabelText = '';
    };

    OrderDetail.prototype.deleteLabel = function(label) {
      this.isDirty = true;
      return this.selectedOrder.deleteLabel(label);
    };

    OrderDetail.prototype.getLabelStyle = function(label) {
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

    OrderDetail.prototype.addLots = function() {
      var order;
      order = this.selectedOrder;
      this.isDirty = true;
      this.lotsTextParser.parse(this.newLotsText).then(order.addLots.bind(order));
      return this.newLotsText = '';
    };

    OrderDetail.prototype.deleteLot = function(lot) {
      this.isDirty = true;
      return this.selectedOrder.deleteLot(lot);
    };

    OrderDetail.prototype.saveOrder = function() {
      if (!this.isDirty) {
        return this.$q.all();
      }
      this.isDirty = false;
      return this.selectedOrder.save();
    };

    OrderDetail.prototype.deleteOrder = function() {
      var order;
      order = this.selectedOrder;
      this.selectedOrder = null;
      this.orders.splice(this.orders.indexOf(order), 1);
      return order["delete"]();
    };

    return OrderDetail;

  })(Controller);

  Statistics = (function(_super) {
    __extends(Statistics, _super);

    function Statistics(Order, exchangeRate) {
      this.exchangeRate = exchangeRate;
      this.totalParts = 0;
      this.totalPrice = 0;
      this.colors = [];
      exchangeRate.load().then((function(_this) {
        return function() {
          return _this.$watch('$parent.selectedOrder', _this.update.bind(_this));
        };
      })(this));
    }

    Statistics.prototype.update = function() {
      var colorMap, lot, m, order, v, _, _i, _j, _len, _len1, _name, _ref, _ref1;
      this.totalParts = 0;
      this.totalPrice = 0;
      colorMap = {};
      _ref = this.$parent.orders;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        order = _ref[_i];
        _ref1 = order.lots;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          lot = _ref1[_j];
          this.totalParts += lot.amount;
          if (lot.price) {
            this.totalPrice += this.exchangeRate.exchange(lot.price, 'JPY') || 0;
          }
          if (lot.color) {
            m = colorMap[_name = lot.color.id] || (colorMap[_name] = {
              color: lot.color,
              amount: 0
            });
            m.amount += lot.amount;
          }
        }
      }
      return this.colors = ((function() {
        var _results;
        _results = [];
        for (_ in colorMap) {
          if (!__hasProp.call(colorMap, _)) continue;
          v = colorMap[_];
          _results.push(v);
        }
        return _results;
      })()).sort(function(a, b) {
        return b.amount - a.amount;
      });
    };

    Statistics.prototype.getColorStyle = function(color) {
      return {
        backgroundColor: color.color.rgb,
        width: "" + (color.amount / this.totalParts * 100) + "%"
      };
    };

    return Statistics;

  })(Controller);

  app.controller('logger', Logger.getController());

  app.controller('orderDetail', OrderDetail.getController());

  app.controller('statistics', Statistics.getController());

  angular.module('logger').service('route', function() {
    var baseURL, makeRoute, route;
    baseURL = '';
    makeRoute = function(path, obj) {
      var key, result, value;
      switch (typeof obj) {
        case 'string':
          return function() {
            return baseURL + path + obj;
          };
        case 'function':
          return function() {
            return baseURL + path + obj.apply(null, arguments);
          };
        default:
          result = {};
          for (key in obj) {
            if (!__hasProp.call(obj, key)) continue;
            value = obj[key];
            result[key] = makeRoute(path + '/' + key, value);
          }
          return result;
      }
    };
    route = makeRoute('', {
      data: {
        fx: '',
        parts: '',
        colors: '',
        codes: ''
      },
      logger: {
        api: {
          verify: '',
          orders: function(name) {
            if (name) {
              return "/" + name;
            } else {
              return '';
            }
          },
          order: {
            create: '',
            update: function(id) {
              return "/" + id;
            },
            "delete": function(id) {
              return "/" + id;
            }
          }
        }
      }
    });
    route.setBaseURL = function(b) {
      return baseURL = b;
    };
    return route;
  });

  angular.module('logger').service('exchangeRate', function($http, route) {
    var currencyMap, data;
    data = null;
    currencyMap = {
      'ARS ': 'ARS',
      'AU $': 'AUD',
      'BRL ': 'BRL',
      'BGN ': 'BGN',
      'CA $': 'CAD',
      'CNY ': 'CNY',
      'HRK ': 'HRK',
      'CZK ': 'CZK',
      'DKK ': 'DKK',
      'EEK ': 'EEK',
      'EUR ': 'EUR',
      'GTQ ': 'GTQ',
      'HK $': 'HKD',
      'HUF ': 'HUF',
      'INR ': 'INR',
      'IDR ': 'IDR',
      'ILS ': 'ILS',
      'JPY ': 'JPY',
      'LVL ': 'LVL',
      'LTL ': 'LTL',
      'MOP ': 'MOP',
      'MYR ': 'MYR',
      'MXN ': 'MXN',
      'NZ $': 'NZD',
      'NOK ': 'NOK',
      'PHP ': 'PHP',
      'PLN ': 'PLN',
      'GBP ': 'GBP',
      'ROL ': 'RON',
      'RUB ': 'RUB',
      'RSD ': 'RSD',
      'SG $': 'SGD',
      'ZAR ': 'ZAR',
      'KRW ': 'KRW',
      'SEK ': 'SEK',
      'CHF ': 'CHF',
      'TWD ': 'TWD',
      'THB ': 'THB',
      'TRY ': 'TRY',
      'UAH ': 'UAH',
      'US $': 'USD',
      '\\': 'JPY'
    };
    return {
      load: function() {
        return $http.get(route.data.fx()).success((function(_this) {
          return function(_arg) {
            var rates;
            rates = _arg.rates;
            return data = rates;
          };
        })(this));
      },
      exchange: function(fromValue, toCurrency) {
        var fromCurrency, r, value;
        if (r = /([A-Z]{3} |[A-Z]{2} \$)([\d,\.]+)/.exec(fromValue)) {
          fromCurrency = r[1];
          value = +r[2];
          return value * data[toCurrency] / data[currencyMap[fromCurrency]];
        }
      }
    };
  });

  angular.module('logger').service('dataLoader', function($q, $http, route) {
    return {
      cache: null,
      unescapeHTML: function(text) {
        return angular.element('<div>').html(text).text();
      },
      get: function(type) {
        return $http.get(route.data[type]()).then(function(_arg) {
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
        var categories, colorNames, colors, parts, type;
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
        }).call(this)).then((function(_this) {
          return function(_arg) {
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
          };
        })(this));
      }
    };
  });

}).call(this);
