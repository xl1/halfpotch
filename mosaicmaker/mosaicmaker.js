// Generated by CoffeeScript 1.12.6
(function() {
  var $, Assoc, Color, FormView, ImageProcessor, ImageProcessorOption, Model, Palette, PaletteView, PartsAmountView, RendererView, SuperArray, View, cancelEvent, colorsToCanvas, constants, escapeHTML, main, unescapeHTML, uuid,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  $ = function(id) {
    return document.getElementById(id);
  };

  escapeHTML = (function() {
    var re, replacer;
    re = /[&<>'"]/g;
    replacer = function(x) {
      return '&#' + x.charCodeAt(0) + ';';
    };
    return function(text) {
      return text.replace(re, replacer);
    };
  })();

  unescapeHTML = (function() {
    var div;
    div = document.createElement('div');
    return function(text) {
      div.innerHTML = text;
      return div.textContent;
    };
  })();

  SuperArray = (function(superClass) {
    extend(SuperArray, superClass);

    function SuperArray(ary) {
      if (ary == null) {
        ary = [];
      }
      Array.prototype.push.apply(this, ary);
    }

    SuperArray.prototype.minBy = function(func) {
      var d, j, len1, min, ref, ref1, res, solution;
      min = 2e308;
      solution = null;
      ref = this;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        d = ref[j];
        res = func(d);
        if (min > res) {
          ref1 = [res, d], min = ref1[0], solution = ref1[1];
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
      var a, i, j, k, last, len1, len2, ref, ref1, res;
      if (!len) {
        return [[]];
      }
      res = [];
      ref = this;
      for (i = j = 0, len1 = ref.length; j < len1; i = ++j) {
        a = ref[i];
        ref1 = SuperArray.prototype.combinations.call(this.slice(i + 1), len - 1);
        for (k = 0, len2 = ref1.length; k < len2; k++) {
          last = ref1[k];
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
      name = arguments[0], arg = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (name == null) {
        name = 'change';
      }
      return eve.apply(null, [this._uuid + "." + name, this].concat(slice.call(arg)));
    };

    Model.prototype.listen = function(name, func) {
      if (name == null) {
        name = 'change';
      }
      if (arguments.length === 1) {
        func = name;
        name = 'change';
      }
      return eve.on(this._uuid + "." + name, func);
    };

    Model.prototype.unlisten = function(name, func) {
      if (name == null) {
        name = 'change';
      }
      if (arguments.length === 1) {
        func = name;
        name = 'change';
      }
      return eve.off(this._uuid + "." + name, func);
    };

    return Model;

  })();

  View = (function() {
    function View(model) {
      this.setModel(model);
    }

    View.prototype.setModel = function(model) {
      if (this._listener) {
        model.unlisten(this._listener);
      }
      this.model = model;
      this._listener = (function(_this) {
        return function() {
          return _this.render.apply(_this, arguments);
        };
      })(this);
      model.listen(this._listener);
      return this;
    };

    View.prototype.render = function() {};

    return View;

  })();

  Color = (function() {
    function Color(r1, g1, b3) {
      this.r = r1 != null ? r1 : 0;
      this.g = g1 != null ? g1 : 0;
      this.b = b3 != null ? b3 : 0;
    }

    Color.prototype.dist = function(color) {
      var db, dg, dr, ref;
      ref = [color.r - this.r, color.g - this.g, color.b - this.b], dr = ref[0], dg = ref[1], db = ref[2];
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

  Assoc = (function(superClass) {
    extend(Assoc, superClass);

    function Assoc(map) {
      this.map = map != null ? map : {};
      Assoc.__super__.constructor.apply(this, arguments);
    }

    Assoc.prototype.keys = function() {
      return Object.keys(this.map);
    };

    Assoc.prototype.get = function(name) {
      return this.map[name];
    };

    Assoc.prototype.set = function(name, value) {
      this.map[name] = value;
      return this.change('change', name, value);
    };

    return Assoc;

  })(Model);

  FormView = (function(superClass) {
    extend(FormView, superClass);

    function FormView(model, elem) {
      var input, j, len1, ref;
      this.elem = elem;
      FormView.__super__.constructor.apply(this, arguments);
      ref = HTMLElement.prototype.querySelectorAll.call(this.elem, '[name]');
      for (j = 0, len1 = ref.length; j < len1; j++) {
        input = ref[j];
        this._setValue(input);
      }
      HTMLElement.prototype.addEventListener.call(this.elem, 'change', (function(_this) {
        return function(e) {
          return _this._setValue(e.target);
        };
      })(this), false);
    }

    FormView.prototype._setValue = function(input) {
      var name, ref, value;
      name = input.name, value = input.value;
      if (!name) {
        return;
      }
      switch ((ref = input.getAttribute('type')) != null ? ref.toLowerCase() : void 0) {
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

    FormView.prototype.render = function() {
      var input, inputs, j, k, len1, len2, name, ref, value;
      ref = this.model.keys();
      for (j = 0, len1 = ref.length; j < len1; j++) {
        name = ref[j];
        inputs = HTMLFormElement.prototype.querySelectorAll.call(this.elem, "[name=" + name + "]");
        if (!inputs.length) {
          continue;
        }
        value = this.model.get(name);
        switch (inputs[0].type) {
          case 'checkbox':
            inputs[0].checked = value;
            break;
          case 'radio':
            value = value.toString();
            for (k = 0, len2 = inputs.length; k < len2; k++) {
              input = inputs[k];
              if (!(input.value === value)) {
                continue;
              }
              input.checked = true;
              break;
            }
            break;
          default:
            inputs[0].value = value;
        }
      }
    };

    return FormView;

  })(View);

  constants = {
    mosaic: {
      vshader: "attribute vec2 a_position;\nvarying vec2 v_texCoord;\n\nvoid main(){\n  v_texCoord = a_position / 2.0 + vec2(0.5);\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}",
      fshader: {
        noop: "precision mediump float;\nuniform sampler2D u_source;\nvarying vec2 v_texCoord;\n\nvoid main(){\n  gl_FragColor = texture2D(u_source, v_texCoord);\n}",
        reduceColorDithered: "precision mediump float;\nuniform sampler2D u_source;\nuniform sampler2D u_colors;\n\nuniform bool u_vivid;\nuniform float u_brightness;\nuniform float u_contrast;\n\nvarying vec2 v_texCoord;\n      \nconst int COMBINATIONS = 128;\nconst float GAMMA = 2.2;\n\nvec4 gamma(vec4 color){\n  return pow(color, vec4(GAMMA));\n}\nvec4 ungamma(vec4 color){\n  return pow(color, vec4(1.0 / GAMMA));\n}\n\nvoid getColors(in int idx, out vec4 c1, out vec4 c2){\n  float x = (0.5 + float(idx)) / float(COMBINATIONS);\n  c1 = gamma(texture2D(u_colors, vec2(x, 0.0)));\n  c2 = gamma(texture2D(u_colors, vec2(x, 2.0)));\n}\nfloat dist(vec4 srcColor, vec4 color){\n  float d = distance(srcColor, color);\n  if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.4);\n  return d;\n}\nfloat ditherIndex(){\n  float p = floor(mod(gl_FragCoord.x, 4.0));\n  float q = floor(mod(p - gl_FragCoord.y, 4.0));\n  return (\n    8.0 * mod(q, 2.0) +\n    4.0 * mod(p, 2.0) +\n    2.0 * floor(q / 2.0) +\n    floor(p / 2.0) +\n    0.5\n  ) / 16.0;\n}\nfloat calculateBestRatio(vec4 srcColor, vec4 c1, vec4 c2){\n  vec4 dif = c2 - c1;\n  return floor(\n    0.5 + dot(dif, srcColor - c1) / dot(dif, dif) * 16.0\n  ) / 16.0;\n}\nvec4 dither(vec4 srcColor){\n  vec4 c1, c2, canditate;\n  float ratio;\n  float d, minDist = 9.9;\n  float index = ditherIndex();\n  \n  for(int i = 0; i < COMBINATIONS; i++){\n    getColors(i, c1, c2);\n    ratio = calculateBestRatio(srcColor, c1, c2);\n    d =\n      dist(srcColor, mix(c1, c2, clamp(ratio, 0.0, 1.0))) +\n      distance(c1, c2) * 0.2;\n    if(minDist > d){\n      minDist = d;\n      if(index > ratio){\n        canditate = c1;\n      } else {\n        canditate = c2;\n      }\n    }\n  }\n  return canditate;\n}\n  \nfloat filterComponent(float color){\n  color = pow(color, exp(-u_brightness));\n  if(color < 0.5){\n    return 0.5 * pow(2.0 * color, exp(u_contrast));\n  } else {\n    return 0.5 * pow(2.0 * color - 1.0, exp(-u_contrast)) + 0.5;\n  }\n}\nvec4 getSourceColor(){\n  vec4 col = texture2D(u_source, v_texCoord);\n  return gamma(vec4(\n    filterComponent(col.r), filterComponent(col.g),\n    filterComponent(col.b), 1.0\n  ));\n}\nvoid main(){\n  gl_FragColor = ungamma(dither(getSourceColor()));\n}",
        reduceColor: "precision mediump float;\nuniform sampler2D u_source;\nuniform sampler2D u_colors;\n\nuniform bool u_vivid;\nuniform float u_brightness;\nuniform float u_contrast;\n\nvarying vec2 v_texCoord;\n\nconst int COLORLEN = 32;\nconst float GAMMA = 2.2;\n\nvec4 gamma(vec4 color){\n  return pow(color, vec4(GAMMA));\n}\nvec4 ungamma(vec4 color){\n  return pow(color, vec4(1.0 / GAMMA));\n}\n\nvec4 getColor(int idx){\n  float x = (0.5 + float(idx)) / float(COLORLEN);\n  return gamma(texture2D(u_colors, vec2(x, 0.5)));\n}\nfloat dist(vec4 srcColor, vec4 color){\n  float d = distance(srcColor, color);\n  if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.4);\n  return d;\n}\nvec4 nearest(vec4 srcColor){\n  vec4 col, minCol;\n  float d, mind = 9.9;\n  \n  for(int i = 0; i < COLORLEN; i++){\n    col = getColor(i);\n    d = dist(srcColor, col);\n    if(mind > d){\n      minCol = col;\n      mind = d;\n    }\n  }\n  return minCol;\n}\n  \nfloat filterComponent(float color){\n  color = pow(color, exp(-u_brightness));\n  if(color < 0.5){\n    return 0.5 * pow(2.0 * color, exp(u_contrast));\n  } else {\n    return 0.5 * pow(2.0 * color - 1.0, exp(-u_contrast)) + 0.5;\n  }\n}\nvec4 getSourceColor(){\n  vec4 col = texture2D(u_source, v_texCoord);\n  return gamma(vec4(\n    filterComponent(col.r), filterComponent(col.g),\n    filterComponent(col.b), 1.0\n  ));\n}\nvoid main(){\n  gl_FragColor = ungamma(nearest(getSourceColor()));\n}",
        blueprint: "precision mediump float;\nuniform sampler2D u_source;\nuniform vec2 u_unitSize;\nuniform vec2 u_domainSize;\nuniform float u_scale;\nuniform sampler2D u_colors;\n\nvarying vec2 v_texCoord;\n\nconst int COLORLEN = 32;\n\nbool checked(vec4 color){\n  float x;\n  for(int i = 0; i < COLORLEN; i++){\n    x = (0.5 + float(i)) / float(COLORLEN);\n    if(color == texture2D(u_colors, vec2(x, 0.5))) return true;\n  }\n  return false;\n}\nfloat luma(vec4 color){\n  return dot(vec3(0.3, 0.59, 0.11), color.rgb);\n}\nvec4 borderColor(vec4 color, float degree){\n  if(luma(color) < 0.5) return color + vec4(degree);\n  return color - vec4(vec3(degree), 0.0);\n}\nvoid main(){\n  vec2 pos = (gl_FragCoord.xy - vec2(0.5)) / u_scale;\n  vec2 unitCoord = mod(pos, u_unitSize);\n  vec2 domainCoord = mod(pos, u_unitSize * u_domainSize);\n  vec4 color = texture2D(u_source, v_texCoord);\n  \n  if(any(equal(domainCoord, vec2(0.0)))){\n    gl_FragColor = borderColor(color, 1.0);\n  } else if(unitCoord.x == unitCoord.y && checked(color) ||\n      any(equal(unitCoord, vec2(0.0)))){\n    gl_FragColor = borderColor(color, 0.3);\n  } else {\n    gl_FragColor = color;\n  }\n}"
      },
      colors: (function() {
        var b, checked, cls, g, id, j, len1, name, r, ref, results, use;
        cls = [[11, 'Black', 33, 33, 33, true], [10, 'Dark Gray', 107, 90, 90, true], [9, 'Light Gray', 156, 156, 156, true], [49, 'Very Light Gray', 232, 232, 232, true, true], [1, 'White', 255, 255, 255, true], [85, 'Dark Bluish Gray', 89, 93, 96], [86, 'Light Bluish Gray', 175, 181, 199], [7, 'Blue', 0, 87, 166], [5, 'Red', 179, 0, 6], [3, 'Yellow', 247, 209, 23], [6, 'Green', 0, 100, 46], [2, 'Tan', 222, 198, 156], [88, 'Reddish Brown', 137, 53, 29], [63, 'Dark Blue', 20, 48, 68], [104, 'Bright Pink', 243, 154, 194], [8, 'Brown', 83, 33, 21], [89, 'Dark Purple', 95, 38, 131], [59, 'Dark Red', 106, 14, 21], [69, 'Dark Tan', 144, 116, 80], [39, 'Dark Turquoise', 0, 138, 128], [34, 'Lime', 166, 202, 85], [72, 'Maersk Blue', 107, 173, 214], [42, 'Medium Blue', 97, 175, 255], [157, 'Medium Lavender', 181, 165, 213], [31, 'Medium Orange', 255, 165, 49], [4, 'Orange', 255, 126, 20], [23, 'Pink', 255, 199, 225], [24, 'Purple', 165, 73, 156], [55, 'Sand Blue', 90, 113, 132], [48, 'Sand Green', 118, 162, 144]];
        results = [];
        for (j = 0, len1 = cls.length; j < len1; j++) {
          ref = cls[j], id = ref[0], name = ref[1], r = ref[2], g = ref[3], b = ref[4], use = ref[5], checked = ref[6];
          results.push({
            id: id,
            name: name,
            color: new Color(r, g, b),
            use: use,
            checked: checked
          });
        }
        return results;
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
    },
    optimizer: {
      dataurl: '/data/',
      appurl: '/optimizer/app'
    }
  };

  colorsToCanvas = (function() {
    var ctx;
    ctx = document.createElement('canvas').getContext('2d');
    return function(ary) {
      var color, height, idata, inner, j, k, len1, len2, ref, width, x, y;
      if (arguments.length === 3) {
        width = arguments[0], height = arguments[1], ary = arguments[2];
      } else {
        ref = [ary.length, ary[0].length], width = ref[0], height = ref[1];
      }
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      idata = ctx.createImageData(width, height);
      for (x = j = 0, len1 = ary.length; j < len1; x = ++j) {
        inner = ary[x];
        if (!('length' in inner)) {
          inner = [inner];
        }
        for (y = k = 0, len2 = inner.length; k < len2; y = ++k) {
          color = inner[y];
          idata.data.set([color.r, color.g, color.b, 255], (x + y * width) << 2);
        }
      }
      ctx.putImageData(idata, 0, 0);
      return ctx.canvas;
    };
  })();

  ImageProcessorOption = (function(superClass) {
    extend(ImageProcessorOption, superClass);

    function ImageProcessorOption() {
      return ImageProcessorOption.__super__.constructor.apply(this, arguments);
    }

    ImageProcessorOption.prototype.init = function(proc1) {
      this.proc = proc1;
    };

    ImageProcessorOption.prototype.set = function(name, value) {
      var ref, ref1;
      this.map[name] = value;
      if (name === 'mode') {
        ref = ((function() {
          switch (value) {
            case 'stack-plate':
              return [[5, 2], [4, 6]];
            case 'stack-brick':
              return [[5, 6], [4, 4]];
            case 'lay':
              return [[5, 5], [4, 4]];
          }
        })()), this.map.unitSize = ref[0], this.map.domainSize = ref[1];
      }
      if (name === 'mode' || name === 'width') {
        this.map.height = this.map.width * this.map.unitSize[0] / this.map.unitSize[1];
      }
      this.change();
      return (ref1 = this.proc) != null ? ref1.render() : void 0;
    };

    ImageProcessorOption.prototype.get = function(name) {
      var ref, ref1, ref2, ref3;
      switch (name) {
        case 'unitWidth':
          return (ref = this.map.unitSize) != null ? ref[0] : void 0;
        case 'unitHeight':
          return (ref1 = this.map.unitSize) != null ? ref1[1] : void 0;
        case 'domainWidth':
          return (ref2 = this.map.domainSize) != null ? ref2[0] : void 0;
        case 'domainHeight':
          return (ref3 = this.map.domainSize) != null ? ref3[1] : void 0;
        default:
          return this.map[name];
      }
    };

    return ImageProcessorOption;

  })(Assoc);

  ImageProcessor = (function(superClass) {
    extend(ImageProcessor, superClass);

    ImageProcessor.prototype.program = {};

    ImageProcessor.prototype.vshader = constants.mosaic.vshader;

    ImageProcessor.prototype.fshader = constants.mosaic.fshader;

    function ImageProcessor(option1, palette1) {
      var j, len1, name, ref;
      this.option = option1;
      this.palette = palette1;
      ImageProcessor.__super__.constructor.apply(this, arguments);
      this._gl = new MicroGL({
        antialias: false
      });
      ref = Object.keys(this.fshader);
      for (j = 0, len1 = ref.length; j < len1; j++) {
        name = ref[j];
        this.program[name] = this._gl.makeProgram(this.vshader, this.fshader[name]);
      }
      this.colorReduced = document.createElement('canvas').getContext('2d');
      this._img = document.createElement('img');
    }

    ImageProcessor.prototype._renderGL = function(width, height, program, source, u_colors) {
      var j, len1, name, ref, tex, vars;
      vars = {
        u_colors: u_colors
      };
      ref = this.option.keys();
      for (j = 0, len1 = ref.length; j < len1; j++) {
        name = ref[j];
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
        var j, len1, ref, results;
        ref = this.palette.colors;
        results = [];
        for (j = 0, len1 = ref.length; j < len1; j++) {
          c = ref[j];
          if (c.use) {
            results.push(c.color);
          }
        }
        return results;
      }).call(this);
      if (this.option.get('dither')) {
        program = this.program.reduceColorDithered;
        colors = colorCanv = colorsToCanvas(128, 2, SuperArray.prototype.combinations.call(colors.sort(function(a, b) {
          return a.luma() - b.luma();
        }), 2).sort(function(arg1, arg2) {
          var a1, a2, b1, b2;
          a1 = arg1[0], a2 = arg1[1];
          b1 = arg2[0], b2 = arg2[1];
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
      var amounts, c, color, data, i, j, k, len1, ref, ref1;
      data = this.colorReduced.getImageData(0, 0, this.width, this.height).data;
      amounts = {};
      for (i = j = 0, ref = data.length; j < ref; i = j += 4) {
        color = (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return Object(result) === result ? result : child;
        })(Color, data.subarray(i, i + 3), function(){});
        amounts[color] || (amounts[color] = 0);
        amounts[color]++;
      }
      ref1 = this.palette.colors;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        c = ref1[k];
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
        var j, len1, ref, results;
        ref = this.palette.colors;
        results = [];
        for (j = 0, len1 = ref.length; j < len1; j++) {
          c = ref[j];
          if (c.checked) {
            results.push([c.color]);
          }
        }
        return results;
      }).call(this)));
    };

    return ImageProcessor;

  })(Model);

  Palette = (function(superClass) {
    extend(Palette, superClass);

    function Palette(colors1) {
      var c, i, j, len1, ref;
      this.colors = colors1 != null ? colors1 : [];
      this._idx = {};
      ref = this.colors;
      for (i = j = 0, len1 = ref.length; j < len1; i = ++j) {
        c = ref[i];
        this._idx[c.name] = i;
      }
    }

    Palette.prototype.init = function(proc1) {
      this.proc = proc1;
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

  PaletteView = (function(superClass) {
    extend(PaletteView, superClass);

    function PaletteView(model, elem) {
      var c, frag, j, len1, li, ref;
      this.elem = elem;
      PaletteView.__super__.constructor.apply(this, arguments);
      frag = document.createDocumentFragment();
      ref = model.colors;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        c = ref[j];
        li = document.createElement('li');
        li.style.backgroundColor = c.color;
        li.dataset.name = c.name;
        frag.appendChild(li);
      }
      this.elem.appendChild(frag);
      this.elem.addEventListener('click', function(e) {
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
      var classes, color, j, len1, li, ref, results;
      ref = this.elem.childNodes;
      results = [];
      for (j = 0, len1 = ref.length; j < len1; j++) {
        li = ref[j];
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
        results.push(li.className = classes.join(' '));
      }
      return results;
    };

    return PaletteView;

  })(View);

  PartsAmountView = (function(superClass) {
    extend(PartsAmountView, superClass);

    function PartsAmountView(model, elem) {
      this.elem = elem;
      PartsAmountView.__super__.constructor.apply(this, arguments);
      this.render();
    }

    PartsAmountView.prototype._createLi = function(arg1) {
      var amount, color, colorBox, li, name;
      name = arg1.name, color = arg1.color, amount = arg1.amount;
      colorBox = document.createElement('span');
      colorBox.className = 'color-box';
      colorBox.style.backgroundColor = color;
      li = document.createElement('li');
      li.appendChild(colorBox);
      li.appendChild(document.createTextNode("(" + amount + "x) " + name));
      return li;
    };

    PartsAmountView.prototype.render = function() {
      var c, frag, j, len1, ref;
      this.elem.innerHTML = '';
      frag = document.createDocumentFragment();
      ref = this.model.colors;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        c = ref[j];
        if (c.amount) {
          frag.appendChild(this._createLi(c));
        }
      }
      return this.elem.appendChild(frag);
    };

    return PartsAmountView;

  })(View);

  RendererView = (function(superClass) {
    extend(RendererView, superClass);

    RendererView.prototype.rendered = false;

    function RendererView(model, elem) {
      this.elem = elem;
      RendererView.__super__.constructor.apply(this, arguments);
      this._ctx = this.elem.getContext('2d');
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
      var a;
      if (!this.rendered) {
        return;
      }
      a = document.createElement('a');
      a.href = this.model.getBlueprint().toDataURL('image/png');
      a.setAttribute('download', 'image.png');
      document.body.appendChild(a);
      a.click();
      return document.body.removeChild(a);
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
      var ref, ref1;
      cancelEvent(e);
      return view.show((ref = e.dataTransfer) != null ? (ref1 = ref.files) != null ? ref1[0] : void 0 : void 0);
    }, false);
    $('file-upload').addEventListener('change', function(e) {
      var ref;
      return view.show((ref = e.target.files) != null ? ref[0] : void 0);
    }, false);
    $('render-button').addEventListener('click', function() {
      return view.showBlueprint();
    }, false);
    return $('optimizer-button').addEventListener('click', function() {
      var color, pid, url;
      pid = ~option.get('mode').indexOf('brick') ? 3005 : 3024;
      url = '/optimizer?o=' + ((function() {
        var j, len1, ref, results;
        ref = palette.colors;
        results = [];
        for (j = 0, len1 = ref.length; j < len1; j++) {
          color = ref[j];
          if (color.amount > 0) {
            results.push(pid + "," + color.id + "," + color.amount);
          }
        }
        return results;
      })()).join('|');
      return window.open(url);
    }, false);
  };

  document.addEventListener('DOMContentLoaded', main, false);

}).call(this);
