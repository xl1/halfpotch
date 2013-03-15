// Generated by CoffeeScript 1.6.1
(function() {
  var $, Color, ImageProcessor, Model, Palette, PaletteView, SuperArray, View, cancelEvent, colorsToCanvas, main, uuid,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
      return eve("" + this._uuid + ".change");
    };

    return Model;

  })();

  View = (function() {

    function View(model) {
      this.model = model;
      eve.on("" + this.model._uuid + ".change", this.render.bind(this));
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
        for (y = _j = 0, _len1 = inner.length; _j < _len1; y = ++_j) {
          color = inner[y];
          idata.data.set([color.r, color.g, color.b, 255], (x + y * width) << 2);
        }
      }
      ctx.putImageData(idata, 0, 0);
      return ctx.canvas;
    };
  })();

  ImageProcessor = (function() {

    ImageProcessor.prototype.width = 48;

    ImageProcessor.prototype.unitWidth = 5;

    ImageProcessor.prototype.unitHeight = 2;

    ImageProcessor.prototype.dither = false;

    ImageProcessor.prototype.vivid = false;

    ImageProcessor.prototype.brightness = 0;

    ImageProcessor.prototype.contrast = 0;

    ImageProcessor.prototype.colors = [];

    ImageProcessor.prototype.colorReduced = null;

    ImageProcessor.prototype.shader = {
      vertex: "attribute vec2 a_position;\nvarying vec2 v_texCoord;\n\nvoid main(){\n  v_texCoord = a_position / 2.0 + vec2(0.5);\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}",
      noop: "precision mediump float;\nuniform sampler2D u_source;\nuniform vec2 u_sourceSize;\nvarying vec2 v_texCoord;\n\nvoid main(){\n  gl_FragColor = texture2D(u_source, v_texCoord);\n}",
      reduceColorDithered: "  precision mediump float;\n  uniform sampler2D u_source;\n  uniform sampler2D u_colors;\n\n  uniform bool u_vivid;\n  uniform float u_brightness;\n  uniform float u_contrast;\n\n  varying vec2 v_texCoord;\n\n  const int COMBINATIONS = 128;\n  \n  void getColors(in int idx, out vec4 c1, out vec4 c2){\n    float x = (0.5 + float(idx)) / float(COMBINATIONS);\n    c1 = texture2D(u_colors, vec2(x, 0.0));\n    c2 = texture2D(u_colors, vec2(x, 2.0));\n  }\n  float dist(vec4 srcColor, vec4 color){\n    float d = distance(srcColor, color);\n    if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.3);\n    return d;\n  }\n  float ditherIndex(){\n    float p = floor(mod(gl_FragCoord.x, 4.0));\n    float q = floor(mod(p - gl_FragCoord.y, 4.0));\n    return (\n      8.0 * mod(q, 2.0) +\n      4.0 * mod(p, 2.0) +\n      2.0 * floor(q / 2.0) +\n      floor(p / 2.0) +\n      0.5\n    ) / 16.0;\n  }\n  float calculateBestRatio(vec4 srcColor, vec4 c1, vec4 c2){\n    vec4 dif = c2 - c1;\n    return floor(\n      0.5 + dot(dif, srcColor - c1) / dot(dif, dif) * 16.0\n    ) / 16.0;\n  }\n  vec4 dither(vec4 srcColor){\n    vec4 c1, c2, canditate;\n    float ratio;\n    float d, minDist = 9.9;\n    float index = ditherIndex();\n    \n    for(int i = 0; i < COMBINATIONS; i++){\n      getColors(i, c1, c2);\n      ratio = calculateBestRatio(srcColor, c1, c2);\n      d =\n        dist(srcColor, mix(c1, c2, clamp(ratio, 0.0, 1.0))) +\n        distance(c1, c2) / 4.0;\n      if(minDist > d){\n        minDist = d;\n        if(index > ratio){\n          canditate = c1;\n        } else {\n          canditate = c2;\n        }\n      }\n    }\n    return canditate;\n  }\n    \n  float filterComponent(float color){\n    color = pow(color, u_brightness);\n    if(color < 0.5){\n      return 0.5 * pow(2.0 * color, 1.0 / u_contrast);\n    } else {\n      return 0.5 * pow(2.0 * color - 1.0, u_contrast) + 0.5;\n    }\n  }\n  vec4 getSourceColor(){\n    vec4 col = texture2D(u_source, v_texCoord);\n    return vec4(\n      filterComponent(col.r), filterComponent(col.g),\n      filterComponent(col.b), 1.0\n    );\n  }\n  void main(){\n    gl_FragColor = dither(getSourceColor());\n  }",
      reduceColor: "precision mediump float;\nuniform sampler2D u_source;\nuniform sampler2D u_colors;\n\nuniform bool u_vivid;\nuniform float u_brightness;\nuniform float u_contrast;\n\nvarying vec2 v_texCoord;\n\nconst int COLORLEN = 32;\n\nvec4 getColor(int idx){\n  float x = (0.5 + float(idx)) / float(COLORLEN);\n  return texture2D(u_colors, vec2(x, 0.5));\n}\nfloat dist(vec4 srcColor, vec4 color){\n  float d = distance(srcColor, color);\n  if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.3);\n  return d;\n}\nvec4 nearest(vec4 srcColor){\n  vec4 col, minCol;\n  float d, mind = 9.9;\n  \n  for(int i = 0; i < COLORLEN; i++){\n    col = getColor(i);\n    d = dist(srcColor, col);\n    if(mind > d){\n      minCol = col;\n      mind = d;\n    }\n  }\n  return minCol;\n}\n  \nfloat filterComponent(float color){\n  color = pow(color, u_brightness);\n  if(color < 0.5){\n    return 0.5 * pow(2.0 * color, 1.0 / u_contrast);\n  } else {\n    return 0.5 * pow(2.0 * color - 1.0, u_contrast) + 0.5;\n  }\n}\nvec4 getSourceColor(){\n  vec4 col = texture2D(u_source, v_texCoord);\n  return vec4(\n    filterComponent(col.r), filterComponent(col.g),\n    filterComponent(col.b), 1.0\n  );\n}\nvoid main(){\n  gl_FragColor = nearest(getSourceColor());\n}",
      blueprint: "precision mediump float;\nuniform sampler2D u_source;\nuniform vec2 u_unitSize;\nuniform vec2 u_bigUnitSize;\nuniform float u_scale;\nuniform sampler2D u_colors;\n\nvarying vec2 v_texCoord;\n\nconst int COLORLEN = 32;\n\nbool checked(vec4 color){\n  float x;\n  for(int i = 0; i < COLORLEN; i++){\n    x = (0.5 + float(i)) / float(COLORLEN);\n    if(color == texture2D(u_colors, vec2(x, 0.5))) return true;\n  }\n  return false;\n}\nfloat luma(vec4 color){\n  return dot(vec3(0.3, 0.59, 0.11), color.rgb);\n}\nvec4 borderColor(vec4 color, float degree){\n  if(luma(color) < 0.5) return color + vec4(degree);\n  return color - vec4(vec3(degree), 0.0);\n}\nvoid main(){\n  vec2 pos = (gl_FragCoord.xy - vec2(0.5)) / u_scale;\n  vec2 localCoord = mod(pos, u_unitSize);\n  vec2 domainCoord = mod(pos, u_unitSize * u_bigUnitSize);\n  vec4 color = texture2D(u_source, v_texCoord);\n  \n  if(any(equal(domainCoord, vec2(0.0)))){\n    gl_FragColor = borderColor(color, 1.0);\n  } else if(localCoord.x == localCoord.y && checked(color) ||\n      any(equal(localCoord, vec2(0.0)))){\n    gl_FragColor = borderColor(color, 0.3);\n  } else {\n    gl_FragColor = color;\n  }\n}"
    };

    function ImageProcessor() {
      this._img = document.createElement('img');
      this._gl = new MicroGL({
        antialias: false
      });
    }

    ImageProcessor.prototype._renderGL = function(width, height, fshader, source, variables) {
      var tex;
      if (variables == null) {
        variables = {};
      }
      tex = this._gl.texture(source);
      return this._gl.texParameter(tex, {
        filter: 'NEAREST'
      }).init(null, width, height).program(this.shader.vertex, fshader).bindVars({
        a_position: [-1, -1, -1, 1, 1, -1, 1, 1],
        u_source: tex
      }).bindVars(variables).draw().gl.canvas;
    };

    ImageProcessor.prototype._reduceColor = function() {
      var c, canv, colorCanv, shader;
      if (this.dither) {
        shader = this.shader.reduceColorDithered;
        colorCanv = colorsToCanvas(128, 2, SuperArray.prototype.combinations.call((function() {
          var _i, _len, _ref, _results;
          _ref = this.colors;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            c = _ref[_i];
            if (c.use) {
              _results.push(c.color);
            }
          }
          return _results;
        }).call(this), 2).sort(function(_arg, _arg1) {
          var a1, a2, b1, b2;
          a1 = _arg[0], a2 = _arg[1];
          b1 = _arg1[0], b2 = _arg1[1];
          return a1.dist(a2) - b1.dist(b2);
        }).slice(0, 128));
      } else {
        shader = this.shader.reduceColor;
        colorCanv = colorsToCanvas(32, 1, (function() {
          var _i, _len, _ref, _results;
          _ref = this.colors;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            c = _ref[_i];
            if (c.use) {
              _results.push([c.color]);
            }
          }
          return _results;
        }).call(this));
      }
      canv = document.createElement('canvas');
      this.colorReduced = canv.getContext('2d');
      canv.width = this.width;
      canv.height = this.height = this.width * this.unitWidth / this.unitHeight * this._img.height / this._img.width | 0;
      return this.colorReduced.drawImage(this._renderGL(this.width, this.height, shader, this._img, {
        u_colors: colorCanv,
        u_vivid: this.vivid,
        u_brightness: Math.exp(-this.brightness),
        u_contrast: Math.exp(-this.contrast)
      }), 0, 0);
    };

    ImageProcessor.prototype.render = function(source, callback) {
      var _this = this;
      if (source) {
        this._img.onload = function() {
          _this._reduceColor();
          return typeof callback === "function" ? callback() : void 0;
        };
        return this._img.src = source;
      } else {
        this._reduceColor();
        return typeof callback === "function" ? callback() : void 0;
      }
    };

    ImageProcessor.prototype.getThumbnail = function() {
      return this._renderGL(this.width * this.unitWidth, this.height * this.unitHeight, this.shader.noop, this.colorReduced.canvas);
    };

    ImageProcessor.prototype.getBlueprint = function() {
      var c, check;
      check = colorsToCanvas(32, 1, (function() {
        var _i, _len, _ref, _results;
        _ref = this.colors;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          if (c.checked) {
            _results.push([c.color]);
          }
        }
        return _results;
      }).call(this));
      return this._renderGL(this.width * this.unitWidth * 4, this.height * this.unitHeight * 4, this.shader.blueprint, this.colorReduced.canvas, {
        u_scale: 4,
        u_unitSize: [this.unitWidth, this.unitHeight],
        u_bigUnitSize: [4, 7 - this.unitHeight / 2 | 0],
        u_colors: check
      });
    };

    return ImageProcessor;

  })();

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

    Palette.prototype.color = function(name) {
      return this.colors[this._idx[name]];
    };

    Palette.prototype.use = function(name) {
      this.color(name).use = true;
      return this.change();
    };

    Palette.prototype.unuse = function(name) {
      var color;
      color = this.color(name);
      color.use = color.checked = false;
      return this.change();
    };

    Palette.prototype.check = function(name) {
      this.color(name).checked = true;
      return this.change();
    };

    Palette.prototype.uncheck = function(name) {
      this.color(name).checked = false;
      return this.change();
    };

    Palette.prototype.resetAmount = function() {
      var color, _i, _len, _ref, _results;
      _ref = this.colors;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        color = _ref[_i];
        _results.push(color.amount = 0);
      }
      return _results;
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
      var c, frag, li, _i, _len, _ref,
        _this = this;
      this.elem = elem;
      PaletteView.__super__.constructor.call(this, model);
      frag = document.createDocumentFragment();
      _ref = this.model.colors;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        li = document.createElement('li');
        li.style.backgroundColor = c.color.toString();
        li.dataset.name = c.name;
        frag.appendChild(li);
      }
      this.elem.appendChild(frag);
      this.elem.addEventListener('click', function(e) {
        var color, name;
        name = e.target.dataset.name;
        color = _this.model.color(name);
        if (!color) {
          return;
        }
        if (color.checked) {
          return _this.model.unuse(name);
        } else if (color.use) {
          return _this.model.check(name);
        } else {
          return _this.model.use(name);
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
          classes.push('color-checked');
        }
        _results.push(li.className = classes.join(' '));
      }
      return _results;
    };

    return PaletteView;

  })(View);

  cancelEvent = function(e) {
    e.stopPropagation();
    return e.preventDefault();
  };

  main = function() {
    var b, checked, colors, ctx, g, name, palette, proc, r, render, rendered, use;
    colors = [['Black', 33, 33, 33, true], ['Dark Gray', 107, 90, 90, true], ['Light Gray', 156, 156, 156, true], ['Very Light Gray', 232, 232, 232, true, true], ['White', 255, 255, 255, true], ['Dark Bluish Gray', 89, 93, 96], ['Light Bluish Gray', 175, 181, 199], ['Blue', 0, 87, 166], ['Red', 179, 0, 6], ['Yellow', 247, 209, 23], ['Green', 0, 100, 46], ['Tan', 222, 198, 156], ['Reddish Brown', 137, 53, 29], ['Dark Blue', 20, 48, 68], ['Bright Pink', 243, 154, 194], ['Brown', 83, 33, 21], ['Dark Purple', 95, 38, 131], ['Dark Red', 106, 14, 21], ['Dark Tan', 144, 116, 80], ['Dark Turquoise', 0, 138, 128], ['Lime', 166, 202, 85], ['Maersk Blue', 107, 173, 214], ['Medium Blue', 97, 175, 255], ['Medium Lavender', 181, 165, 213], ['Medium Orange', 255, 165, 49], ['Orange', 255, 126, 20], ['Pink', 255, 199, 225], ['Purple', 165, 73, 156], ['Sand Blue', 90, 113, 132], ['Sand Green', 118, 162, 144]];
    palette = new Palette((function() {
      var _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = colors.length; _i < _len; _i++) {
        _ref = colors[_i], name = _ref[0], r = _ref[1], g = _ref[2], b = _ref[3], use = _ref[4], checked = _ref[5];
        _results.push({
          name: name,
          color: new Color(r, g, b),
          use: use,
          checked: checked
        });
      }
      return _results;
    })());
    new PaletteView(palette, $('palette'));
    ctx = $('canv').getContext('2d');
    proc = new ImageProcessor();
    proc.colors = palette.colors;
    rendered = false;
    render = function(file) {
      var url;
      if (file) {
        if (!~file.type.indexOf('image')) {
          return;
        }
        url = window.URL.createObjectURL(file);
      } else if (!rendered) {
        return;
      }
      return proc.render(url, function() {
        var thumb;
        thumb = proc.getThumbnail();
        ctx.canvas.width = thumb.width;
        ctx.canvas.height = thumb.height;
        ctx.drawImage(thumb, 0, 0);
        return rendered = true;
      });
    };
    document.body.addEventListener('dragenter', cancelEvent, false);
    document.body.addEventListener('dragover', cancelEvent, false);
    document.body.addEventListener('drop', function(e) {
      var _ref, _ref1;
      cancelEvent(e);
      return render((_ref = e.dataTransfer) != null ? (_ref1 = _ref.files) != null ? _ref1[0] : void 0 : void 0);
    }, false);
    $('form').addEventListener('change', function(e) {
      var target;
      target = e.target;
      if (target.tagName.toUpperCase() === 'INPUT') {
        proc[target.name] = target.type === 'checkbox' ? target.checked : +target.value;
        return render();
      }
    }, false);
    $('render-button').addEventListener('click', function() {
      if (rendered) {
        return window.open(proc.getBlueprint().toDataURL('image/png'));
      }
    }, false);
    return eve.on("" + palette._uuid + ".change", render);
  };

  document.addEventListener('DOMContentLoaded', main, false);

}).call(this);
