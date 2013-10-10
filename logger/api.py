# -*- coding: utf-8 -*-

import webapp2
import json
from datetime import datetime
from google.appengine.ext import ndb
from google.appengine.api import memcache, users

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


app = webapp2.WSGIApplication([
  (r'/logger/log(in|out)', LogInHandler),
  (r'/logger/api/verify', UserHandler),
  (r'/logger/api/orders/?(\w+)?', OrderListHandler),
  (r'/logger/api/order/(create)()', OrderHandler),
  (r'/logger/api/order/(\w+)/(\d+)', OrderHandler)
], debug=True)
