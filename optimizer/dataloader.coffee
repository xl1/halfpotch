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
  load: (callback, errorCallback) ->
    colors = {}
    colorNames = {}
    parts = {}
    categories = {}

    baseurl = constants.optimizer.appurl + '/getpartsdata'
    colorsData = @get baseurl + '?num=3'
    codesData = @get baseurl + '?num=5'
    partsData = @get baseurl + '?num=0'

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
        category = categories[categoryId] or=
          { id: categoryId, name: categoryName, parts: [] }
        part.name = name
        part.categoryId = categoryId
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
  load: (callback, errorCallback, params) ->
    baseurl = constants.optimizer.appurl + '/getstoredata'
    data = (xhrget(baseurl, param) for param in params)
    # 全部ロードできたら
    IF(data.reduce (pre, cur) -> pre.AND cur) ->
      result = (JSON.parse(d.result) for d in data)
      callback(result)
    , ELSE ->
      errorCallback()