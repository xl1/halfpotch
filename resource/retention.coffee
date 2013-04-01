class Retention
  @IF = IF = (ret) -> (success, fail) ->
    if ret.resolved
      success?()
    else if ret.rejected
      fail?()
    else
      success and ret.successCallbacks.push success
      fail and ret.failCallbacks.push fail
    ret
  @UNLESS = UNLESS = (ret) -> (fail, success) ->
    IF(ret) success, fail
  @ELSE = ELSE = (x) -> x
  @NOT = NOT = (ret) ->
    r = new Retention()
    IF(ret) -> r.reject(ret.result)
    UNLESS(ret) -> r.resolve(ret.error)
    r
  @WHEN = WHEN = (ret) -> (callback) ->
    IF(ret) callback, callback

  result: null
  error: null
  resolved: false
  rejected: false

  constructor: ->
    @successCallbacks = []
    @failCallbacks = []

  resolve: (result) ->
    return if @resolved or @rejected
    @resolved = true
    @result = result
    f() for f in @successCallbacks
    return
  reject: (error) ->
    return if @resolved or @rejected
    @rejected = true
    @error = error
    f() for f in @failCallbacks
    return

  AND: (ret) ->
    r = new Retention()
    IF(@) => IF(ret) -> r.resolve()
    IF(ret) => IF(@) -> r.resolve()
    UNLESS(@) -> r.reject()
    UNLESS(ret) -> r.reject()
    r
  DAND: (ret) ->
    # delayed and
    # どちらかが reject されても、もう一つが resolve または reject されるまで待つ
    r = new Retention()
    IF(@) => IF(ret) -> r.resolve()
    IF(ret) => IF(@) -> r.resolve()
    UNLESS(@) => WHEN(ret) -> r.reject()
    UNLESS(ret) => WHEN(@) -> r.reject()
    r

  OR: (ret) ->
    # どちらかが resolve された時点で resolve
    # 両方の result をとれるとは限らない
    r = new Retention()
    IF(@) -> r.resolve()
    IF(ret) -> r.resolve()
    UNLESS(@) => UNLESS(ret) -> r.reject()
    UNLESS(ret) => UNLESS(@) -> r.reject()
    r
  DOR: (ret) ->
    # delayed or
    # どちらかが resolve されても、もう一つが resolve または reject されるまで待つ
    # もし resolve した場合は両方の result が取れる
    r = new Retention()
    IF(@) => WHEN(ret) -> r.resolve()
    IF(ret) => WHEN(@) -> r.resolve()
    UNLESS(@) => UNLESS(ret) -> r.reject()
    UNLESS(ret) => UNLESS(@) -> r.reject()
    r