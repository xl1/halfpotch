// Generated by CoffeeScript 1.6.0
(function() {
  var $, Assoc, Cart, CartSelectView, Color, ColorSelectView, DataLoader, ELSE, FormView, IF, Model, PartImageView, Retention, SelectModel, SelectView, StoreDataLoader, SuperArray, View, escapeHTML, main, uuid, xhrget,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = function(id) {
    return document.getElementById(id);
  };

  escapeHTML = (function() {
    var re, replacer;
    re = /[&<>'"]/g;
    replacer = function(x) {
      return x.charCodeAt(0);
    };
    return function(text) {
      return text.replace(re, replacer);
    };
  })();

  SuperArray = (function(_super) {

    __extends(SuperArray, _super);

    function SuperArray(ary) {
      if (ary == null) {
        ary = [];
      }
      Array.prototype.push.apply(this, ary);
    }

    SuperArray.prototype.minBy = function(func) {
      var d, min, res, solution, _i, _len, _ref;
      min = Infinity;
      solution = null;
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        d = this[_i];
        res = func(d);
        if (min > res) {
          _ref = [res, d], min = _ref[0], solution = _ref[1];
        }
      }
      return solution;
    };

    SuperArray.prototype.maxBy = function(func) {
      return this.minBy(function(d) {
        return -func(d);
      });
    };

    SuperArray.prototype.min = function() {
      return Math.min.apply(Math, this);
    };

    SuperArray.prototype.max = function() {
      return Math.max.apply(Math, this);
    };

    SuperArray.prototype.combinations = function(len) {
      var a, i, last, res, _i, _j, _len, _len1, _ref;
      if (!len) {
        return [[]];
      }
      res = [];
      for (i = _i = 0, _len = this.length; _i < _len; i = ++_i) {
        a = this[i];
        _ref = SuperArray.prototype.combinations.call(this.slice(i + 1), len - 1);
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          last = _ref[_j];
          res.push([a].concat(last));
        }
      }
      return res;
    };

    return SuperArray;

  })(Array);

  uuid = (function() {
    var re, replacer;
    re = /[xy]/g;
    replacer = function(c) {
      var r;
      r = Math.random() * 16 | 0;
      return (c === 'x' ? r : r & 3 | 8).toString(16);
    };
    return function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(re, replacer).toUpperCase();
    };
  })();

  Model = (function() {

    function Model() {
      this._uuid = uuid();
    }

    Model.prototype.change = function() {
      var arg, name;
      name = arguments[0], arg = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (name == null) {
        name = 'change';
      }
      return eve.apply(null, ["" + this._uuid + "." + name, null].concat(__slice.call(arg)));
    };

    Model.prototype.listen = function(name, func) {
      if (name == null) {
        name = 'change';
      }
      if (arguments.length === 1) {
        func = name;
        name = 'change';
      }
      return eve.on("" + this._uuid + "." + name, func.bind(this));
    };

    return Model;

  })();

  View = (function() {

    function View(model) {
      var _this = this;
      this.model = model;
      model.listen(function() {
        var arg;
        arg = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return _this.render.apply(_this, arg);
      });
    }

    View.prototype.render = function() {};

    return View;

  })();

  Color = (function() {

    function Color(r, g, b) {
      this.r = r != null ? r : 0;
      this.g = g != null ? g : 0;
      this.b = b != null ? b : 0;
    }

    Color.prototype.dist = function(color) {
      var db, dg, dr, _ref;
      _ref = [color.r - this.r, color.g - this.g, color.b - this.b], dr = _ref[0], dg = _ref[1], db = _ref[2];
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    Color.prototype.luma = function() {
      return this.r * 0.3 + this.g * 0.59 + this.b * 0.11;
    };

    Color.prototype.toArray = function() {
      return [this.r, this.g, this.b];
    };

    Color.prototype.toString = function() {
      return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
    };

    return Color;

  })();

  Assoc = (function(_super) {

    __extends(Assoc, _super);

    function Assoc(map) {
      this.map = map != null ? map : {};
      Assoc.__super__.constructor.call(this);
    }

    Assoc.prototype.keys = function() {
      return Object.keys(this.map);
    };

    Assoc.prototype.set = function(name, value) {
      this.map[name] = value;
      return this.change();
    };

    Assoc.prototype.get = function(name) {
      return this.map[name];
    };

    return Assoc;

  })(Model);

  FormView = (function(_super) {

    __extends(FormView, _super);

    function FormView(model, elem) {
      var input, _i, _len, _ref,
        _this = this;
      this.elem = elem;
      FormView.__super__.constructor.call(this, model);
      _ref = HTMLElement.prototype.querySelectorAll.call(elem, '[name]');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        this._setValue(input);
      }
      HTMLElement.prototype.addEventListener.call(elem, 'change', function(e) {
        return _this._setValue(e.target);
      }, false);
    }

    FormView.prototype._setValue = function(input) {
      var name, value, _ref;
      name = input.name, value = input.value;
      switch ((_ref = input.getAttribute('type')) != null ? _ref.toLowerCase() : void 0) {
        case 'number':
        case 'range':
          return this.model.set(name, +value || 0);
        case 'date':
        case 'datetime-local':
          return this.model.set(name, new Date(value));
        case 'checkbox':
          return this.model.set(name, input.checked);
        case 'radio':
          if (input.checked) {
            return this.model.set(name, value);
          }
          break;
        default:
          return this.model.set(name, value);
      }
    };

    return FormView;

  })(View);

  Retention = (function() {
    var ELSE, IF, NOT, UNLESS, WHEN;

    Retention.IF = IF = function(ret) {
      return function(success, fail) {
        if (ret.resolved) {
          if (typeof success === "function") {
            success();
          }
        } else if (ret.rejected) {
          if (typeof fail === "function") {
            fail();
          }
        } else {
          success && ret.successCallbacks.push(success);
          fail && ret.failCallbacks.push(fail);
        }
        return ret;
      };
    };

    Retention.UNLESS = UNLESS = function(ret) {
      return function(fail, success) {
        return IF(ret)(success, fail);
      };
    };

    Retention.ELSE = ELSE = function(x) {
      return x;
    };

    Retention.NOT = NOT = function(ret) {
      var r;
      r = new Retention();
      IF(ret)(function() {
        return r.reject(ret.result);
      });
      UNLESS(ret)(function() {
        return r.resolve(ret.error);
      });
      return r;
    };

    Retention.WHEN = WHEN = function(ret) {
      return function(callback) {
        return IF(ret)(callback, callback);
      };
    };

    Retention.prototype.result = null;

    Retention.prototype.error = null;

    Retention.prototype.resolved = false;

    Retention.prototype.rejected = false;

    function Retention() {
      this.successCallbacks = [];
      this.failCallbacks = [];
    }

    Retention.prototype.resolve = function(result) {
      var f, _i, _len, _ref;
      if (this.resolved || this.rejected) {
        return;
      }
      this.resolved = true;
      this.result = result;
      _ref = this.successCallbacks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        f();
      }
    };

    Retention.prototype.reject = function(error) {
      var f, _i, _len, _ref;
      if (this.resolved || this.rejected) {
        return;
      }
      this.rejected = true;
      this.error = error;
      _ref = this.failCallbacks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        f();
      }
    };

    Retention.prototype.AND = function(ret) {
      var r,
        _this = this;
      r = new Retention();
      IF(this)(function() {
        return IF(ret)(function() {
          return r.resolve();
        });
      });
      IF(ret)(function() {
        return IF(_this)(function() {
          return r.resolve();
        });
      });
      UNLESS(this)(function() {
        return r.reject();
      });
      UNLESS(ret)(function() {
        return r.reject();
      });
      return r;
    };

    Retention.prototype.DAND = function(ret) {
      var r,
        _this = this;
      r = new Retention();
      IF(this)(function() {
        return IF(ret)(function() {
          return r.resolve();
        });
      });
      IF(ret)(function() {
        return IF(_this)(function() {
          return r.resolve();
        });
      });
      UNLESS(this)(function() {
        return WHEN(ret)(function() {
          return r.reject();
        });
      });
      UNLESS(ret)(function() {
        return WHEN(_this)(function() {
          return r.reject();
        });
      });
      return r;
    };

    Retention.prototype.OR = function(ret) {
      var r,
        _this = this;
      r = new Retention();
      IF(this)(function() {
        return r.resolve();
      });
      IF(ret)(function() {
        return r.resolve();
      });
      UNLESS(this)(function() {
        return UNLESS(ret)(function() {
          return r.reject();
        });
      });
      UNLESS(ret)(function() {
        return UNLESS(_this)(function() {
          return r.reject();
        });
      });
      return r;
    };

    Retention.prototype.DOR = function(ret) {
      var r,
        _this = this;
      r = new Retention();
      IF(this)(function() {
        return WHEN(ret)(function() {
          return r.resolve();
        });
      });
      IF(ret)(function() {
        return WHEN(_this)(function() {
          return r.resolve();
        });
      });
      UNLESS(this)(function() {
        return UNLESS(ret)(function() {
          return r.reject();
        });
      });
      UNLESS(ret)(function() {
        return UNLESS(_this)(function() {
          return r.reject();
        });
      });
      return r;
    };

    return Retention;

  })();

  IF = Retention.IF, ELSE = Retention.ELSE;

  xhrget = function(url, param) {
    var k, r, xhr;
    if (param) {
      url += '?' + ((function() {
        var _i, _len, _ref, _results;
        _ref = Object.keys(param);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          k = _ref[_i];
          _results.push("" + k + "=" + param[k]);
        }
        return _results;
      })()).join('&');
    }
    r = new Retention();
    xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
      return r.resolve(xhr.responseText);
    };
    xhr.onerror = function() {
      return r.reject(xhr.statusText);
    };
    xhr.send();
    return r;
  };

  DataLoader = (function() {
    var source;

    function DataLoader() {}

    source = ['test/3.txt', 'test/5.txt', 'test/0.txt'];

    DataLoader.prototype.load = function(callback, errorCallback) {
      var categories, codesData, colorNames, colors, colorsData, parts, partsData;
      colors = {};
      colorNames = {};
      parts = {};
      categories = {};
      colorsData = this.get(source[0]);
      codesData = this.get(source[1]);
      partsData = this.get(source[2]);
      return IF(colorsData.AND(codesData.AND(partsData)))(function() {
        var category, categoryId, categoryName, color, colorId, colorName, id, name, part, rrggbb, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
        _ref = colorsData.result;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          _ref1 = _ref[_i], colorId = _ref1[0], colorName = _ref1[1], rrggbb = _ref1[2];
          colors[colorId] = colorNames[colorName] = {
            id: colorId,
            name: colorName,
            rgb: '#' + rrggbb
          };
        }
        _ref2 = codesData.result;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          _ref3 = _ref2[_j], id = _ref3[0], colorName = _ref3[1];
          part = parts[id] || (parts[id] = {
            id: id,
            colors: []
          });
          color = colorNames[colorName];
          if (__indexOf.call(part.colors, color) < 0) {
            part.colors.push(color);
          }
        }
        _ref4 = partsData.result;
        for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
          _ref5 = _ref4[_k], categoryId = _ref5[0], categoryName = _ref5[1], id = _ref5[2], name = _ref5[3];
          part = parts[id];
          if (!part) {
            continue;
          }
          part.name = name;
          category = categories[categoryId] || (categories[categoryId] = {
            id: categoryId,
            name: categoryName,
            parts: []
          });
          category.parts.push(part);
        }
        return callback({
          categories: categories,
          parts: parts,
          colors: colors
        });
      }, ELSE(function() {
        return typeof errorCallback === "function" ? errorCallback() : void 0;
      }));
    };

    DataLoader.prototype.get = function(url) {
      var data, r;
      r = new Retention();
      data = xhrget(url);
      IF(data)(function() {
        var line;
        return r.resolve((function() {
          var _i, _len, _ref, _results;
          _ref = data.result.split('\n');
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            line = _ref[_i];
            _results.push(line.split('\t'));
          }
          return _results;
        })());
      }, ELSE(function() {
        return r.reject();
      }));
      return r;
    };

    return DataLoader;

  })();

  StoreDataLoader = (function() {
    var baseurl;

    function StoreDataLoader() {}

    baseurl = '/script/getstoredata';

    StoreDataLoader.prototype.load = function() {
      var callback, data, id, ids;
      callback = arguments[0], ids = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      data = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = ids.length; _i < _len; _i++) {
          id = ids[_i];
          _results.push(xhrget(baseurl, {
            id: id
          }));
        }
        return _results;
      })();
      return IF(data.reduce(function(pre, cur) {
        return pre.AND(cur);
      }))(function() {
        var d, result;
        result = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            d = data[_i];
            _results.push(JSON.parse(d.result));
          }
          return _results;
        })();
        return callback(result);
      });
    };

    return StoreDataLoader;

  })();

  Cart = (function(_super) {

    __extends(Cart, _super);

    function Cart() {
      Cart.__super__.constructor.call(this);
      this.select = new SelectModel('cart');
    }

    Cart.prototype.register = function(part, color, amount) {
      if (part && color && amount) {
        return this.select.add({
          id: uuid(),
          part: part,
          color: color,
          amount: amount
        });
      }
    };

    Cart.prototype.calculate = function() {};

    return Cart;

  })(Model);

  SelectModel = (function(_super) {

    __extends(SelectModel, _super);

    function SelectModel(type) {
      this.type = type;
      SelectModel.__super__.constructor.call(this);
      this.item = null;
      this.options = [];
    }

    SelectModel.prototype.reset = function(source) {
      var id, ids, _i, _len;
      this.options = [];
      ids = Object.keys(source).sort(function(a, b) {
        return source[a].name.localeCompare(source[b].name);
      });
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        this.add(source[id], false);
      }
      return this.change();
    };

    SelectModel.prototype.add = function(item, change) {
      if (change == null) {
        change = true;
      }
      this.options.push(item);
      if (change) {
        return this.change('add', item);
      }
    };

    SelectModel.prototype.setItem = function(id) {
      var option, _i, _len, _ref;
      _ref = this.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        if (option.id === id) {
          this.item = option;
          this.change('select', option);
          return;
        }
      }
    };

    return SelectModel;

  })(Model);

  SelectView = (function(_super) {

    __extends(SelectView, _super);

    function SelectView(model, elem) {
      this.elem = elem;
      SelectView.__super__.constructor.call(this, model);
      model.listen('add', this.add.bind(this));
      elem.addEventListener('change', function(e) {
        return model.setItem(e.target.value);
      }, false);
    }

    SelectView.prototype._createLi = function(item) {
      var id, li, type;
      type = escapeHTML(this.model.type);
      id = escapeHTML(item.id);
      li = document.createElement('li');
      li.insertAdjacentHTML('beforeend', "<input type=\"radio\" id=\"" + (type + id) + "\" name=\"" + type + "\" value=\"" + id + "\">\n<label for=\"" + (type + id) + "\">" + (escapeHTML(item.name)) + "</label>");
      return li;
    };

    SelectView.prototype.add = function(option) {
      return this.elem.appendChild(this._createLi(option));
    };

    SelectView.prototype.render = function() {
      var frag, option, _i, _len, _ref;
      this.elem.innerHTML = '';
      frag = document.createDocumentFragment();
      _ref = this.model.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        frag.appendChild(this._createLi(option));
      }
      return this.elem.appendChild(frag);
    };

    return SelectView;

  })(View);

  ColorSelectView = (function(_super) {

    __extends(ColorSelectView, _super);

    function ColorSelectView() {
      return ColorSelectView.__super__.constructor.apply(this, arguments);
    }

    ColorSelectView.prototype._createLi = function(item) {
      var id, li;
      id = escapeHTML(item.id);
      li = document.createElement('li');
      li.insertAdjacentHTML('beforeend', "<input type=\"radio\" id=\"color" + id + "\" name=\"color\" value=\"" + id + "\">\n<label for=\"color" + id + "\">\n  <span class=\"color-box\"\n    style=\"background-color: " + (escapeHTML(item.rgb)) + ";\"></span>\n  " + (escapeHTML(item.name)) + "\n</label>");
      return li;
    };

    return ColorSelectView;

  })(SelectView);

  CartSelectView = (function(_super) {

    __extends(CartSelectView, _super);

    function CartSelectView() {
      return CartSelectView.__super__.constructor.apply(this, arguments);
    }

    CartSelectView.prototype._createLi = function(item) {
      var id, li, text;
      id = escapeHTML(item.id);
      text = escapeHTML("(" + item.amount + "x) " + item.color.name + " " + item.part.name);
      li = document.createElement('li');
      li.insertAdjacentHTML('beforeend', "<input type=\"radio\" id=\"cart" + id + "\" name=\"cart\" value=\"" + id + "\">\n<label for=\"cart" + id + "\">\n  <span class=\"color-box\"\n    style=\"background-color: " + (escapeHTML(item.color.rgb)) + ";\"></span>\n  " + text + "\n</label>");
      return li;
    };

    return CartSelectView;

  })(SelectView);

  PartImageView = (function(_super) {

    __extends(PartImageView, _super);

    function PartImageView(model, elem) {
      var img;
      this.elem = elem;
      PartImageView.__super__.constructor.call(this, model);
      img = document.createElement('img');
      elem.appendChild(img);
      model.listen('select', function(item) {
        var colorId;
        colorId = item.colors[0].id;
        img.onerror = function() {
          this.src = "http://img.bricklink.com/P/" + colorId + "/" + item.id + ".jpg";
          return this.onerror = null;
        };
        return img.src = "http://img.bricklink.com/P/" + colorId + "/" + item.id + ".gif";
      });
    }

    return PartImageView;

  })(View);

  main = function() {
    var cart, categorySelect, colorSelect, form, partSelect;
    categorySelect = new SelectModel('category');
    partSelect = new SelectModel('part');
    colorSelect = new SelectModel('color');
    cart = new Cart();
    form = new Assoc();
    new SelectView(categorySelect, $('categorySelect'));
    new SelectView(partSelect, $('partSelect'));
    new PartImageView(partSelect, $('image'));
    new ColorSelectView(colorSelect, $('colorSelect'));
    new CartSelectView(cart.select, $('cart'));
    new FormView(form, $('form'));
    categorySelect.listen('select', function(category) {
      partSelect.reset(category.parts);
      return colorSelect.reset([]);
    });
    partSelect.listen('select', function(part) {
      return colorSelect.reset(part.colors);
    });
    $('addButton').addEventListener('click', function() {
      return cart.register(partSelect.item, colorSelect.item, form.get('amount'));
    }, false);
    $('calculateButton').addEventListener('click', function() {
      return cart.calculate();
    }, false);
    return new DataLoader().load(function(data) {
      return categorySelect.reset(data.categories);
    });
  };

  document.addEventListener('DOMContentLoaded', main, false);

}).call(this);
