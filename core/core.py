# -*- encoding:utf-8 -*-

from google.appengine.ext import db
from google.appengine.api import urlfetch

class Fragment(db.Model):
  last = db.BooleanProperty()
  data = db.TextProperty()

def dbSaveText(key, text):
  # 1MB ごとに分割して保存
  MAXFILESIZE = 1000000
  maxnum = len(text) / MAXFILESIZE
  for i in range(maxnum + 1): # 1MB ごとに分割
    content = text[i * MAXFILESIZE : (i + 1) * MAXFILESIZE]
    frag = Fragment.get_or_insert(key + '@' + str(i))
    frag.data = db.Text(content, encoding='utf_8')
    frag.last = (i == maxnum)
    frag.put()

def dbLoadText(key):
  content = ''
  i = 0
  while True:
    frag = Fragment.get_by_key_name(key + '@' + str(i))
    i += 1
    if not frag:
      return None
    content += frag.data
    if frag.last:
      return content

def fetch(url, headers={}):
  try:
    result = urlfetch.fetch(url, headers=headers, deadline=10)
  except urlfetch.DownloadError:
    return None
  if result.status_code != 200:
    return None
  return result
