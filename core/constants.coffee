constants =
  mosaic:
    vshader: """
      attribute vec2 a_position;
      varying vec2 v_texCoord;

      void main(){
        v_texCoord = a_position / 2.0 + vec2(0.5);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    """
    fshader:
      noop: """
        precision mediump float;
        uniform sampler2D u_source;
        varying vec2 v_texCoord;

        void main(){
          gl_FragColor = texture2D(u_source, v_texCoord);
        }
      """
      reduceColorDithered: """
        precision mediump float;
        uniform sampler2D u_source;
        uniform sampler2D u_colors;

        uniform bool u_vivid;
        uniform float u_brightness;
        uniform float u_contrast;

        varying vec2 v_texCoord;
      
        const int COMBINATIONS = 128;
        const float GAMMA = 2.2;

        vec4 gamma(vec4 color){
          return pow(color, vec4(GAMMA));
        }
        vec4 ungamma(vec4 color){
          return pow(color, vec4(1.0 / GAMMA));
        }
        
        void getColors(in int idx, out vec4 c1, out vec4 c2){
          float x = (0.5 + float(idx)) / float(COMBINATIONS);
          c1 = gamma(texture2D(u_colors, vec2(x, 0.0)));
          c2 = gamma(texture2D(u_colors, vec2(x, 2.0)));
        }
        float dist(vec4 srcColor, vec4 color){
          float d = distance(srcColor, color);
          if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.4);
          return d;
        }
        float ditherIndex(){
          float p = floor(mod(gl_FragCoord.x, 4.0));
          float q = floor(mod(p - gl_FragCoord.y, 4.0));
          return (
            8.0 * mod(q, 2.0) +
            4.0 * mod(p, 2.0) +
            2.0 * floor(q / 2.0) +
            floor(p / 2.0) +
            0.5
          ) / 16.0;
        }
        float calculateBestRatio(vec4 srcColor, vec4 c1, vec4 c2){
          vec4 dif = c2 - c1;
          return floor(
            0.5 + dot(dif, srcColor - c1) / dot(dif, dif) * 16.0
          ) / 16.0;
        }
        vec4 dither(vec4 srcColor){
          vec4 c1, c2, canditate;
          float ratio;
          float d, minDist = 9.9;
          float index = ditherIndex();
          
          for(int i = 0; i < COMBINATIONS; i++){
            getColors(i, c1, c2);
            ratio = calculateBestRatio(srcColor, c1, c2);
            d =
              dist(srcColor, mix(c1, c2, clamp(ratio, 0.0, 1.0))) +
              distance(c1, c2) * 0.2;
            if(minDist > d){
              minDist = d;
              if(index > ratio){
                canditate = c1;
              } else {
                canditate = c2;
              }
            }
          }
          return canditate;
        }
          
        float filterComponent(float color){
          color = pow(color, exp(-u_brightness));
          if(color < 0.5){
            return 0.5 * pow(2.0 * color, exp(u_contrast));
          } else {
            return 0.5 * pow(2.0 * color - 1.0, exp(-u_contrast)) + 0.5;
          }
        }
        vec4 getSourceColor(){
          vec4 col = texture2D(u_source, v_texCoord);
          return gamma(vec4(
            filterComponent(col.r), filterComponent(col.g),
            filterComponent(col.b), 1.0
          ));
        }
        void main(){
          gl_FragColor = ungamma(dither(getSourceColor()));
        }
      """
      reduceColor: """
        precision mediump float;
        uniform sampler2D u_source;
        uniform sampler2D u_colors;

        uniform bool u_vivid;
        uniform float u_brightness;
        uniform float u_contrast;

        varying vec2 v_texCoord;
        
        const int COLORLEN = 32;
        const float GAMMA = 2.2;

        vec4 gamma(vec4 color){
          return pow(color, vec4(GAMMA));
        }
        vec4 ungamma(vec4 color){
          return pow(color, vec4(1.0 / GAMMA));
        }
        
        vec4 getColor(int idx){
          float x = (0.5 + float(idx)) / float(COLORLEN);
          return gamma(texture2D(u_colors, vec2(x, 0.5)));
        }
        float dist(vec4 srcColor, vec4 color){
          float d = distance(srcColor, color);
          if(u_vivid) d /= (distance(vec3(0.5), color.rgb) + 0.4);
          return d;
        }
        vec4 nearest(vec4 srcColor){
          vec4 col, minCol;
          float d, mind = 9.9;
          
          for(int i = 0; i < COLORLEN; i++){
            col = getColor(i);
            d = dist(srcColor, col);
            if(mind > d){
              minCol = col;
              mind = d;
            }
          }
          return minCol;
        }
          
        float filterComponent(float color){
          color = pow(color, exp(-u_brightness));
          if(color < 0.5){
            return 0.5 * pow(2.0 * color, exp(u_contrast));
          } else {
            return 0.5 * pow(2.0 * color - 1.0, exp(-u_contrast)) + 0.5;
          }
        }
        vec4 getSourceColor(){
          vec4 col = texture2D(u_source, v_texCoord);
          return gamma(vec4(
            filterComponent(col.r), filterComponent(col.g),
            filterComponent(col.b), 1.0
          ));
        }
        void main(){
          gl_FragColor = ungamma(nearest(getSourceColor()));
        }
      """
      blueprint: """
        precision mediump float;
        uniform sampler2D u_source;
        uniform vec2 u_unitSize;
        uniform vec2 u_domainSize;
        uniform float u_scale;
        uniform sampler2D u_colors;

        varying vec2 v_texCoord;
        
        const int COLORLEN = 32;

        bool checked(vec4 color){
          float x;
          for(int i = 0; i < COLORLEN; i++){
            x = (0.5 + float(i)) / float(COLORLEN);
            if(color == texture2D(u_colors, vec2(x, 0.5))) return true;
          }
          return false;
        }
        float luma(vec4 color){
          return dot(vec3(0.3, 0.59, 0.11), color.rgb);
        }
        vec4 borderColor(vec4 color, float degree){
          if(luma(color) < 0.5) return color + vec4(degree);
          return color - vec4(vec3(degree), 0.0);
        }
        void main(){
          vec2 pos = (gl_FragCoord.xy - vec2(0.5)) / u_scale;
          vec2 unitCoord = mod(pos, u_unitSize);
          vec2 domainCoord = mod(pos, u_unitSize * u_domainSize);
          vec4 color = texture2D(u_source, v_texCoord);
          
          if(any(equal(domainCoord, vec2(0.0)))){
            gl_FragColor = borderColor(color, 1.0);
          } else if(unitCoord.x == unitCoord.y && checked(color) ||
              any(equal(unitCoord, vec2(0.0)))){
            gl_FragColor = borderColor(color, 0.3);
          } else {
            gl_FragColor = color;
          }
        }
      """

    colors: do ->
      cls = [
        ['Black',              33,  33,  33, true]
        ['Dark Gray',         107,  90,  90, true]
        ['Light Gray',        156, 156, 156, true]
        ['Very Light Gray',   232, 232, 232, true, true]
        ['White',             255, 255, 255, true]
        ['Dark Bluish Gray',   89,  93,  96]
        ['Light Bluish Gray', 175, 181, 199]
        ['Blue',                0,  87, 166]
        ['Red',               179,   0,   6]
        ['Yellow',            247, 209,  23]
        ['Green',               0, 100,  46]
        ['Tan',               222, 198, 156]
        ['Reddish Brown',     137,  53,  29]
        ['Dark Blue',          20,  48,  68]
        ['Bright Pink',       243, 154, 194]
        ['Brown',              83,  33,  21]
        ['Dark Purple',        95,  38, 131]
        ['Dark Red',          106,  14,  21]
        ['Dark Tan',          144, 116,  80]
        ['Dark Turquoise',      0, 138, 128]
        ['Lime',              166, 202,  85]
        ['Maersk Blue',       107, 173, 214]
        ['Medium Blue',        97, 175, 255]
        ['Medium Lavender',   181, 165, 213]
        ['Medium Orange',     255, 165,  49]
        ['Orange',            255, 126,  20]
        ['Pink',              255, 199, 225]
        ['Purple',            165,  73, 156]
        ['Sand Blue',          90, 113, 132]
        ['Sand Green',        118, 162, 144]
      ]
      for [name, r, g, b, use, checked] in cls
        { name, color: new Color(r, g, b), use, checked }

    option: 
      width: 48
      height: 120
      mode: 'stack-plate'
      unitSize: [5, 2]
      domainSize: [4, 6]
      dither: false
      vivid: false
      brightness: 0
      contrast: 0
      scale: 4


  optimizer:
    appurl: '/optimizer/app'
    