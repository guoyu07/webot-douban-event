var pwd = process.cwd();
var user = require(pwd + '/lib/user');

var douban = require(pwd + '/lib/douban');
var parser = require(pwd + '/lib/parser');

var cmds = ['search|搜索|s', 'stop_search|别闹了'];

module.exports = {
  'parser': function(info, next) {
    var _text = info.text;

    // parse command
    var lead = _text.split(/\s+/)[0];
    for (var i = 0, l = cmds.length; i < l; i++) {
      if (lead.search(cmds[i]) === 0) {
        info.cmd = _text.cmd = cmds[i].split('|')[0];
      }
    }
    info.param = parser.listParam(info.text);
    info.param._text = _text;
    var uid = info.param.uid = info.from;
    var u = info.u = user(uid);

    var loc = info.param['loc'];
    if (loc) {
      info._ori_loc = loc;
      u.setLoc(loc);
      next(null, info);
    } else {
      u.getLoc(function(err, loc) {
        if (loc) {
          info.param['loc'] = loc;
        }
        next(null, info);
      });
    }
  },
  'handler': function(info, next) {
    var uid = info.from;
    var u = user(uid);

    // is waiting for user to reply a city name
    var want_city = this.waiter.data(uid, 'want_city');
    var loc = info.param['loc'];

    if (want_city && loc) {
      this.waiter(uid, 'want_city', null);
      u.setLoc(loc);
      this.waiter.pass(uid, want_city);
      var q = this.waiter.data(uid, 'q');
      var type = this.waiter.data(uid, 'type');
      if (type && !q) {
        info.ended = true;
        return douban.list({ loc: loc, type: type }, next);
      } else if (q) {
        //info.param['type'] = type;
        info.param['q'] = q;
        info.ended = true;
        return douban.search(info.param, next);
      }
    }
    next();
  }
};

