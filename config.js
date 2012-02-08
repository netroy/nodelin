var config = module.exports;

config.proxy = {
  'port': 5000,
  'maxRequestsPerWorker': 1000,
  'table': 'data/proxy_table.json',
  'domain': 'nodehost.com'
};

config.app = {
  'port': 8000,
  'public': 'public',
  'staticAge': 86400*365,
  'sessions': {
    'key': 'myKeyIsAwesome',
    'secret': 'mySecretIsAwesomer',
    'expires': 86400*1000
  }
};

config.couchdb = {
  'username': 'nodehost',
  'password': 'password',
  'hostname': '127.0.0.1',
  'port': '5984',
  'prefix': 'NH'
};
