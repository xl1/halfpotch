# -*- coding: utf-8 -*-

import webapp2
import json
import re
import logging
from datetime import datetime
from email.utils import parseaddr
from google.appengine.ext import ndb
from google.appengine.api import memcache, users
from google.appengine.ext.webapp.mail_handlers import InboundMailHandler

class Order(ndb.Model):
  username = ndb.StringProperty()
  date = ndb.DateTimeProperty()
  content = ndb.JsonProperty()


def getUserName():
  user = users.get_current_user()
  return user.nickname() if user else 'anonymous'


class OrderListHandler(webapp2.RequestHandler):
  def get(self, username):
    if not username:
      username = getUserName()
    orders = Order.query(Order.username == username).order(-Order.date).iter()

    orderList = []
    for order in orders:
      content = order.content
      content['id'] = order.key.id()
      orderList.append(content)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(orderList))


class OrderHandler(webapp2.RequestHandler):
  def update(self, order):
    content = json.loads(self.request.body)
    order.date = datetime.strptime(content['date'], '%Y-%m-%d')
    order.content = content
    order.put()
    content['id'] = order.key.id()
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(content))

  def post(self, method, orderid):
    if method == 'create':
      order = Order(username=getUserName())
      self.update(order)
      return
    elif method == 'update':
      order = Order.get_by_id(int(orderid))
      if order and order.username == getUserName():
        self.update(order)
        return
    elif method == 'delete':
      order = Order.get_by_id(int(orderid))
      if order and order.username == getUserName():
        order.key.delete()
        return
    self.error(404)


class LogInHandler(webapp2.RequestHandler):
  def get(self, type):
    if type == 'in':
      self.redirect(users.create_login_url('/logger/'))
    elif type == 'out':
      self.redirect(users.create_logout_url('/logger/'))


class UserHandler(webapp2.RequestHandler):
  def get(self):
    username = getUserName()
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps({
      'name': username,
      'isLoggedIn': username != 'anonymous'
    }))


class MailHandler(InboundMailHandler):
  def receive(self, message):
    content = u''
    for ctype, body in message.bodies('text/plain'):
      content += body.decode()

    # user
    _, address = parseaddr(message.to)
    username = address[:address.index('@')]

    # title
    m = re.search(r'BrickLink Order #(\d+)', message.subject)
    title = m.group(0) if m else message.subject

    # lots
    reLot = re.compile(r'\[(new|used)\] .+ \(x\d+\) \.+ .+$', re.IGNORECASE | re.MULTILINE)
    lotsText = '\n'.join(m.group(0) for m in reLot.finditer(content))

    # date
    reDate = re.compile(r'^\W*Order Date: (.*)$', re.MULTILINE)
    m = reDate.search(content)
    if m:
      # e.g. "Jul 27, 2013 09:30"
      date = datetime.strptime(m.group(1).strip(), '%b %d, %Y %H:%M')
    else:
      date = datetime.now()

    Order(
      username=username,
      content={
        'title': title,
        'comment': '',
        'date': datetime.strftime(date, '%Y-%m-%d'),
        'labels': [],
        'lots': [],
        'lotsText': lotsText,
        'unresolved': True
      },
      date=date
    ).put()


app = webapp2.WSGIApplication([
  (r'/logger/log(in|out)', LogInHandler),
  (r'/logger/api/verify', UserHandler),
  (r'/logger/api/orders/?(\w+)?', OrderListHandler),
  (r'/logger/api/order/(create)()', OrderHandler),
  (r'/logger/api/order/(\w+)/(\d+)', OrderHandler),
  MailHandler.mapping()
], debug=True)
