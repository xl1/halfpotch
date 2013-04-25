#!/usr/bin/env python
# -*- encoding:utf-8 -*-

import webapp2
import re
import json
from xml.sax.saxutils import unescape
from google.appengine.api import urlfetch
from google.appengine.ext import db

class Fragment(db.Model):
  last = db.BooleanProperty()
  data = db.TextProperty()

class BrickLinkData(webapp2.RequestHandler):
  def get(self):
    # fetch CSV data from Bricklink.com
    MAXFILESIZE = 1000000

    # num = 0(parts), 3(colors), or 5(codes)
    num = self.request.get('num')
    url = 'http://www.bricklink.com/catalogDownload.asp' + \
          '?a=a&itemType=P&downloadType=T&viewType=' + num
    try:
      result = urlfetch.fetch(url, deadline=10)
    except urlfetch.DownloadError:
      return
    if result.status_code != 200:
      return

    maxnum = len(result.content) / MAXFILESIZE
    for j in range(maxnum+1): # 1MB ごとに分割
      content = result.content[j*MAXFILESIZE : (j+1)*MAXFILESIZE]
      frag = Fragment.get_or_insert(num + '@' + str(j))
      frag.data = db.Text(content, encoding='utf_8')
      frag.last = (j == maxnum)
      frag.put()
    self.response.out.write('succeeded')

class PartsData(webapp2.RequestHandler):
  def get(self):
    # serve CSV data of categories, codes, and colors
    i = 0
    self.response.headers['Content-Type'] = 'text/plain'
    while True:
      frag = Fragment.get_by_key_name(self.request.get('num') + '@' + str(i))
      i += 1
      if not frag:
        self.error(404)
        break
      self.response.out.write(frag.data)
      if frag.last:
        break

class StoreData(webapp2.RequestHandler):
  def get(self):
    part = self.request.get('part')
    color = self.request.get('color')
    amount = int(self.request.get('amount'))
    result = []

    url = 'http://www.bricklink.com/catalogPG.asp' + \
          '?P=' + part + '&colorID=' + color
    try:
      source = urlfetch.fetch(
        url,
        headers={ 'Cookie': 'isCountryID=JP; viewCurrencyID=74; rememberMe=N' },
        deadline=10
      )
    except urlfetch.DownLoadError:
      return self.error(500)
    if source.status_code != 200:
      return self.error(500)

    frame = re.search(
      'Currently Available(.*)Currently Available', source.content
    )
    if not frame:
      return self.error(500)
    
    pattern = re.compile(r"""
      <TR\ ALIGN="RIGHT">
        <TD\ NOWRAP>
          &nbsp;
          <A\ HREF="(/store\.asp\?sID=(\w+)&itemID=\w+)">
            <IMG\ SRC="/images/box16Y\.png" .*? ALT="Store:\ ([^"]+)" .*? >
          </A>
          &nbsp;
        </TD>
        <TD>(\d+)</TD>
        <TD>&nbsp;~JPY&nbsp;([.0-9]+)</TD>
      </TR>
    """, re.VERBOSE) # unescaped spaces は無視
    for match in pattern.findall(frame.group(1)):
      url, sID, name, lot, price = match
      lot = int(lot)
      if lot >= amount and lot >= 8:
        result.append({
          'id': sID,
          'name': unescape(name),
          'price': float(price),
          'url': url
        })

    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(result))


app = webapp2.WSGIApplication([
  ('/optimizer/app/getpartsdata', PartsData),
  ('/optimizer/app/getstoredata', StoreData),
  ('/optimizer/app/fetchbldata', BrickLinkData)
], debug=True)