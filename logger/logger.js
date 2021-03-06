// Generated by CoffeeScript 1.12.6
(function() {
  var Controller, Logger, OrderDetail, Statistics, app,
    slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Controller = (function() {
    function Controller() {}

    Controller.getController = function() {
      var required;
      required = angular.injector().annotate(this);
      required.unshift('$scope');
      required.push((function(_this) {
        return function() {
          var $scope, args, key, ref, value;
          $scope = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
          ref = _this.prototype;
          for (key in ref) {
            value = ref[key];
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
      data: dataLoader.load().then(function(arg) {
        var _, c, colorList, colors, p, partList, parts;
        parts = arg.parts, colors = arg.colors;
        partList = ((function() {
          var results;
          results = [];
          for (_ in parts) {
            p = parts[_];
            results.push(p);
          }
          return results;
        })()).sort(function(a, b) {
          return b.name.length - a.name.length;
        });
        colorList = ((function() {
          var results;
          results = [];
          for (_ in colors) {
            c = colors[_];
            results.push(c);
          }
          return results;
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
            var j, len, line, ref, results;
            ref = text.split(/[\r\n]+/);
            results = [];
            for (j = 0, len = ref.length; j < len; j++) {
              line = ref[j];
              if (line) {
                results.push(_this.parseLotText(line, data));
              }
            }
            return results;
          };
        })(this));
      },
      searchColor: function(text, arg) {
        var c, colorList, j, len;
        colorList = arg.colorList;
        for (j = 0, len = colorList.length; j < len; j++) {
          c = colorList[j];
          if (text.indexOf(c.name) >= 0) {
            return c;
          }
        }
      },
      searchPart: function(text, arg) {
        var j, len, p, partList;
        partList = arg.partList;
        for (j = 0, len = partList.length; j < len; j++) {
          p = partList[j];
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
        var amount, cname, color, condition, idx, part, price, priceEach, ref;
        condition = '';
        amount = 1;
        priceEach = '';
        price = '';
        text = text.replace(/\[(new|used)\]/i, function(_, cond) {
          condition = cond.toLowerCase() === 'new' ? 'New' : 'Used';
          return '';
        }).replace(/(?:\Wx(\d+)\W)|(?:\W(\d+)x\W)/i, function(_, a1, a2) {
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
        });
        text = (ref = /[^ ]*\w.*\w[^ ]*/.exec(text)) != null ? ref[0] : void 0;
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
        return $http.get(route.logger.api.orders()).then(function(arg) {
          var data, j, len, o, results;
          data = arg.data;
          results = [];
          for (j = 0, len = data.length; j < len; j++) {
            o = data[j];
            results.push(new Order(o));
          }
          return results;
        });
      };

      Order.uploadArchive = function(file) {
        var fd;
        fd = new FormData;
        fd.append('file', file);
        return $http.post(route.logger.api["import"](), fd, {
          transformRequest: function(x) {
            return x;
          },
          headers: {
            'Content-Type': false
          }
        });
      };

      function Order(order) {
        var ref;
        if (order == null) {
          order = {};
        }
        this.id = order.id;
        this.title = (ref = order.title) != null ? ref : 'New Entry';
        this.comment = order.comment || '';
        this.date = order.date || dateFilter(new Date(), 'yyyy-MM-dd');
        this.labels = order.labels || [];
        this.lots = order.lots || [];
        if (order.unresolved) {
          lotsTextParser.parse(order.lotsText).then((function(_this) {
            return function(lots1) {
              _this.lots = lots1;
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
        var ref;
        return (ref = this.lots).push.apply(ref, lots);
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
          return function(arg) {
            _this.id = arg.id;
          };
        })(this));
      };

      Order.prototype["delete"] = function() {
        return $http.post(route.logger.api.order["delete"](this.id));
      };

      return Order;

    })();
  });

  Logger = (function(superClass) {
    extend(Logger, superClass);

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

  OrderDetail = (function(superClass) {
    extend(OrderDetail, superClass);

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
      this.Order.fetchAll().then((function(_this) {
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
      var b, g, i, j, len, r, s, t, x;
      x = 0xC0FFEE;
      for (j = 0, len = label.length; j < len; j++) {
        s = label[j];
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

    OrderDetail.prototype.toggleImportPanel = function() {
      return this.showingImportPanel = !this.showingImportPanel;
    };

    OrderDetail.prototype.uploadArchive = function() {
      var file, ref;
      if (file = (ref = document.getElementById('importFile').files) != null ? ref[0] : void 0) {
        return this.Order.uploadArchive(file).then((function(_this) {
          return function() {
            return _this.$window.location.reload();
          };
        })(this));
      }
    };

    return OrderDetail;

  })(Controller);

  Statistics = (function(superClass) {
    extend(Statistics, superClass);

    function Statistics(Order, exchangeRate) {
      this.exchangeRate = exchangeRate;
      this.totalParts = 0;
      this.totalPrice = 0;
      this.colors = [];
      this.exchangeRate.load().then((function(_this) {
        return function() {
          return _this.$watch('$parent.selectedOrder', _this.update.bind(_this));
        };
      })(this));
    }

    Statistics.prototype.update = function() {
      var _, colorMap, j, k, len, len1, lot, m, name1, order, ref, ref1, v;
      this.totalParts = 0;
      this.totalPrice = 0;
      colorMap = {};
      ref = this.$parent.orders;
      for (j = 0, len = ref.length; j < len; j++) {
        order = ref[j];
        ref1 = order.lots;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          lot = ref1[k];
          this.totalParts += lot.amount;
          if (lot.price) {
            this.totalPrice += this.exchangeRate.exchange(lot.price, 'JPY') || 0;
          }
          if (lot.color) {
            m = colorMap[name1 = lot.color.id] || (colorMap[name1] = {
              color: lot.color,
              amount: 0
            });
            m.amount += lot.amount;
          }
        }
      }
      return this.colors = ((function() {
        var results;
        results = [];
        for (_ in colorMap) {
          if (!hasProp.call(colorMap, _)) continue;
          v = colorMap[_];
          results.push(v);
        }
        return results;
      })()).sort(function(a, b) {
        return b.amount - a.amount;
      });
    };

    Statistics.prototype.getColorStyle = function(color) {
      return {
        backgroundColor: color.color.rgb,
        width: (color.amount / this.totalParts * 100) + "%"
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
            if (!hasProp.call(obj, key)) continue;
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
          },
          "import": ''
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
          return function(arg) {
            var rates;
            rates = arg.rates;
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
        return $http.get(route.data[type]()).then(function(arg) {
          var data, j, len, line, ref, results;
          data = arg.data;
          ref = data.trim().split('\r\n');
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            line = ref[j];
            if (line) {
              results.push(line.split('\t'));
            }
          }
          return results;
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
          var j, len, ref, results;
          ref = ['colors', 'codes', 'parts'];
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            type = ref[j];
            results.push(this.get(type));
          }
          return results;
        }).call(this)).then((function(_this) {
          return function(arg) {
            var category, categoryId, categoryName, codesData, color, colorId, colorName, colorsData, id, j, k, l, len, len1, len2, name, part, partsData, ref, ref1, ref2, rrggbb;
            colorsData = arg[0], codesData = arg[1], partsData = arg[2];
            for (j = 0, len = colorsData.length; j < len; j++) {
              ref = colorsData[j], colorId = ref[0], colorName = ref[1], rrggbb = ref[2];
              colors[colorId] = colorNames[colorName] = {
                id: colorId,
                name: _this.unescapeHTML(colorName),
                rgb: '#' + rrggbb
              };
            }
            for (k = 0, len1 = codesData.length; k < len1; k++) {
              ref1 = codesData[k], id = ref1[0], colorName = ref1[1];
              color = colorNames[colorName];
              if (!color) {
                continue;
              }
              part = parts[id] || (parts[id] = {
                id: id,
                colors: []
              });
              if (indexOf.call(part.colors, color) < 0) {
                part.colors.push(color);
              }
            }
            for (l = 0, len2 = partsData.length; l < len2; l++) {
              ref2 = partsData[l], categoryId = ref2[0], categoryName = ref2[1], id = ref2[2], name = ref2[3];
              part = parts[id] || (parts[id] = {
                id: id,
                colors: []
              });
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
