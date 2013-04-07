{ IF, ELSE } = Retention

xhrget = (url, param) ->
  if param
    url += '?' + ("#{k}=#{param[k]}" for k in Object.keys(param)).join('&')
  r = new Retention()
  xhr = new XMLHttpRequest()
  xhr.open 'GET', url, true
  xhr.onload = -> r.resolve xhr.responseText
  xhr.onerror = -> r.reject xhr.statusText
  xhr.send()
  r

class DataLoader
  source = ['test/3.txt', 'test/5.txt', 'test/0.txt']
  load: (callback, errorCallback) ->
    colors = {}
    colorNames = {}
    parts = {}
    categories = {}

    colorsData = @get source[0]
    codesData = @get source[1]
    partsData = @get source[2]

    # 処理するの、xhr する時間に比べたら一瞬で終わるし全部ロードしてからでいい
    IF(colorsData.AND codesData.AND partsData) ->
      for [colorId, colorName, rrggbb] in colorsData.result
        colors[colorId] = colorNames[colorName] =
          { id: colorId, name: colorName, rgb: '#' + rrggbb }
      for [id, colorName] in codesData.result
        part = parts[id] or= { id, colors: [] }
        color = colorNames[colorName]
        if color not in part.colors
          part.colors.push color
      for [categoryId, categoryName, id, name] in partsData.result
        part = parts[id]
        continue unless part
        part.name = name
        category = categories[categoryId] or=
          { id: categoryId, name: categoryName, parts: [] }
        category.parts.push part

      callback({ categories, parts, colors })
    , ELSE ->
      errorCallback?()

  get: (url) ->
    r = new Retention()
    data = xhrget(url)
    IF(data) ->
      r.resolve(line.split('\t') for line in data.result.split('\n'))
    , ELSE ->
      r.reject()
    r

class StoreDataLoader
  baseurl = '/script/getstoredata'
  load: (callback, ids...) ->
    data = (xhrget(baseurl, { id }) for id in ids)
    # 全部ロードできたら
    IF(data.reduce (pre, cur) -> pre.AND cur) ->
      result = (JSON.parse(d.result) for d in data)
      callback(result)