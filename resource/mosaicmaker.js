// Generated by CoffeeScript 1.6.0
(function() {
  var $, Assoc, Color, FormView, ImageProcessor, ImageProcessorOption, Model, Palette, PaletteView, PartsAmountView, RendererView, SuperArray, View, cancelEvent, colorsToCanvas, constants, main, uuid,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  $ = function(id) {
    return document.getElementById(id);
  };

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
      return eve.on("" + this._uuid + "." + name, func);
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
      _ref = HTMLFormElement.prototype.querySelectorAll.call(elem, '[name]');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        this._setValue(input);
      }
      HTMLFormElement.prototype.addEventListener.call(elem, 'change', function(e) {
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

  constants = {
    mosaic: {
      vshader: "attribute vec2 a_position;\nvarying vec2 v_texCoord;\n\nvoid main(){\n  v_texCoord = a_position / 2.0 + vec2(0.5);\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}",
      fshader: {
        noop: "precision mediump float;\nuniform sampler2D u_source;\nvarying vec2 v_texCoord;\n\nvoid main(){\n  gl_FragColor = texture2D(u_source, v_texCoord);\n}",
        reduceColorDithered: "  precision mediump float;\n  uniform sampler2D u_source;\n  uniform sampler2D u_colors;\n\n  uniform bool u_vivid;\n  uniform float u_brightness;\n  uniform float u_contrast;\n\n  varying vec2 v_texCoord;\n\n  const int COMBINATIONS = 128;\n  const float GAMMA = 2.2;\n\n  vec4 gamma(vec4 color){\n    return pow(color, vec4(GAMMA));\n  }\n  vec4 ungamma(vec4 color){\n    return pow(color, vec4(1.0 / GAMMA));\n  }\n  \n  void getColors(in int idx, out vec4 c1, out vec4 c2){\n    float x = (0.5 + float(idx)) / float(COMBINATIONS);\n    c1 = gamma(texture2D(u_colors, vec2(x, 0.0)));\n    c2 = gamma(texture2D(u_colors, vec2(x, 2.0)));\n  }\n  float dist(vec4 srcColor, vec4 color){\n    float d = distance(srcColor, color);\n    if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.4);\n    return d;\n  }\n  float ditherIndex(){\n    float p = floor(mod(gl_FragCoord.x, 4.0));\n    float q = floor(mod(p - gl_FragCoord.y, 4.0));\n    return (\n      8.0 * mod(q, 2.0) +\n      4.0 * mod(p, 2.0) +\n      2.0 * floor(q / 2.0) +\n      floor(p / 2.0) +\n      0.5\n    ) / 16.0;\n  }\n  float calculateBestRatio(vec4 srcColor, vec4 c1, vec4 c2){\n    vec4 dif = c2 - c1;\n    return floor(\n      0.5 + dot(dif, srcColor - c1) / dot(dif, dif) * 16.0\n    ) / 16.0;\n  }\n  vec4 dither(vec4 srcColor){\n    vec4 c1, c2, canditate;\n    float ratio;\n    float d, minDist = 9.9;\n    float index = ditherIndex();\n    \n    for(int i = 0; i < COMBINATIONS; i++){\n      getColors(i, c1, c2);\n      ratio = calculateBestRatio(srcColor, c1, c2);\n      d =\n        dist(srcColor, mix(c1, c2, clamp(ratio, 0.0, 1.0))) +\n        distance(c1, c2) * 0.2;\n      if(minDist > d){\n        minDist = d;\n        if(index > ratio){\n          canditate = c1;\n        } else {\n          canditate = c2;\n        }\n      }\n    }\n    return canditate;\n  }\n    \n  float filterComponent(float color){\n    color = pow(color, exp(-u_brightness));\n    if(color < 0.5){\n      return 0.5 * pow(2.0 * color, exp(u_contrast));\n    } else {\n      return 0.5 * pow(2.0 * color - 1.0, exp(-u_contrast)) + 0.5;\n    }\n  }\n  vec4 getSourceColor(){\n    vec4 col = texture2D(u_source, v_texCoord);\n    return gamma(vec4(\n      filterComponent(col.r), filterComponent(col.g),\n      filterComponent(col.b), 1.0\n    ));\n  }\n  void main(){\n    gl_FragColor = ungamma(dither(getSourceColor()));\n  }",
        reduceColor: "precision mediump float;\nuniform sampler2D u_source;\nuniform sampler2D u_colors;\n\nuniform bool u_vivid;\nuniform float u_brightness;\nuniform float u_contrast;\n\nvarying vec2 v_texCoord;\n\nconst int COLORLEN = 32;\nconst float GAMMA = 2.2;\n\nvec4 gamma(vec4 color){\n  return pow(color, vec4(GAMMA));\n}\nvec4 ungamma(vec4 color){\n  return pow(color, vec4(1.0 / GAMMA));\n}\n\nvec4 getColor(int idx){\n  float x = (0.5 + float(idx)) / float(COLORLEN);\n  return gamma(texture2D(u_colors, vec2(x, 0.5)));\n}\nfloat dist(vec4 srcColor, vec4 color){\n  float d = distance(srcColor, color);\n  if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.4);\n  return d;\n}\nvec4 nearest(vec4 srcColor){\n  vec4 col, minCol;\n  float d, mind = 9.9;\n  \n  for(int i = 0; i < COLORLEN; i++){\n    col = getColor(i);\n    d = dist(srcColor, col);\n    if(mind > d){\n      minCol = col;\n      mind = d;\n    }\n  }\n  return minCol;\n}\n  \nfloat filterComponent(float color){\n  color = pow(color, exp(-u_brightness));\n  if(color < 0.5){\n    return 0.5 * pow(2.0 * color, exp(u_contrast));\n  } else {\n    return 0.5 * pow(2.0 * color - 1.0, exp(-u_contrast)) + 0.5;\n  }\n}\nvec4 getSourceColor(){\n  vec4 col = texture2D(u_source, v_texCoord);\n  return gamma(vec4(\n    filterComponent(col.r), filterComponent(col.g),\n    filterComponent(col.b), 1.0\n  ));\n}\nvoid main(){\n  gl_FragColor = ungamma(nearest(getSourceColor()));\n}",
        blueprint: "precision mediump float;\nuniform sampler2D u_source;\nuniform vec2 u_unitSize;\nuniform vec2 u_domainSize;\nuniform float u_scale;\nuniform sampler2D u_colors;\n\nvarying vec2 v_texCoord;\n\nconst int COLORLEN = 32;\n\nbool checked(vec4 color){\n  float x;\n  for(int i = 0; i < COLORLEN; i++){\n    x = (0.5 + float(i)) / float(COLORLEN);\n    if(color == texture2D(u_colors, vec2(x, 0.5))) return true;\n  }\n  return false;\n}\nfloat luma(vec4 color){\n  return dot(vec3(0.3, 0.59, 0.11), color.rgb);\n}\nvec4 borderColor(vec4 color, float degree){\n  if(luma(color) < 0.5) return color + vec4(degree);\n  return color - vec4(vec3(degree), 0.0);\n}\nvoid main(){\n  vec2 pos = (gl_FragCoord.xy - vec2(0.5)) / u_scale;\n  vec2 unitCoord = mod(pos, u_unitSize);\n  vec2 domainCoord = mod(pos, u_unitSize * u_domainSize);\n  vec4 color = texture2D(u_source, v_texCoord);\n  \n  if(any(equal(domainCoord, vec2(0.0)))){\n    gl_FragColor = borderColor(color, 1.0);\n  } else if(unitCoord.x == unitCoord.y && checked(color) ||\n      any(equal(unitCoord, vec2(0.0)))){\n    gl_FragColor = borderColor(color, 0.3);\n  } else {\n    gl_FragColor = color;\n  }\n}"
      },
      colors: (function() {
        var b, checked, cls, g, name, r, use, _i, _len, _ref, _results;
        cls = [['Black', 33, 33, 33, true], ['Dark Gray', 107, 90, 90, true], ['Light Gray', 156, 156, 156, true], ['Very Light Gray', 232, 232, 232, true, true], ['White', 255, 255, 255, true], ['Dark Bluish Gray', 89, 93, 96], ['Light Bluish Gray', 175, 181, 199], ['Blue', 0, 87, 166], ['Red', 179, 0, 6], ['Yellow', 247, 209, 23], ['Green', 0, 100, 46], ['Tan', 222, 198, 156], ['Reddish Brown', 137, 53, 29], ['Dark Blue', 20, 48, 68], ['Bright Pink', 243, 154, 194], ['Brown', 83, 33, 21], ['Dark Purple', 95, 38, 131], ['Dark Red', 106, 14, 21], ['Dark Tan', 144, 116, 80], ['Dark Turquoise', 0, 138, 128], ['Lime', 166, 202, 85], ['Maersk Blue', 107, 173, 214], ['Medium Blue', 97, 175, 255], ['Medium Lavender', 181, 165, 213], ['Medium Orange', 255, 165, 49], ['Orange', 255, 126, 20], ['Pink', 255, 199, 225], ['Purple', 165, 73, 156], ['Sand Blue', 90, 113, 132], ['Sand Green', 118, 162, 144]];
        _results = [];
        for (_i = 0, _len = cls.length; _i < _len; _i++) {
          _ref = cls[_i], name = _ref[0], r = _ref[1], g = _ref[2], b = _ref[3], use = _ref[4], checked = _ref[5];
          _results.push({
            name: name,
            color: new Color(r, g, b),
            use: use,
            checked: checked
          });
        }
        return _results;
      })(),
      option: {
        width: 48,
        height: 120,
        mode: 'stack-plate',
        unitSize: [5, 2],
        domainSize: [4, 6],
        dither: false,
        vivid: false,
        brightness: 0,
        contrast: 0,
        scale: 4
      }
    }
  };

  colorsToCanvas = (function() {
    var ctx;
    ctx = document.createElement('canvas').getContext('2d');
    return function(ary) {
      var color, height, idata, inner, width, x, y, _i, _j, _len, _len1, _ref;
      if (arguments.length === 3) {
        width = arguments[0], height = arguments[1], ary = arguments[2];
      } else {
        _ref = [ary.length, ary[0].length], width = _ref[0], height = _ref[1];
      }
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      idata = ctx.createImageData(width, height);
      for (x = _i = 0, _len = ary.length; _i < _len; x = ++_i) {
        inner = ary[x];
        if (!('length' in inner)) {
          inner = [inner];
        }
        for (y = _j = 0, _len1 = inner.length; _j < _len1; y = ++_j) {
          color = inner[y];
          idata.data.set([color.r, color.g, color.b, 255], (x + y * width) << 2);
        }
      }
      ctx.putImageData(idata, 0, 0);
      return ctx.canvas;
    };
  })();

  ImageProcessorOption = (function(_super) {

    __extends(ImageProcessorOption, _super);

    function ImageProcessorOption() {
      return ImageProcessorOption.__super__.constructor.apply(this, arguments);
    }

    ImageProcessorOption.prototype.init = function(proc) {
      this.proc = proc;
    };

    ImageProcessorOption.prototype.set = function(name, value) {
      var _ref, _ref1;
      this.map[name] = value;
      if (name === 'mode') {
        _ref = ((function() {
          switch (value) {
            case 'stack-plate':
              return [[5, 2], [4, 6]];
            case 'stack-brick':
              return [[5, 5], [4, 4]];
            case 'lay':
              return [[5, 6], [4, 4]];
          }
        })()), this.map.unitSize = _ref[0], this.map.domainSize = _ref[1];
      }
      if (name === 'mode' || name === 'width') {
        this.map.height = this.map.width * this.map.unitSize[0] / this.map.unitSize[1];
      }
      this.change();
      return (_ref1 = this.proc) != null ? _ref1.render() : void 0;
    };

    ImageProcessorOption.prototype.get = function(name) {
      var _ref, _ref1, _ref2, _ref3;
      switch (name) {
        case 'unitWidth':
          return (_ref = this.map.unitSize) != null ? _ref[0] : void 0;
        case 'unitHeight':
          return (_ref1 = this.map.unitSize) != null ? _ref1[1] : void 0;
        case 'domainWidth':
          return (_ref2 = this.map.domainSize) != null ? _ref2[0] : void 0;
        case 'domainHeight':
          return (_ref3 = this.map.domainSize) != null ? _ref3[1] : void 0;
        default:
          return this.map[name];
      }
    };

    return ImageProcessorOption;

  })(Assoc);

  ImageProcessor = (function(_super) {

    __extends(ImageProcessor, _super);

    ImageProcessor.prototype.program = {};

    ImageProcessor.prototype.vshader = constants.mosaic.vshader;

    ImageProcessor.prototype.fshader = constants.mosaic.fshader;

    function ImageProcessor(option, palette) {
      var name, _i, _len, _ref;
      this.option = option;
      this.palette = palette;
      ImageProcessor.__super__.constructor.call(this);
      this._gl = new MicroGL({
        antialias: false
      });
      _ref = Object.keys(this.fshader);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        this.program[name] = this._gl.makeProgram(this.vshader, this.fshader[name]);
      }
      this.colorReduced = document.createElement('canvas').getContext('2d');
      this._img = document.createElement('img');
    }

    ImageProcessor.prototype._renderGL = function(width, height, program, source, u_colors) {
      var name, tex, vars, _i, _len, _ref;
      vars = {
        u_colors: u_colors
      };
      _ref = this.option.keys();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        vars['u_' + name] = this.option.get(name);
      }
      tex = this._gl.texture(source);
      return this._gl.texParameter(tex, {
        filter: 'NEAREST'
      }).init(null, width, height).program(program).bindVars({
        a_position: [-1, -1, -1, 1, 1, -1, 1, 1],
        u_source: tex
      }).bindVars(vars).draw().gl.canvas;
    };

    ImageProcessor.prototype._reduceColor = function() {
      var c, canv, colorCanv, colors, program;
      colors = (function() {
        var _i, _len, _ref, _results;
        _ref = this.palette.colors;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          if (c.use) {
            _results.push(c.color);
          }
        }
        return _results;
      }).call(this);
      if (this.option.get('dither')) {
        program = this.program.reduceColorDithered;
        colors = colorCanv = colorsToCanvas(128, 2, SuperArray.prototype.combinations.call(colors.sort(function(a, b) {
          return a.luma() - b.luma();
        }), 2).sort(function(_arg, _arg1) {
          var a1, a2, b1, b2;
          a1 = _arg[0], a2 = _arg[1];
          b1 = _arg1[0], b2 = _arg1[1];
          return a1.dist(a2) - b1.dist(b2);
        }).slice(0, 128));
      } else {
        program = this.program.reduceColor;
        colorCanv = colorsToCanvas(32, 1, colors);
      }
      canv = this.colorReduced.canvas;
      canv.width = this.width = this.option.get('width');
      canv.height = this.height = this.option.get('height') * this._img.height / this._img.width | 0;
      return this.colorReduced.drawImage(this._renderGL(this.width, this.height, program, this._img, colorCanv), 0, 0);
    };

    ImageProcessor.prototype._countAmount = function() {
      var amounts, c, color, data, i, _i, _j, _len, _ref, _ref1;
      data = this.colorReduced.getImageData(0, 0, this.width, this.height).data;
      amounts = {};
      for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 4) {
        color = (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return Object(result) === result ? result : child;
        })(Color, data.subarray(i, i + 3), function(){});
        amounts[color] || (amounts[color] = 0);
        amounts[color]++;
      }
      _ref1 = this.palette.colors;
      for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
        c = _ref1[_j];
        c.amount = amounts[c.color];
      }
      return this.palette.change();
    };

    ImageProcessor.prototype._renderProc = function() {
      this._reduceColor();
      this._countAmount();
      return this.change();
    };

    ImageProcessor.prototype.render = function(source) {
      if (source) {
        this._img.onload = this._renderProc.bind(this);
        return this._img.src = source;
      } else {
        return this._renderProc();
      }
    };

    ImageProcessor.prototype.getThumbnail = function() {
      return this._renderGL(this.width * this.option.get('unitWidth'), this.height * this.option.get('unitHeight'), this.program.noop, this.colorReduced.canvas);
    };

    ImageProcessor.prototype.getBlueprint = function() {
      var c, scale;
      scale = this.option.get('scale');
      return this._renderGL(this.width * this.option.get('unitWidth') * scale, this.height * this.option.get('unitHeight') * scale, this.program.blueprint, this.colorReduced.canvas, colorsToCanvas(32, 1, (function() {
        var _i, _len, _ref, _results;
        _ref = this.palette.colors;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          if (c.checked) {
            _results.push([c.color]);
          }
        }
        return _results;
      }).call(this)));
    };

    return ImageProcessor;

  })(Model);

  Palette = (function(_super) {

    __extends(Palette, _super);

    function Palette(colors) {
      var c, i, _i, _len, _ref;
      this.colors = colors != null ? colors : [];
      this._idx = {};
      _ref = this.colors;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        c = _ref[i];
        this._idx[c.name] = i;
      }
    }

    Palette.prototype.init = function(proc) {
      this.proc = proc;
    };

    Palette.prototype.color = function(name) {
      return this.colors[this._idx[name]];
    };

    Palette.prototype.use = function(name) {
      this.color(name).use = true;
      this.change();
      return this.proc.render();
    };

    Palette.prototype.unuse = function(name) {
      var color;
      color = this.color(name);
      color.use = color.checked = false;
      this.change();
      return this.proc.render();
    };

    Palette.prototype.check = function(name) {
      this.color(name).checked = true;
      return this.change();
    };

    Palette.prototype.uncheck = function(name) {
      this.color(name).checked = false;
      return this.change();
    };

    Palette.prototype.setAmount = function(name, value) {
      this.color(name).amount = value;
      return this.change();
    };

    return Palette;

  })(Model);

  PaletteView = (function(_super) {

    __extends(PaletteView, _super);

    function PaletteView(model, elem) {
      var c, frag, li, _i, _len, _ref;
      this.elem = elem;
      PaletteView.__super__.constructor.call(this, model);
      frag = document.createDocumentFragment();
      _ref = model.colors;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        li = document.createElement('li');
        li.style.backgroundColor = c.color;
        li.dataset.name = c.name;
        frag.appendChild(li);
      }
      elem.appendChild(frag);
      elem.addEventListener('click', function(e) {
        var color, name;
        name = e.target.dataset.name;
        color = model.color(name);
        if (!color) {
          return;
        }
        if (color.checked) {
          return model.unuse(name);
        } else if (color.use) {
          return model.check(name);
        } else {
          return model.use(name);
        }
      }, false);
      this.render();
    }

    PaletteView.prototype.render = function() {
      var classes, color, li, _i, _len, _ref, _results;
      _ref = this.elem.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        li = _ref[_i];
        color = this.model.color(li.dataset.name);
        classes = [];
        if (color.use) {
          classes.push('color-use');
        }
        if (color.checked) {
          if (color.color.luma() < 128) {
            classes.push('color-checked-dark');
          } else {
            classes.push('color-checked-light');
          }
        }
        _results.push(li.className = classes.join(' '));
      }
      return _results;
    };

    return PaletteView;

  })(View);

  PartsAmountView = (function(_super) {

    __extends(PartsAmountView, _super);

    function PartsAmountView(model, elem) {
      this.elem = elem;
      PartsAmountView.__super__.constructor.call(this, model);
      this.render();
    }

    PartsAmountView.prototype._createLi = function(_arg) {
      var amount, color, colorBox, li, name;
      name = _arg.name, color = _arg.color, amount = _arg.amount;
      colorBox = document.createElement('span');
      colorBox.className = 'color-box';
      colorBox.style.backgroundColor = color;
      li = document.createElement('li');
      li.appendChild(colorBox);
      li.appendChild(document.createTextNode("(" + amount + "x) " + name));
      return li;
    };

    PartsAmountView.prototype.render = function() {
      var c, frag, _i, _len, _ref;
      this.elem.innerHTML = '';
      frag = document.createDocumentFragment();
      _ref = this.model.colors;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        if (c.amount) {
          frag.appendChild(this._createLi(c));
        }
      }
      return this.elem.appendChild(frag);
    };

    return PartsAmountView;

  })(View);

  RendererView = (function(_super) {

    __extends(RendererView, _super);

    RendererView.prototype.rendered = false;

    function RendererView(model, elem) {
      this.elem = elem;
      RendererView.__super__.constructor.call(this, model);
      this._ctx = elem.getContext('2d');
    }

    RendererView.prototype.show = function(file) {
      var url;
      if (file) {
        if (!~file.type.indexOf('image')) {
          return;
        }
        url = window.URL.createObjectURL(file);
      } else {
        if (!this.rendered) {
          return;
        }
      }
      this.rendered = true;
      return this.model.render(url);
    };

    RendererView.prototype.render = function() {
      var thumb;
      if (!this.rendered) {
        return;
      }
      thumb = this.model.getThumbnail();
      this.elem.width = thumb.width;
      this.elem.height = thumb.height;
      return this._ctx.drawImage(thumb, 0, 0);
    };

    RendererView.prototype.showBlueprint = function() {
      if (!this.rendered) {
        return;
      }
      return window.open(this.model.getBlueprint().toDataURL('image/png'));
    };

    return RendererView;

  })(View);

  cancelEvent = function(e) {
    e.stopPropagation();
    return e.preventDefault();
  };

  main = function() {
    var option, palette, proc, view;
    palette = new Palette(constants.mosaic.colors);
    new PaletteView(palette, $('palette'));
    new PartsAmountView(palette, $('amount'));
    option = new ImageProcessorOption(constants.mosaic.option);
    new FormView(option, $('form'));
    proc = new ImageProcessor(option, palette);
    view = new RendererView(proc, $('canv'));
    palette.init(proc);
    option.init(proc);
    document.body.addEventListener('dragenter', cancelEvent, false);
    document.body.addEventListener('dragover', cancelEvent, false);
    document.body.addEventListener('drop', function(e) {
      var _ref, _ref1;
      cancelEvent(e);
      return view.show((_ref = e.dataTransfer) != null ? (_ref1 = _ref.files) != null ? _ref1[0] : void 0 : void 0);
    }, false);
    return $('render-button').addEventListener('click', (function() {
      return view.showBlueprint();
    }), false);
  };

  document.addEventListener('DOMContentLoaded', main, false);

}).call(this);
