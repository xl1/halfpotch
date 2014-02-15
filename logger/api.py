# -*- coding: utf-8 -*-

import webapp2
import json
import logging
from datetime import datetime
from google.appengine.ext import ndb
from google.appengine.api import memcache, users
from google.appengine.ext.webapp.mail_handlers import InboundMailHandler
import mailservice

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


def putOrderInformation(info, username):
    date = info.getOrderDate()
    lotsText = info.getLotsText()
    if lotsText:
      order = Order(
        username=username,
        content={
          'title': info.getTitle(),
          'comment': '',
          'date': datetime.strftime(date, '%Y-%m-%d'),
          'labels': [],
          'lots': [],
          'lotsText': lotsText,
          'unresolved': True
        },
        date=date
      )
      order.put()
      return order


class MailImportHandler(webapp2.RequestHandler):
  def post(self):
    username = getUserName()
    mbox = self.request.get('file')
    for minfo in mailservice.MboxInformation(mbox):
      info = mailservice.OrderInformation(minfo)
      putOrderInformation(info, username)


class MailHandler(InboundMailHandler):
  def receive(self, message):
    minfo = mailservice.MessageInformation(message.original)
    info = mailservice.OrderInformation(minfo)
    putOrderInformation(info, info.getRecipientUserName())


app = webapp2.WSGIApplication([
  (r'/logger/log(in|out)', LogInHandler),
  (r'/logger/api/verify', UserHandler),
  (r'/logger/api/orders/?(\w+)?', OrderListHandler),
  (r'/logger/api/order/(create)()', OrderHandler),
  (r'/logger/api/order/(\w+)/(\d+)', OrderHandler),
  (r'/logger/api/import', MailImportHandler),
  MailHandler.mapping()
], debug=True)
